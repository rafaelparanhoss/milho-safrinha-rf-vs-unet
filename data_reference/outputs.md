# Outputs

## RF principal
- `rf_milho_mt_2023_c10.tif` (GeoTIFF): mapa de classificação RF (0/1) com máscara C10.
- `rf_milho_mask1_mt_2023_c10.tif` (GeoTIFF): máscara binária de milho (`1`) para cálculo de área fora do GEE.
- `c10_agri_mt_2023_1_255.tif` (GeoTIFF): máscara agrícola C10 (`1` dentro, `255` fora).
- `mosaic2023_rgb_nir_swir1_red_c10.tif` (GeoTIFF): RGB de apoio (NIR/SWIR1/RED) mascarado.
- `rf_trainPred_mt_2023_c10.csv` (CSV): predição de treino (auditoria).
- `rf_testPred_mt_2023_c10.csv` (CSV): predição em teste interno.
- `rf_valPred_mt_2023_c10.csv` (CSV): predição em validação externa.
- `users/Rafaelparanhos/rf_milho_mt_2023_c10` (GEE classifier asset).

## U-Net principal
- `unet_mt_2023_gtv2_x*_y*.tif` (GeoTIFF): labels por tile (bandas `gt_train`, `gt_test`, `gt_val`).
- `shard_*.npz` por split (NPZ): dataset para treino U-Net (X/Y/meta).
- `best.pt` e `last.pt` (checkpoint PyTorch): estado do treino `unet_mt2023_v2_run1`.
- `unet_mt2023_pred_full.tif` (GeoTIFF, **a confirmar nome final exato no run atual**): predição U-Net MT.
- `unet_mt2023_pred_c10.tif` (GeoTIFF uint8): predição U-Net mascarada pela C10 (`0/1/255`).

## Analysis / comparação
- `area_and_agreement_unet_vs_rf.json` (JSON): área e concordância UNet vs RF (pós-processamento).
- `rf_on_unetgrid.tif` (GeoTIFF): RF reprojetado/reamostrado para grade da U-Net.
- `unet_c10_eqarea.tif` e `rf_on_unet_eqarea.tif` (GeoTIFF): versões em CRS equal-area para cálculo de área.
- `area_and_agreement_unet_vs_rf_on_unetgrid.json` (JSON): resumo de área/concordância em grade alinhada.
- `metrics_valfinal_unet_vs_gt.json` (JSON): métricas globais no `VAL_FINAL`.
- `per_poly_valfinal_quick.csv` (CSV): resumo por polígono de validação.
- `table_metrics_valfinal_unet_vs_rf.csv` (CSV): tabela consolidada para comparação UNet vs RF.
