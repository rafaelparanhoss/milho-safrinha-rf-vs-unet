/****************************************************
 * DISSERTAÇÃO — MILHO SAFRINHA — MT (2023) — RF (GEE)
 *
 * Objetivo
 * - Classificar MILHO (1) vs NAO_MILHO (0) em 2023 (Fev–Mai) no estado de MT
 * - Modelo: Random Forest (smileRandomForest)
 * - Preditores: Landsat 8 + 9 (Collection 2, Level-2) com estatísticas (mediana, p20, p80)
 * - Normalização: clamps fixos (0–1) iguais ao seu padrão Remap
 *
 * Metodologia (consolidada)
 * 1) ROI: Estado de Mato Grosso (MT)
 * 2) Máscara agrícola: MapBiomas Coleção 10 (ano 2023) — aplicada:
 *    - (a) no mosaico usado para amostrar (treino/teste/val)
 *    - (b) no mapa final e no cálculo de área
 * 3) Amostras:
 *    - SAMPLES_FINAL: treino/teste (split por feição)
 *    - VAL_FINAL: validação externa (não entra no treino)
 *    - Campos esperados (ambas FCs): class (0/1) e id (inteiro único)
 * 4) Amostragem:
 *    - Geração de pontos aleatórios por polígono (k por feição) para controlar volume
 *    - sampleRegions sobre mosaico já mascarado (agri==1)
 * 5) Avaliação:
 *    - Interna: teste (SAMPLES_FINAL hold-out) -> export CSV (class, pred)
 *    - Externa: VAL_FINAL -> export CSV (id, class, pred)
 * 6) Saídas:
 *    - Raster classificação final (Byte, mascarado C10)
 *    - Raster binário milho (1) (Byte, mascarado C10) para área fora do GEE
 *    - Export do classificador para Asset
 ****************************************************/

// ==============================
// BLOCO 1 — Parâmetros gerais + ROI + Assets
// ==============================

// ---- Período do mosaico (safrinha) ----
var startDate = ee.Date('2023-02-01');
var endDate   = ee.Date('2023-05-31');

// ---- Reprodutibilidade e split ----
var seed  = 42;
var split = 0.7;   // 70% treino / 30% teste

// ---- Campos esperados nas FCs ----
var CLASS_FIELD = 'class'; // 0/1
var ID_FIELD    = 'id';    // inteiro único por feição

// ---- Amostragem (pontos por polígono) ----
var kTrain = 130;  // pontos por polígono de treino
var kTest  = 70;   // pontos por polígono de teste
var kVal   = 80;   // pontos por polígono de validação externa

// simplificação geométrica para reduzir custo (metros)
var simplifyTol = 30;

// ---- Assets ----
var SAMPLES_ASSET = 'projects/ee-rafaelparanhos/assets/SAMPLES_FINAL';
var VAL_ASSET     = 'projects/ee-rafaelparanhos/assets/VAL_FINAL';
var UF_ASSET      = 'projects/ee-rafaelparanhos/assets/UF';

// ---- UF / ROI ----
var estados  = ee.FeatureCollection(UF_ASSET);
var estadoMT = estados.filter(ee.Filter.eq('SIGLA_UF', 'MT')).first();
var geomMT   = estadoMT.geometry();

// OPÇÃO B: trabalhar no MT inteiro
var roi = geomMT;

// ---- Visual base ----
Map.centerObject(estadoMT, 6);

var fundoPreto = ee.Image.constant(1).clip(estadoMT).visualize({
  palette: ['000000'],
  opacity: 0.75
});
Map.addLayer(fundoPreto, {}, 'Fundo Preto MT');

// ---- Carrega amostras (checagem; padronização no BLOCO 4) ----
var samplesRaw = ee.FeatureCollection(SAMPLES_ASSET);
var valRaw     = ee.FeatureCollection(VAL_ASSET);

print('SAMPLES_FINAL (n):', samplesRaw.size());
print('SAMPLES_FINAL campos:', samplesRaw.first().propertyNames());
print('VAL_FINAL (n):', valRaw.size());
print('VAL_FINAL campos:', valRaw.first().propertyNames());


