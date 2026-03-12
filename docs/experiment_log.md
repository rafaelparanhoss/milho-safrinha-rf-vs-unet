# Experiment Log

## Project Objective
Map milho safrinha in Mato Grosso (MT) for 2023 and compare RF vs U-Net outputs using aligned inputs/post-processing assumptions.

## Study Area
- Mato Grosso (MT), filtered in GEE by `SIGLA_UF = "MT"`.
- GEE UF asset: `projects/ee-rafaelparanhos/assets/UF`.

## Period
- `2023-02-01` to `2023-05-31`.

## RF Approach (official)
- `gee/rf/export_c10_mask_mt_2023.js`
- `gee/rf/rf_mt_2023_c10.js`
- Inputs: Landsat 8/9 C2 L2 + EVI2 + MapBiomas C10 + sample assets (`SAMPLES_FINAL`, `VAL_FINAL`).

## U-Net Approach (official)
GEE export scripts:
- `gee/unet/export_unet_mosaic_c10_mt_2023.js`
- `gee/unet/export_unet_gtv2_mt_2023.js`

Notebook pipeline:
1. `notebooks/unet/01_unet_preprocess_shards.ipynb`
2. `notebooks/unet/02_unet_train_run1.ipynb`
3. `notebooks/unet/03_unet_validation_run1.ipynb`
4. `notebooks/unet/04_unet_predict_mt.ipynb`
5. `notebooks/unet/05_unet_postprocess_c10.ipynb`

## Complementary Layers
- QA: `notebooks/qa/*`
- Analysis: `notebooks/analysis/*`
- Legacy: `notebooks/archive/*`

## Important Operational Note
- Canonical execution uses split scripts for U-Net export:
  - `gee/unet/export_unet_mosaic_c10_mt_2023.js`
  - `gee/unet/export_unet_gtv2_mt_2023.js`
