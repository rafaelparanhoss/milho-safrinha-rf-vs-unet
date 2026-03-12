# Outputs

## RF Main Outputs
- `rf_milho_mt_2023_c10.tif` (GeoTIFF): RF classification map (0/1) within C10 scope.
- `rf_milho_mask1_mt_2023_c10.tif` (GeoTIFF): milho=1 binary mask.
- `c10_agri_mt_2023_1_255.tif` (GeoTIFF): C10 mask (`1` inside, `255` outside).
- `mosaic2023_rgb_nir_swir1_red_c10.tif` (GeoTIFF): reference RGB composite.
- `rf_trainPred_mt_2023_c10.csv` (CSV)
- `rf_testPred_mt_2023_c10.csv` (CSV)
- `rf_valPred_mt_2023_c10.csv` (CSV)
- `users/Rafaelparanhos/rf_milho_mt_2023_c10` (GEE classifier asset)

## U-Net Main Outputs
- `unet_mt_2023_mosaic_x*_y*.tif` (GeoTIFF): normalized mosaic tiles.
- `unet_mt_2023_c10mask_x*_y*.tif` (GeoTIFF): C10 mask tiles.
- `unet_mt_2023_gtv2_x*_y*.tif` (GeoTIFF): GTv2 labels (`gt_train`, `gt_test`, `gt_val`).
- `shard_*.npz` (NPZ): train/val/test shard datasets.
- `best.pt`, `last.pt` (checkpoint files).
- `unet_mt2023_pred_full.tif` (GeoTIFF, final run name/location a confirmar).
- `unet_mt2023_pred_c10.tif` (GeoTIFF uint8): final U-Net post-processed output (`0/1/255`).
- `area_and_agreement_unet_vs_rf.json` (JSON): area/agreement summary from canonical post-process notebook.

## Analysis / Comparison Outputs (complementary)
- `metrics_valfinal_unet_vs_gt.json` (JSON)
- `per_poly_valfinal_quick.csv` (CSV)
- `table_metrics_valfinal_unet_vs_rf.csv` (CSV)
- `rf_on_unetgrid.tif` (GeoTIFF)
- `unet_c10_eqarea.tif` (GeoTIFF)
- `rf_on_unet_eqarea.tif` (GeoTIFF)
- `area_and_agreement_unet_vs_rf_on_unetgrid.json` (JSON)

## Canonical vs Complementary
- Canonical final post-process output source: `notebooks/unet/05_unet_postprocess_c10.ipynb`
- `notebooks/analysis/*` outputs are complementary and should not overwrite canonical production outputs.
