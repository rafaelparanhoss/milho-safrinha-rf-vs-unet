/****************************************************
 * UNET GTv2 LABEL EXPORT
 * MT 2023 - tiled / batch
 *
 * Purpose:
 * - Build train/test/val labels from SAMPLES_FINAL/VAL_FINAL
 * - Export one GTv2 tile with 3 bands:
 *   gt_train, gt_test, gt_val
 * - Pixels outside polygons are 255 (ignore)
 ****************************************************/

// ==============================
// A) ROI: MT
// ==============================
var estados  = ee.FeatureCollection(table);
var estadoMT = estados.filter(ee.Filter.eq('SIGLA_UF', 'MT')).first();
var geomMT   = estadoMT.geometry();

Map.centerObject(estadoMT, 6);

// ==============================
// B) Tile/export parameters
// ==============================
var TILE_DEG = 1.0;

var BATCH_START = 0;
var BATCH_SIZE  = 170;

var LON_MIN = -62.0;
var LON_MAX = -49.0;
var LAT_MIN = -19.0;
var LAT_MAX =  -6.0;

var DRIVE_FOLDER = 'GEE_Exports';
var PREFIX = 'unet_mt_2023';
var GT_PREFIX = PREFIX + '_gtv2';

var seed  = 42;
var split = 0.7;
var USE_C10_FILTER = true;

function safeTag(n) {
  return String(n.toFixed(2)).replace(/\./g, 'p');
}

// ==============================
// C) C10 agri mask for optional filtering
// ==============================
var c10 = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2');
var agriMask2023 = c10.select('classification_2023')
  .remap([39, 41, 62, 20], [1, 1, 1, 0])
  .eq(1)
  .clip(geomMT)
  .rename('agri');

Map.addLayer(agriMask2023.selfMask(), {palette:['00FF00']}, 'C10 agri mask');

// ==============================
// D) Assets and label preparation
// ==============================
var SAMPLES_ASSET = 'projects/ee-rafaelparanhos/assets/SAMPLES_FINAL';
var VAL_ASSET     = 'projects/ee-rafaelparanhos/assets/VAL_FINAL';

var samplesRaw = ee.FeatureCollection(SAMPLES_ASSET);
var valRaw     = ee.FeatureCollection(VAL_ASSET);

function standardizeGT(fc) {
  return fc.map(function(f){
    return ee.Feature(f.geometry(), {
      'class': ee.Number(f.get('class')).toInt(),
      'id':    ee.Number(f.get('id')).toInt()
    });
  });
}

function tagAndFilterByMaskGT(fc, maskImg, scale) {
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

    var v = ee.Algorithms.If(d.get('agri'), d.get('agri'), 0);
    return f.set('in_mask', ee.Number(v).toInt());
  });

  return tagged.filter(ee.Filter.eq('in_mask', 1)).select(['class','id']);
}

function makeLabelImage(fc, bandName) {
  return ee.Image.constant(255).toByte()
    .paint(fc, 'class')
    .rename(bandName);
}

var samplesStd = standardizeGT(samplesRaw);
var valStd     = standardizeGT(valRaw);

var samplesIn = ee.FeatureCollection(ee.Algorithms.If(
  USE_C10_FILTER, tagAndFilterByMaskGT(samplesStd, agriMask2023, 30), samplesStd
));

var valIn = ee.FeatureCollection(ee.Algorithms.If(
  USE_C10_FILTER, tagAndFilterByMaskGT(valStd, agriMask2023, 30), valStd
));

var samplesRand = samplesIn.randomColumn('rand', seed);
var trainPolys  = samplesRand.filter(ee.Filter.lt('rand', split));
var testPolys   = samplesRand.filter(ee.Filter.gte('rand', split));
var valPolys    = valIn;

var gtTrain = makeLabelImage(trainPolys, 'gt_train');
var gtTest  = makeLabelImage(testPolys,  'gt_test');
var gtVal   = makeLabelImage(valPolys,   'gt_val');
var gtAll   = gtTrain.addBands(gtTest).addBands(gtVal);

Map.addLayer(gtTrain.eq(1).selfMask(), {palette:['FF00FF']}, 'GTv2 train == 1');

// ==============================
// E) Export GTv2 tiles
// ==============================
var idxGT = 0;
var exportedGT = 0;

for (var lon = LON_MIN; lon < LON_MAX; lon += TILE_DEG) {
  for (var lat = LAT_MIN; lat < LAT_MAX; lat += TILE_DEG) {
    if (idxGT < BATCH_START || idxGT >= (BATCH_START + BATCH_SIZE)) {
      idxGT++;
      continue;
    }

    var x0 = lon, y0 = lat, x1 = lon + TILE_DEG, y1 = lat + TILE_DEG;
    var tile = ee.Geometry.Rectangle([x0, y0, x1, y1], null, false);

    var nameGT = GT_PREFIX + '_x' + safeTag(x0) + '_y' + safeTag(y0);

    Export.image.toDrive({
      image: gtAll.clip(tile).toByte(),
      description: nameGT,
      folder: DRIVE_FOLDER,
      fileNamePrefix: nameGT,
      region: tile,
      scale: 30,
      maxPixels: 1e13,
      fileFormat: 'GeoTIFF',
      formatOptions: {cloudOptimized: true}
    });

    exportedGT += 1;
    idxGT++;
  }
}

print('GTv2 tasks created:', exportedGT);
print('Batch range:', BATCH_START, 'to', (BATCH_START + BATCH_SIZE - 1));
