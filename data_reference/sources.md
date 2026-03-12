# Sources

## Fontes de dados (explícitas no repositório)

### Landsat 8/9 Collection 2 Level-2
- Coleções: `LANDSAT/LC08/C02/T1_L2` e `LANDSAT/LC09/C02/T1_L2`.
- Papel: base espectral para mosaico 2023 (bandas ópticas + EVI2), usada em RF e na geração de insumos da U-Net.

### MapBiomas Coleção 10
- Asset: `projects/mapbiomas-public/assets/brazil/lulc/collection10/mapbiomas_brazil_collection10_coverage_v2`.
- Banda usada: `classification_2023`.
- Papel: máscara agrícola C10 (com remapeamento `[39, 41, 62] -> 1` e classe `20 -> 0` no código atual).

### Assets de amostras/validação (GEE)
- `projects/ee-rafaelparanhos/assets/SAMPLES_FINAL`:
  - papel: amostras para treino/teste RF e base para GTv2 da U-Net.
- `projects/ee-rafaelparanhos/assets/VAL_FINAL`:
  - papel: validação externa RF e banda `gt_val` no GTv2.

### Arquivo de validação local (notebooks de análise)
- `VAL_FINAL.geojson` em `/content/drive/MyDrive/GEE_Exports/VAL_FINAL.geojson`.
- Papel: avaliação local (métricas por polígono) no notebook `analysis_unet_vs_rf_metrics.ipynb`.

### Limites administrativos (UF MT)
- Fonte usada para filtrar `SIGLA_UF = "MT"` nos scripts GEE.
- Asset: `projects/ee-rafaelparanhos/assets/UF`.