// ==============================
// BLOCO 2 — Landsat 8+9 (C2 L2) + máscara de nuvem + EVI2
// ==============================

// Máscara de nuvens/sombra (Landsat Collection 2, Level-2)
function maskLandsatSR(image) {
  var qa = image.select('QA_PIXEL');

  // bits usuais (C2 L2)
  // 2: cirrus, 3: cloud, 4: cloud shadow, 5: snow
  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0))
    .and(qa.bitwiseAnd(1 << 2).eq(0));

  return image.updateMask(mask);
}

// Monta coleção L8+L9 no período e ROI, renomeia bandas e adiciona EVI2
function getCollectionL8L9(startDate, endDate, roi) {
  var col8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
  var col9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');

  var col = col8.merge(col9)
    .filterDate(startDate, endDate)
    .filterBounds(roi)
    .filter(ee.Filter.lt('CLOUD_COVER_LAND', 40))
    .map(maskLandsatSR)
    .select(
      ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'],
      ['BLUE','GREEN','RED','NIR','SWIR1','SWIR2']
    )
    .map(function(img) {
      var evi2 = img.expression(
        '2.5 * ((NIR - RED) / (NIR + 2.4 * RED + 1))',
        {NIR: img.select('NIR'), RED: img.select('RED')}
      ).rename('EVI2');
      return img.addBands(evi2);
    });

  return col;
}

// Coleção 2023
var col2023 = getCollectionL8L9(startDate, endDate, roi);
print('Landsat (L8+L9) 2023 size:', col2023.size());


// ==============================
// BLOCO 3 — Mosaico (mediana + p20/p80) + normalização (clamps) + máscara C10
// ==============================

// Reduz (mediana + p20/p80) e normaliza para 0–1 com clamps fixos (padrão Remap)
function reduceAndNormalize(collection, roi) {
  var mosaic = collection.reduce(
    ee.Reducer.median().combine(ee.Reducer.percentile([20, 80]), '', true)
  ).clip(roi);

  var mosaicNorm = ee.Image.cat([
    mosaic.select('BLUE_median').clamp(7852.67, 9072.92).unitScale(7852.67, 9072.92).rename('BLUE_median'),
    mosaic.select('BLUE_p20')   .clamp(7852.67, 9072.92).unitScale(7852.67, 9072.92).rename('BLUE_p20'),
    mosaic.select('BLUE_p80')   .clamp(7852.67, 9072.92).unitScale(7852.67, 9072.92).rename('BLUE_p80'),

    mosaic.select('GREEN_median').clamp(8385.29, 10610.21).unitScale(8385.29, 10610.21).rename('GREEN_median'),
    mosaic.select('GREEN_p20')   .clamp(8385.29, 10610.21).unitScale(8385.29, 10610.21).rename('GREEN_p20'),
    mosaic.select('GREEN_p80')   .clamp(8385.29, 10610.21).unitScale(8385.29, 10610.21).rename('GREEN_p80'),

    mosaic.select('RED_median').clamp(8070.54, 11386.66).unitScale(8070.54, 11386.66).rename('RED_median'),
    mosaic.select('RED_p20')     .clamp(8070.54, 11386.66).unitScale(8070.54, 11386.66).rename('RED_p20'),
    mosaic.select('RED_p80')     .clamp(8070.54, 11386.66).unitScale(8070.54, 11386.66).rename('RED_p80'),

    mosaic.select('NIR_median').clamp(14986.16, 28030.05).unitScale(14986.16, 28030.05).rename('NIR_median'),
    mosaic.select('NIR_p20')     .clamp(14986.16, 28030.05).unitScale(14986.16, 28030.05).rename('NIR_p20'),
    mosaic.select('NIR_p80')     .clamp(14986.16, 28030.05).unitScale(14986.16, 28030.05).rename('NIR_p80'),

    mosaic.select('SWIR1_median').clamp(11411.19, 18811.92).unitScale(11411.19, 18811.92).rename('SWIR1_median'),
    mosaic.select('SWIR1_p20')   .clamp(11411.19, 18811.92).unitScale(11411.19, 18811.92).rename('SWIR1_p20'),
    mosaic.select('SWIR1_p80')   .clamp(11411.19, 18811.92).unitScale(11411.19, 18811.92).rename('SWIR1_p80'),

    mosaic.select('SWIR2_median').clamp(8883.87, 14716.15).unitScale(8883.87, 14716.15).rename('SWIR2_median'),
    mosaic.select('SWIR2_p20')   .clamp(8883.87, 14716.15).unitScale(8883.87, 14716.15).rename('SWIR2_p20'),
    mosaic.select('SWIR2_p80')   .clamp(8883.87, 14716.15).unitScale(8883.87, 14716.15).rename('SWIR2_p80'),

    mosaic.select('EVI2_median').clamp(0.30085, 1.01173).unitScale(0.30085, 1.01173).rename('EVI2_median'),
    mosaic.select('EVI2_p20')    .clamp(0.30085, 1.01173).unitScale(0.30085, 1.01173).rename('EVI2_p20'),
    mosaic.select('EVI2_p80')    .clamp(0.30085, 1.01173).unitScale(0.30085, 1.01173).rename('EVI2_p80')
  ]);

  return mosaicNorm;
}

