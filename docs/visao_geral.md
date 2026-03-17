# Visão Geral do Projeto

## Objetivo
Mapear milho safrinha em Mato Grosso (MT) no ciclo de 2023 e comparar os resultados de Random Forest (RF) e U-Net, mantendo o fluxo operacional original.

## Área de estudo e período
- Área: MT (`SIGLA_UF = "MT"`)
- Asset UF: `projects/ee-rafaelparanhos/assets/UF`
- Período: `2023-02-01` a `2023-05-31`

## Fluxo oficial RF
1. `gee/rf/export_c10_mask_mt_2023.js`
2. `gee/rf/rf_mt_2023_c10.js`

## Fluxo oficial U-Net
### Exportações no GEE
- `gee/unet/export_unet_mosaic_c10_mt_2023.js` (mosaico + máscara C10)
- `gee/unet/export_unet_gtv2_mt_2023.js` (rótulos GTv2)

### Sequência de notebooks
1. `notebooks/unet/01_unet_preprocess_shards.ipynb`
2. `notebooks/unet/02_unet_train_run1.ipynb`
3. `notebooks/unet/03_unet_validation_run1.ipynb`
4. `notebooks/unet/04_unet_predict_mt.ipynb`
5. `notebooks/unet/05_unet_postprocess_c10.ipynb`

## Camadas complementares
- QA:
  - `notebooks/qa/qa_tiles_validation.ipynb`
  - `notebooks/qa/qa_shards_validation.ipynb`
- Análise complementar:
  - `notebooks/analysis/analysis_unet_vs_rf_metrics.ipynb`
  - `notebooks/analysis/analysis_unet_vs_rf_area.ipynb`
- Legado:
  - `notebooks/archive/archive_unet_tiles_align_local.ipynb`
  - `notebooks/archive/archive_shards_validation2.ipynb`

## Dependências principais
- RF fornece insumos para comparação e pós-processamento U-Net:
  - `c10_agri_mt_2023_1_255.tif`
  - `rf_milho_mask1_mt_2023_c10.tif`
- U-Net depende de:
  - tiles de mosaico e C10
  - tiles GTv2
  - shards (`*.npz`) e checkpoints (`best.pt`, `last.pt`)

## Convenções operacionais fixas
- Run oficial único: `unet_mt2023_v2_run1`
- Saída oficial de predição completa:
  - `/content/drive/MyDrive/unet_preds_mt2023_v1/unet_mt2023_pred_full.tif`
- Mudança de pasta de saída, quando necessária, é manual fora da baseline canônica.

