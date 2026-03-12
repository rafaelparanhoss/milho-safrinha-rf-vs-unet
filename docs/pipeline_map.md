# Pipeline Map

Canonical publication map for this repository, based on current scripts/notebooks.

## Official RF Flow
- `gee/rf/export_c10_mask_mt_2023.js`
- `gee/rf/rf_mt_2023_c10.js`

## Official U-Net Flow
GEE exports:
- `gee/unet/export_unet_mosaic_c10_mt_2023.js` (mosaic + c10mask)
- `gee/unet/export_unet_gtv2_mt_2023.js` (GTv2 labels)

Notebook sequence:
- `notebooks/unet/01_unet_preprocess_shards.ipynb`
- `notebooks/unet/02_unet_train_run1.ipynb`
- `notebooks/unet/03_unet_validation_run1.ipynb`
- `notebooks/unet/04_unet_predict_mt.ipynb`
- `notebooks/unet/05_unet_postprocess_c10.ipynb`

## QA Notebooks
- `notebooks/qa/qa_tiles_validation.ipynb`
- `notebooks/qa/qa_shards_validation.ipynb`

## Analysis Notebooks (complementary)
- `notebooks/analysis/analysis_unet_vs_rf_metrics.ipynb`
- `notebooks/analysis/analysis_unet_vs_rf_area.ipynb`

## Archive / Legacy Notebooks
- `notebooks/archive/archive_unet_tiles_align_local.ipynb`
- `notebooks/archive/archive_shards_validation2.ipynb`

## Dependencies (short)
- RF outputs consumed downstream:
  - `c10_agri_mt_2023_1_255.tif`
  - `rf_milho_mask1_mt_2023_c10.tif`
- U-Net export dependencies:
  - `export_unet_mosaic_c10_mt_2023.js` -> `unet_mt_2023_mosaic_*`, `unet_mt_2023_c10mask_*`
  - `export_unet_gtv2_mt_2023.js` -> `unet_mt_2023_gtv2_*`
- U-Net notebooks:
  - `01` consumes mosaic + gtv2 tiles and produces shard datasets (`*.npz`)
  - `02` consumes shards and produces checkpoints (`best.pt`, `last.pt`)
  - `03` consumes shards + checkpoints and produces validation/test metrics
  - `04` consumes mosaics + best checkpoint and produces full prediction raster
  - `05` consumes full prediction + RF mask + C10 mask and produces final U-Net C10 output and area/agreement JSON

## Canonical Points
- Final U-Net post-processing notebook: `notebooks/unet/05_unet_postprocess_c10.ipynb`.
- `notebooks/analysis/analysis_unet_vs_rf_area.ipynb` remains complementary analysis (does not replace canonical `05`).
- `notebooks/archive/*` remains in public repository but marked as legacy/non-canonical.
- `gee/unet/export_unet_inputs_gtv2_mt_2023.js` is kept as combined legacy entrypoint; canonical operation uses the two split scripts.

## Points to Confirm
- GEE `table` asset ID used for MT boundary.
- Final naming/location convention for full U-Net prediction raster in each run.
- Whether a future cleanup should deprecate the combined legacy script after a few release cycles.