// Mosaico normalizado (MT) e visual rápido
var mosaic2023 = reduceAndNormalize(col2023, roi);
print('mosaic2023 bands:', mosaic2023.bandNames());

Map.addLayer(
  mosaic2023,
  {bands:['NIR_median','SWIR1_median','RED_median'], min:0, max:1},
  'Mosaico norm. 2023 (NIR/SWIR1/RED)'
);

// ----- Máscara Agricultura MapBiomas C10 (ano 2023) -----
var c10 = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2');

var agriMask2023 = c10.select('classification_2023')
  .remap([39, 41, 62, 20], [1, 1, 1, 0])
  .eq(1)
  .clip(roi);

// Mosaico de trabalho (MT inteiro, já DENTRO da máscara C10)
var mosaicMT   = mosaic2023.clip(geomMT);
var mosaicWork = mosaicMT.updateMask(agriMask2023);

Map.addLayer(agriMask2023.selfMask(), {palette:['00FF00']}, 'Mask C10 (agri=1)');


// ==============================
// BLOCO 4 — Amostras (SAMPLES_FINAL + VAL_FINAL) padronização + filtro pela máscara C10 + split por feição
// ==============================

print('SAMPLES_FINAL (n bruto):', samplesRaw.size());
print('VAL_FINAL (n bruto):', valRaw.size());

// Padroniza: garante class/id inteiros
function standardize(fc) {
  return fc.map(function(f){
    return ee.Feature(f.geometry(), {
      'class': ee.Number(f.get(CLASS_FIELD)).toInt(),
      'id':    ee.Number(f.get(ID_FIELD)).toInt()
    });
  });
}

var samplesStd = standardize(samplesRaw);
var valStd     = standardize(valRaw);

// Tag + filtro: mantém polígonos que intersectam pixels agri=1
function tagAndFilterByMask(fc, maskImg, scale) {
  var mask = maskImg.rename('agri');

  var tagged = fc.map(function(f){
    var d = mask.reduceRegion({
      reducer: ee.Reducer.max(),
      geometry: f.geometry(),
      scale: scale,
      maxPixels: 1e7,
      bestEffort: true,
      tileScale: 8
    });

    // pode vir null -> 0
    var v = ee.Algorithms.If(d.get('agri'), d.get('agri'), 0);

    return f.set('in_mask', ee.Number(v).toInt());
  });

  return tagged
    .filter(ee.Filter.eq('in_mask', 1))
    .select(['class','id']);
}

var samplesIn = tagAndFilterByMask(samplesStd, agriMask2023, 30);
var valIn     = tagAndFilterByMask(valStd,     agriMask2023, 30);

print('SAMPLES_FINAL dentro C10 (n):', samplesIn.size());
print('SAMPLES_FINAL dentro C10 hist:', samplesIn.aggregate_histogram('class'));

