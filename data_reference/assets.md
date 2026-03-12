# Assets

## RF

### Expected GEE Inputs
- `projects/ee-rafaelparanhos/assets/SAMPLES_FINAL` (`class`, `id`)
- `projects/ee-rafaelparanhos/assets/VAL_FINAL` (`class`, `id`)
- `projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2`
- `table` (state boundaries; asset ID a confirmar)

### Expected RF Exports
- `c10_agri_mt_2023_1_255` (GeoTIFF)
- `rf_milho_mt_2023_c10` (GeoTIFF)
- `rf_milho_mask1_mt_2023_c10` (GeoTIFF)
- `mosaic2023_rgb_nir_swir1_red_c10` (GeoTIFF)
- `rf_trainPred_mt_2023_c10` (CSV)
- `rf_testPred_mt_2023_c10` (CSV)
- `rf_valPred_mt_2023_c10` (CSV)
- `users/Rafaelparanhos/rf_milho_mt_2023_c10` (classifier asset)

## U-Net

### Canonical GEE Export Scripts
- `gee/unet/export_unet_mosaic_c10_mt_2023.js`
- `gee/unet/export_unet_gtv2_mt_2023.js`

### Expected U-Net Inputs/Assets
- `unet_mt_2023_mosaic_x*_y*.tif`
- `unet_mt_2023_c10mask_x*_y*.tif`
- `unet_mt_2023_gtv2_x*_y*.tif`
- `c10_agri_mt_2023_1_255.tif`
- `rf_milho_mask1_mt_2023_c10.tif`

### Expected Checkpoints / Runs
- Run id: `unet_mt2023_v2_run1`
- `/content/drive/MyDrive/unet_runs/unet_mt2023_v2_run1/checkpoints/best.pt`
- `/content/drive/MyDrive/unet_runs/unet_mt2023_v2_run1/checkpoints/last.pt`

### Expected Shards / Datasets
- `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards/train/shard_*.npz`
- `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards/val/shard_*.npz`
- `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards/test/shard_*.npz`
- `manifest_tiles.csv` (path may vary by notebook run; a confirmar)

## Legacy Script (kept)
- `gee/unet/export_unet_inputs_gtv2_mt_2023.js`
- Status: combined legacy entrypoint for backward compatibility, not the preferred canonical execution path.
