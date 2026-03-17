# Milho Safrinha RF vs U-Net (MT 2023)

## Contexto do projeto
Este repositório documenta um fluxo comparativo para mapeamento de milho safrinha no estado de Mato Grosso (MT), comparando duas abordagens:
- Random Forest (RF) no Google Earth Engine (GEE)
- U-Net com exportações do GEE e execução em notebooks

## Objetivo
Manter uma base reproduzível e organizada para portfólio, preservando exatamente a lógica metodológica utilizada no projeto.

## Área de estudo e período
- Área: Mato Grosso (MT), filtrado por `SIGLA_UF = "MT"`
- Asset de limite estadual: `projects/ee-rafaelparanhos/assets/UF`
- Período: `2023-02-01` a `2023-05-31`

## Comparação entre Random Forest e U-Net
### Random Forest (RF)
- Treino e inferência no GEE
- Preditores Landsat 8/9 C2 L2 + EVI2
- Máscara agrícola MapBiomas C10
- Exporta mapas e tabelas de predição

### U-Net
- Exporta tiles de mosaico/C10 e GTv2 no GEE
- Gera shards, treina, valida, prediz e pós-processa via notebooks
- Pós-processamento final oficial em `notebooks/unet/05_unet_postprocess_c10.ipynb`

## Fontes de dados
- Landsat 8/9 C2 L2: `LANDSAT/LC08/C02/T1_L2`, `LANDSAT/LC09/C02/T1_L2`
- MapBiomas C10: `projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2`
- Amostras GEE:
  - `projects/ee-rafaelparanhos/assets/SAMPLES_FINAL`
  - `projects/ee-rafaelparanhos/assets/VAL_FINAL`
  - `projects/ee-rafaelparanhos/assets/UF`

## Estrutura do repositório
```text
gee/
  rf/
    export_c10_mask_mt_2023.js
    rf_mt_2023_c10.js
  unet/
    export_unet_mosaic_c10_mt_2023.js
    export_unet_gtv2_mt_2023.js

notebooks/
  unet/
  qa/
  analysis/
  archive/

docs/
  visao_geral.md
  referencias_dados.md

results/
  metrics/
  comparisons/
```

## Fluxo principal
1. `gee/rf/export_c10_mask_mt_2023.js`
2. `gee/rf/rf_mt_2023_c10.js`
3. `gee/unet/export_unet_mosaic_c10_mt_2023.js`
4. `gee/unet/export_unet_gtv2_mt_2023.js`
5. `notebooks/unet/01_unet_preprocess_shards.ipynb`
6. `notebooks/unet/02_unet_train_run1.ipynb`
7. `notebooks/unet/03_unet_validation_run1.ipynb`
8. `notebooks/unet/04_unet_predict_mt.ipynb`
9. `notebooks/unet/05_unet_postprocess_c10.ipynb`

## Principais saídas
- RF:
  - `rf_milho_mt_2023_c10.tif`
  - `rf_milho_mask1_mt_2023_c10.tif`
  - `rf_*Pred_mt_2023_c10.csv`
- U-Net:
  - `unet_mt_2023_mosaic_x*_y*.tif`
  - `unet_mt_2023_c10mask_x*_y*.tif`
  - `unet_mt_2023_gtv2_x*_y*.tif`
  - `best.pt`, `last.pt`
  - `/content/drive/MyDrive/unet_preds_mt2023_v1/unet_mt2023_pred_full.tif`
  - `unet_mt2023_pred_c10.tif`
- Resultados auxiliares versionados:
  - `results/metrics/*`
  - `results/comparisons/*`

## Observações sobre analysis e archive
- `notebooks/analysis/*`: camada complementar de análise/comparação (não substitui o fluxo canônico)
- `notebooks/archive/*`: material legado para rastreabilidade

## Situação atual do projeto
- Fluxo canônico RF e U-Net consolidado
- Documentação consolidada em português
- Resultados de métricas e comparações adicionados em `results/`
- Repositório preparado para apresentação no GitHub