print('VAL_FINAL dentro C10 (n):', valIn.size());
print('VAL_FINAL dentro C10 hist:', valIn.aggregate_histogram('class'));

Map.addLayer(ee.Image().byte().paint(samplesIn, 1, 2), {palette:['00FFFF']}, 'SAMPLES_FINAL (in C10)');
Map.addLayer(ee.Image().byte().paint(valIn,     1, 2), {palette:['FF00FF']}, 'VAL_FINAL (in C10)');

// Split treino/teste por FEIÇÃO
var samplesRand = samplesIn.randomColumn('rand', seed);
var trainPolys  = samplesRand.filter(ee.Filter.lt('rand', split));
var testPolys   = samplesRand.filter(ee.Filter.gte('rand', split));

print('trainPolys (in C10):', trainPolys.size(), 'hist:', trainPolys.aggregate_histogram('class'));
print('testPolys  (in C10):', testPolys.size(),  'hist:', testPolys.aggregate_histogram('class'));

// Simplify (opcional)
trainPolys = trainPolys.map(function(f){ return ee.Feature(f).setGeometry(f.geometry().simplify(simplifyTol)); });
testPolys  = testPolys.map(function(f){ return ee.Feature(f).setGeometry(f.geometry().simplify(simplifyTol)); });
var valPolys = valIn.map(function(f){ return ee.Feature(f).setGeometry(f.geometry().simplify(simplifyTol)); });


// ==============================
// BLOCO 5 — Pontos por polígono + amostragem do mosaico mascarado (mosaicWork) + treino RF
// ==============================

function pointsInsidePolys(fc, k, seedBase, keepId) {
  var out = ee.FeatureCollection(fc.iterate(function(f, acc){
    f = ee.Feature(f);
    acc = ee.FeatureCollection(acc);

    var sid = ee.Number(f.get('id')).add(seedBase);

    var pts = ee.FeatureCollection.randomPoints(f.geometry(), k, sid)
      .map(function(p){
        var d = {'class': f.get('class')};
        if (keepId) d.id = f.get('id');
        return ee.Feature(p).set(d);
      });

    return acc.merge(pts);
  }, ee.FeatureCollection([])));

  return out;
}

var trainPtsGeom = pointsInsidePolys(trainPolys, kTrain, seed + 10,   false);
var testPtsGeom  = pointsInsidePolys(testPolys,  kTest,  seed + 999,  false);
var valPtsGeom   = pointsInsidePolys(valPolys,   kVal,   seed + 2023, true);

print('trainPtsGeom:', trainPtsGeom.size(), trainPtsGeom.aggregate_histogram('class'));
print('testPtsGeom :', testPtsGeom.size(),  testPtsGeom.aggregate_histogram('class'));
print('valPtsGeom  :', valPtsGeom.size(),   valPtsGeom.aggregate_histogram('class'));

var inputBands = mosaicWork.bandNames();

var trainPts = mosaicWork.sampleRegions({
  collection: trainPtsGeom,
  properties: ['class'],
  scale: 30,
  geometries: false,
  tileScale: 8
});

var targetPerClass = 40000;

var train0 = trainPts.filter(ee.Filter.eq('class', 0)).randomColumn('r', seed).sort('r').limit(targetPerClass);
var train1 = trainPts.filter(ee.Filter.eq('class', 1)).randomColumn('r', seed).sort('r').limit(targetPerClass);

var trainPtsBalanced = train0.merge(train1);

print('trainPtsBalanced hist:', trainPtsBalanced.aggregate_histogram('class'));
print('trainPtsBalanced n:', trainPtsBalanced.size());

var testPts = mosaicWork.sampleRegions({
  collection: testPtsGeom,
  properties: ['class'],
  scale: 30,
  geometries: false,
  tileScale: 8
});

var valPts = mosaicWork.sampleRegions({
  collection: valPtsGeom,
  properties: ['class','id'],
  scale: 30,
  geometries: false,
  tileScale: 8
});

print('trainPts (n):', trainPts.size());
print('testPts  (n):', testPts.size());
print('valPts   (n):', valPts.size());

