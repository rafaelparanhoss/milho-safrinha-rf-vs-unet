# Experiment Log

## Resumo do objetivo
Classificar milho safrinha em Mato Grosso (MT) no ciclo 2023 com duas abordagens (RF e U-Net) e comparar resultados/áreas.

## Área de estudo
- Estado de Mato Grosso (MT), filtrado por `SIGLA_UF = "MT"` nos scripts GEE.
- Asset/fonte do `table` de limites estaduais: **a confirmar**.

## Período
- Janela temporal explícita nos scripts: `2023-02-01` a `2023-05-31` (safrinha 2023).

## Abordagem RF
- Script principal: `gee/rf/rf_mt_2023_c10.js`.
- Base espectral: Landsat 8/9 C2 L2 + EVI2, com estatísticas (`median`, `p20`, `p80`) e normalização.
- Máscara agrícola: MapBiomas C10 (`classification_2023`).
- Amostras: `SAMPLES_FINAL` (treino/teste) e `VAL_FINAL` (validação externa).
- Saídas RF: CSV de predição (train/test/val), GeoTIFFs de classificação e asset do classificador.

## Abordagem U-Net
- Export GEE de insumos/labels: `gee/unet/export_unet_inputs_gtv2_mt_2023.js`.
- Pipeline local em notebooks:
  1. `notebooks/unet/01_unet_preprocess_shards.ipynb` (tiles -> shards)
  2. `notebooks/unet/02_unet_train_run1.ipynb` (treino/checkpoints)
  3. `notebooks/unet/03_unet_validation_run1.ipynb` (validação)
  4. `notebooks/unet/04_unet_predict_mt.ipynb` (predição MT)
  5. `notebooks/unet/05_unet_postprocess_c10.ipynb` (máscara C10 + área/concordância)

## Ordem atual do pipeline
1. `gee/rf/export_c10_mask_mt_2023.js`
2. `gee/rf/rf_mt_2023_c10.js`
3. `gee/unet/export_unet_inputs_gtv2_mt_2023.js`
4. `notebooks/unet/01_unet_preprocess_shards.ipynb`
5. `notebooks/unet/02_unet_train_run1.ipynb`
6. `notebooks/unet/03_unet_validation_run1.ipynb`
7. `notebooks/unet/04_unet_predict_mt.ipynb`
8. `notebooks/unet/05_unet_postprocess_c10.ipynb`
9. `notebooks/qa/qa_tiles_validation.ipynb` e `notebooks/qa/qa_shards_validation.ipynb`
10. `notebooks/analysis/analysis_unet_vs_rf_metrics.ipynb` e `notebooks/analysis/analysis_unet_vs_rf_area.ipynb`

## Arquivos principais e função (curto)
- `gee/rf/export_c10_mask_mt_2023.js`: exporta máscara C10 `1/255`.
- `gee/rf/rf_mt_2023_c10.js`: treino/validação RF e export dos produtos RF.
- `gee/unet/export_unet_inputs_gtv2_mt_2023.js`: export de tiles para pipeline U-Net (GTv2 explícito).
- `notebooks/unet/*.ipynb`: preprocessamento, treino, validação, predição e pós-processamento U-Net.
- `notebooks/qa/*.ipynb`: checagens de consistência de tiles/shards.
- `notebooks/analysis/*.ipynb`: comparação RF vs U-Net (métricas e área).
- `notebooks/archive/*.ipynb`: fluxo legado/experimentos antigos.
