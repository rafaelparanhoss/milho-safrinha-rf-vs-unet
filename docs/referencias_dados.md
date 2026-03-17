# Referências de Dados

## 1) Fontes de dados
### Landsat 8/9 Collection 2 Level-2
- `LANDSAT/LC08/C02/T1_L2`
- `LANDSAT/LC09/C02/T1_L2`
- Papel: base espectral para mosaico 2023 (bandas ópticas + EVI2) em RF e U-Net.

### MapBiomas Coleção 10
- `projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2`
- Banda: `classification_2023`
- Papel: máscara agrícola C10 (remapeamento conforme scripts).

### Assets GEE de amostras e limite
- `projects/ee-rafaelparanhos/assets/SAMPLES_FINAL`
- `projects/ee-rafaelparanhos/assets/VAL_FINAL`
- `projects/ee-rafaelparanhos/assets/UF`

## 2) Entradas e artefatos esperados
### RF
- Entradas:
  - Landsat 8/9 C2 L2
  - MapBiomas C10
  - `SAMPLES_FINAL`, `VAL_FINAL`, `UF`
- Exports esperados:
  - `c10_agri_mt_2023_1_255` (GeoTIFF)
  - `rf_milho_mt_2023_c10` (GeoTIFF)
  - `rf_milho_mask1_mt_2023_c10` (GeoTIFF)
  - `mosaic2023_rgb_nir_swir1_red_c10` (GeoTIFF)
  - `rf_trainPred_mt_2023_c10` (CSV)
  - `rf_testPred_mt_2023_c10` (CSV)
  - `rf_valPred_mt_2023_c10` (CSV)
  - `users/Rafaelparanhos/rf_milho_mt_2023_c10` (asset classificador)

### U-Net
- Scripts canônicos de export no GEE:
  - `gee/unet/export_unet_mosaic_c10_mt_2023.js`
  - `gee/unet/export_unet_gtv2_mt_2023.js`
- Entradas/artefatos esperados:
  - `unet_mt_2023_mosaic_x*_y*.tif`
  - `unet_mt_2023_c10mask_x*_y*.tif`
  - `unet_mt_2023_gtv2_x*_y*.tif`
  - `c10_agri_mt_2023_1_255.tif`
  - `rf_milho_mask1_mt_2023_c10.tif`
- Checkpoints e execução oficial:
  - execução: `unet_mt2023_v2_run1`
  - `.../checkpoints/best.pt`
  - `.../checkpoints/last.pt`
- Shards e logs:
  - `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards/train/shard_*.npz`
  - `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards/val/shard_*.npz`
  - `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards/test/shard_*.npz`
  - `/content/drive/MyDrive/unet_dataset_mt2023_v2/logs/manifest_tiles.csv`

## 3) Saídas principais
### RF
- `rf_milho_mt_2023_c10.tif`
- `rf_milho_mask1_mt_2023_c10.tif`
- `c10_agri_mt_2023_1_255.tif`
- `mosaic2023_rgb_nir_swir1_red_c10.tif`
- `rf_*Pred_mt_2023_c10.csv`

### U-Net
- `unet_mt_2023_mosaic_x*_y*.tif`
- `unet_mt_2023_c10mask_x*_y*.tif`
- `unet_mt_2023_gtv2_x*_y*.tif`
- `shard_*.npz`
- `best.pt`, `last.pt`
- `/content/drive/MyDrive/unet_preds_mt2023_v1/unet_mt2023_pred_full.tif`
- `unet_mt2023_pred_c10.tif`
- `area_and_agreement_unet_vs_rf.json`

### Analysis (complementar)
- `metrics_valfinal_unet_vs_gt.json`
- `per_poly_valfinal_quick.csv`
- `table_metrics_valfinal_unet_vs_rf.csv`
- `rf_on_unetgrid.tif`
- `unet_c10_eqarea.tif`
- `rf_on_unet_eqarea.tif`
- `area_and_agreement_unet_vs_rf_on_unetgrid.json`

