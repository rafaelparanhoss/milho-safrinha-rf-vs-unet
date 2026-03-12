/****************************************************
 * EXPORT MÁSCARA C10 — MT 2023 (ÚNICO ARQUIVO)
 * saída:
 *  - 1 dentro da máscara agrícola
 *  - 255 fora (ignore/nodata)
 ****************************************************/

// A) ROI: MT
var estados  = ee.FeatureCollection(table);
var estadoMT = estados.filter(ee.Filter.eq('SIGLA_UF', 'MT')).first();
var geomMT   = estadoMT.geometry();

Map.centerObject(estadoMT, 6);

// B) C10 mask (agri)
var c10 = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2');

// atenção: você está definindo "agri" como classes [39,41,62] e excluindo 20.
// mantenho igual ao seu.
var agri01 = c10.select('classification_2023')
  .remap([39, 41, 62, 20], [1, 1, 1, 0])
  .eq(1)                 // boolean
  .rename('c10_agri')
  .clip(geomMT);

// saída final: 1 dentro, 255 fora
var c10mask_1_255 = agri01
  .where(agri01.eq(0), 255)
  .toByte()
  .rename('c10_agri_1_255');

Map.addLayer(agri01.selfMask(), {palette:['00FF00']}, 'C10 agri (1)');
Map.addLayer(c10mask_1_255, {min:1, max:255, palette:['00FF00','000000']}, 'C10 1/255');

// C) Export único
var DRIVE_FOLDER = 'GEE_Exports';
var NAME = 'c10_agri_mt_2023_1_255';

Export.image.toDrive({
  image: c10mask_1_255,
  description: NAME,
  folder: DRIVE_FOLDER,
  fileNamePrefix: NAME,
  region: geomMT,
  scale: 30,
  crs: 'EPSG:4326',
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});