var classifier = ee.Classifier.smileRandomForest({numberOfTrees: 300, seed: seed, bagFraction: 0.7})
  .train({
    features: trainPtsBalanced,
    classProperty: 'class',
    inputProperties: inputBands
  });

// ==============================
// BLOCO 6 — Avaliação via EXPORT + mapa final + área (ha) dentro da máscara
// ==============================

// (1) Predição no teste (validação interna)
var testPred = testPts.classify(classifier).map(function(f){
  return ee.Feature(null, {
    'class': ee.Number(f.get('class')).toInt(),
    'pred' : ee.Number(f.get('classification')).toInt()
  });
});

Export.table.toDrive({
  collection: testPred,
  description: 'RF_testPred_MT_2023_C10',
  folder: 'GEE_Exports',
  fileNamePrefix: 'rf_testPred_mt_2023_c10',
  fileFormat: 'CSV'
});

// (2) Predição na validação externa
var valPred = valPts.classify(classifier).map(function(f){
  return ee.Feature(null, {
    'id'   : ee.Number(f.get('id')).toInt(),
    'class': ee.Number(f.get('class')).toInt(),
    'pred' : ee.Number(f.get('classification')).toInt()
  });
});

Export.table.toDrive({
  collection: valPred,
  description: 'RF_valPred_MT_2023_C10',
  folder: 'GEE_Exports',
  fileNamePrefix: 'rf_valPred_mt_2023_c10',
  fileFormat: 'CSV'
});

// Mapa final (já dentro da máscara C10, para MT inteiro)
var class2023_mask = mosaicWork.classify(classifier)
  .rename('classification')
  .clip(geomMT);

// Visual leve
var classVis = class2023_mask.reproject({crs: mosaicMT.projection(), scale: 120});
Map.addLayer(classVis, {min: 0, max: 1, palette: ['gray','yellow']}, 'RF 2023 (mask C10) [vis 120m]');

// Export mapa final (Byte)
Export.image.toDrive({
  image: class2023_mask.toByte(),
  description: 'RF_MILHO_MT_2023_C10',
  folder: 'GEE_Exports',
  fileNamePrefix: 'rf_milho_mt_2023_c10',
  region: geomMT,
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  formatOptions: {cloudOptimized: true}
});

// Export binário milho=1 (para área fora)
var milhoBin = class2023_mask.eq(1).selfMask().toByte();

Export.image.toDrive({
  image: milhoBin,
  description: 'RF_MILHO_MASK1_MT_2023_C10',
  folder: 'GEE_Exports',
  fileNamePrefix: 'rf_milho_mask1_mt_2023_c10',
  region: geomMT,
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  formatOptions: {cloudOptimized: true}
});

// Export RGB (NIR/SWIR1/RED) recortado pela máscara C10
var rgb = mosaicMT
  .select(['NIR_median','SWIR1_median','RED_median'])
  .visualize({min: 0, max: 1});

var rgb_agri = rgb.updateMask(agriMask2023);

Export.image.toDrive({
  image: rgb_agri,
  description: 'MOSAICO_2023_RGB_NIR_SWIR1_RED_C10',
  folder: 'GEE_Exports',
  fileNamePrefix: 'mosaic2023_rgb_nir_swir1_red_c10',
  region: geomMT,
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  formatOptions: {cloudOptimized: true}
});


// ==============================
// BLOCO 7 — Exports finais (classificador) + auditoria do treino
// ==============================

Export.classifier.toAsset({
  classifier: classifier,
  description: 'Export_RF_Milho_MT_2023_C10',
  assetId: 'users/Rafaelparanhos/rf_milho_mt_2023_c10'
});

var trainPred = trainPts.classify(classifier).map(function(f){
  return ee.Feature(null, {
    'class': ee.Number(f.get('class')).toInt(),
    'pred' : ee.Number(f.get('classification')).toInt()
  });
});

Export.table.toDrive({
  collection: trainPred,
  description: 'RF_trainPred_MT_2023_C10',
  folder: 'GEE_Exports',
  fileNamePrefix: 'rf_trainPred_mt_2023_c10',
  fileFormat: 'CSV'
});
