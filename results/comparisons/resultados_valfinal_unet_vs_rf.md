## Avaliação (VAL_FINAL) — MT 2023 (máscara C10)

Avaliação pixel-a-pixel dentro dos polígonos VAL_FINAL (classes 0=não-milho, 1=milho), recortando e alinhando os mapas finais na mesma referência espacial (EPSG:4326) e ignorando pixels fora da máscara agrícola (nodata=255).

**UNet:** F1=0.9876, IoU=0.9755, Precisão=0.9823, Revocação=0.9930, Acurácia=0.9884 (TP=197402, FP=3552, FN=1398, TN=225510, pixels válidos=427862).

**RF:** F1=0.9858, IoU=0.9720, Precisão=0.9804, Revocação=0.9913, Acurácia=0.9867 (TP=197070, FP=3946, FN=1730, TN=225116, pixels válidos=427862).

Diferença (UNet − RF): ΔF1=0.0018, ΔIoU=0.0035, ΔAcc=0.0017.
