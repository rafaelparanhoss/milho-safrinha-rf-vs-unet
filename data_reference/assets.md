# Assets

## RF

### Entradas esperadas (GEE)
- `projects/ee-rafaelparanhos/assets/SAMPLES_FINAL` (features com `class` e `id`).
- `projects/ee-rafaelparanhos/assets/VAL_FINAL` (features com `class` e `id`).
- `projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2`.
- `table` com limites estaduais (asset ID: **a confirmar**).

### Exports principais esperados
- `c10_agri_mt_2023_1_255` (GeoTIFF, Drive).
- `rf_milho_mt_2023_c10` (GeoTIFF, Drive).
- `rf_milho_mask1_mt_2023_c10` (GeoTIFF, Drive).
- `mosaic2023_rgb_nir_swir1_red_c10` (GeoTIFF, Drive).
- `rf_trainPred_mt_2023_c10` (CSV, Drive).
- `rf_testPred_mt_2023_c10` (CSV, Drive).
- `rf_valPred_mt_2023_c10` (CSV, Drive).
- `users/Rafaelparanhos/rf_milho_mt_2023_c10` (classifier asset no GEE).

### Checkpoints/model runs esperados
- Não há checkpoints explícitos para RF no repositório (modelo treinado/exportado no GEE).

### Shards/datasets esperados
- Não aplicável para RF no fluxo atual.

## U-Net

### Entradas esperadas (GEE e arquivos)
- Base espectral Landsat (mosaico em tiles) com prefixo `unet_mt_2023_mosaic_*` (esperado pelos notebooks).
- Máscara C10 por tile com prefixo `unet_mt_2023_c10mask_*` (esperado em QA de tiles).
- Labels GTv2 com prefixo `unet_mt_2023_gtv2_*` (export explícito no script GEE atual).
- `rf_milho_mask1_mt_2023_c10.tif` (usado em pós-processamento e comparação).
- `c10_agri_mt_2023_1_255.tif` (usado para mascarar predição U-Net).

### Exports principais esperados
- Tiles de entrada U-Net (`mosaic`, `c10mask`, `gtv2`) no `GEE_Exports`.
- Predições U-Net em `/content/drive/MyDrive/unet_preds_mt2023_v1/`.

### Checkpoints/model runs esperados
- Run: `unet_mt2023_v2_run1`.
- Checkpoints:
  - `/content/drive/MyDrive/unet_runs/unet_mt2023_v2_run1/checkpoints/best.pt`
  - `/content/drive/MyDrive/unet_runs/unet_mt2023_v2_run1/checkpoints/last.pt`

### Shards/datasets esperados
- Dataset raiz: `/content/drive/MyDrive/unet_dataset_mt2023_v2/shards`.
- Splits:
  - `train/shard_*.npz`
  - `val/shard_*.npz`
  - `test/shard_*.npz`
- Logs/manifest (notebooks):
  - `manifest_tiles.csv` (localização exata varia por notebook, **a confirmar**).
