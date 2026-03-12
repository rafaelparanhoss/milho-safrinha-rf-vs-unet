/****************************************************
 * UNET EXPORT (COMBINED, LEGACY ENTRYPOINT)
 * MT 2023 (Feb-May) - tiled / batch
 *
 * Canonical split scripts:
 * - gee/unet/export_unet_mosaic_c10_mt_2023.js
 * - gee/unet/export_unet_gtv2_mt_2023.js
 *
 * This file remains for backward compatibility and can
 * run both exports without manual comment/uncomment.
 ****************************************************/

// Toggle blocks explicitly (no manual commented exports)
var RUN_EXPORT_MOSAIC_C10 = true;
var RUN_EXPORT_GTV2 = true;

// ==============================
// A) ROI: MT
// ==============================
var estados  = ee.FeatureCollection(table);
var estadoMT = estados.filter(ee.Filter.eq('SIGLA_UF', 'MT')).first();
var geomMT   = estadoMT.geometry();
var roi      = geomMT;

Map.centerObject(estadoMT, 6);

// ==============================
// B) Shared export parameters
// ==============================
var TILE_DEG = 1.0;

var BATCH_START = 0;   // 0, then 40, 80, ...
var BATCH_SIZE  = 170; // tasks per script run

var LON_MIN = -62.0;
var LON_MAX = -49.0;
var LAT_MIN = -19.0;
var LAT_MAX =  -6.0;

var DRIVE_FOLDER = 'GEE_Exports';
var PREFIX = 'unet_mt_2023';

var EXPORT_U16 = true;
var SCALE_U16  = 10000;

var startDate = ee.Date('2023-02-01');
var endDate   = ee.Date('2023-05-31');

function safeTag(n) {
  return String(n.toFixed(2)).replace(/\./g, 'p');
}

// ==============================
// C) Shared data: C10 agri mask
// ==============================
var c10 = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2');
var agriMask2023 = c10.select('classification_2023')
  .remap([39, 41, 62, 20], [1, 1, 1, 0])
  .eq(1)
  .clip(geomMT)
  .rename('agri');

Map.addLayer(agriMask2023.selfMask(), {palette:['00FF00']}, 'C10 agri mask');

// ==============================
// D) Shared Landsat helpers
// ==============================
function maskLandsatSR(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0))
    .and(qa.bitwiseAnd(1 << 2).eq(0));
  return image.updateMask(mask);
}

function getCollectionL8L9(startDate, endDate, roi) {
  var col8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
  var col9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');

  return col8.merge(col9)
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
}

function reduceAndNormalize(collection, roi) {
  var mosaic = collection.reduce(
    ee.Reducer.median().combine(ee.Reducer.percentile([20, 80]), '', true)
  ).clip(roi);

  return ee.Image.cat([
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
}

// ==============================
// E) Mosaic + C10 export block
// ==============================
if (RUN_EXPORT_MOSAIC_C10) {
  var col2023 = getCollectionL8L9(startDate, endDate, roi);
  print('Landsat (L8+L9) 2023 size:', col2023.size());

  var mosaic2023 = reduceAndNormalize(col2023, roi);
  var mosaicMT   = mosaic2023.clip(geomMT);

  Map.addLayer(mosaicMT, {bands:['NIR_median','SWIR1_median','RED_median'], min:0, max:1}, 'mosaicMT 2023');

  var idx = 0;
  var exported = 0;

  for (var lon = LON_MIN; lon < LON_MAX; lon += TILE_DEG) {
    for (var lat = LAT_MIN; lat < LAT_MAX; lat += TILE_DEG) {
      if (idx < BATCH_START || idx >= (BATCH_START + BATCH_SIZE)) {
        idx++;
        continue;
      }

      var x0 = lon, y0 = lat, x1 = lon + TILE_DEG, y1 = lat + TILE_DEG;
      var tile = ee.Geometry.Rectangle([x0, y0, x1, y1], null, false);

      var xTag = safeTag(x0);
      var yTag = safeTag(y0);

      var nameM = PREFIX + '_mosaic_x' + xTag + '_y' + yTag;
      var nameK = PREFIX + '_c10mask_x' + xTag + '_y' + yTag;

      var img = mosaicMT.clip(tile);
      if (EXPORT_U16) img = img.multiply(SCALE_U16).toUint16();

      Export.image.toDrive({
        image: img,
        description: nameM,
        folder: DRIVE_FOLDER,
        fileNamePrefix: nameM,
        region: tile,
        scale: 30,
        maxPixels: 1e13,
        fileFormat: 'GeoTIFF',
        formatOptions: {cloudOptimized: true}
      });

      Export.image.toDrive({
        image: agriMask2023.clip(tile).toByte(),
        description: nameK,
        folder: DRIVE_FOLDER,
        fileNamePrefix: nameK,
        region: tile,
        scale: 30,
        maxPixels: 1e13,
        fileFormat: 'GeoTIFF',
        formatOptions: {cloudOptimized: true}
      });

      exported += 2;
      idx++;
    }
  }

  print('Mosaic/C10 tasks created:', exported);
  print('Batch range:', BATCH_START, 'to', (BATCH_START + BATCH_SIZE - 1));
}

// ==============================
// F) GTv2 export block
// ==============================
if (RUN_EXPORT_GTV2) {
  var SAMPLES_ASSET = 'projects/ee-rafaelparanhos/assets/SAMPLES_FINAL';
  var VAL_ASSET     = 'projects/ee-rafaelparanhos/assets/VAL_FINAL';

  var seed  = 42;
  var split = 0.7;
  var GT_PREFIX = PREFIX + '_gtv2';
  var USE_C10_FILTER = true;

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

  var idxGT = 0;
  var exportedGT = 0;

  for (var lonGT = LON_MIN; lonGT < LON_MAX; lonGT += TILE_DEG) {
    for (var latGT = LAT_MIN; latGT < LAT_MAX; latGT += TILE_DEG) {
      if (idxGT < BATCH_START || idxGT >= (BATCH_START + BATCH_SIZE)) {
        idxGT++;
        continue;
      }

      var xx0 = lonGT, yy0 = latGT, xx1 = lonGT + TILE_DEG, yy1 = latGT + TILE_DEG;
      var tileGT = ee.Geometry.Rectangle([xx0, yy0, xx1, yy1], null, false);

      var nameGT = GT_PREFIX + '_x' + safeTag(xx0) + '_y' + safeTag(yy0);

      Export.image.toDrive({
        image: gtAll.clip(tileGT).toByte(),
        description: nameGT,
        folder: DRIVE_FOLDER,
        fileNamePrefix: nameGT,
        region: tileGT,
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
}
