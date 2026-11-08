# Licences des assets tiers

Tout asset tiers ajouté au dépôt est listé ici : nom, auteur, source (URL), licence, fichiers concernés.
Licences acceptées : CC0, domaine public, CC-BY (créditée), OFL pour les polices. Sources privilégiées pour la
direction cinématique : Poly Haven, ambientCG, NASA SVS ; pas d'assets d'un autre jeu.

| Asset                                               | Auteur                                             | Source                                         | Licence        | Fichiers                                      |
| --------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- | -------------- | --------------------------------------------- |
| HDRI « Satara Night » (1K)                          | Greg Zaal                                          | https://polyhaven.com/a/satara_night           | CC0            | `apps/client/public/hdri/satara_night_1k.hdr` |
| Carte de couleur lunaire LROC 2K (recolorée en jeu) | NASA Scientific Visualization Studio, Ernie Wright | https://svs.gsfc.nasa.gov/4720                 | Domaine public | `apps/client/public/ciel/lune_couleur_2k.jpg` |
| Relief lunaire LOLA 8 bits                          | NASA Scientific Visualization Studio, Ernie Wright | https://svs.gsfc.nasa.gov/4720                 | Domaine public | `apps/client/public/ciel/lune_relief.jpg`     |
| Pavés « Cobblestone Floor 04 » (1K)                 | Rob Tuytel                                         | https://polyhaven.com/a/cobblestone_floor_04   | CC0            | `apps/client/public/textures/paves_*.jpg`     |
| Enduit sur pierre « Plastered Stone Wall » (1K)     | Rob Tuytel                                         | https://polyhaven.com/a/plastered_stone_wall   | CC0            | `apps/client/public/textures/facade_*.jpg`    |
| Moellons « Rustic Stone Wall 02 » (1K)              | Amal Kumar                                         | https://polyhaven.com/a/rustic_stone_wall_02   | CC0            | `apps/client/public/textures/pierre_*.jpg`    |
| Tuiles « Ceramic Roof 01 » (1K)                     | Rob Tuytel                                         | https://polyhaven.com/a/ceramic_roof_01        | CC0            | `apps/client/public/textures/tuiles_*.jpg`    |
| Planches « Weathered Brown Planks » (1K)            | Dimitrios Savva, Rico Cilliers                     | https://polyhaven.com/a/weathered_brown_planks | CC0            | `apps/client/public/textures/bois_*.jpg`      |
| Lanterne « Lantern 01 » (simplifiée)                | Rajil Jose Macatangay                              | https://polyhaven.com/a/Lantern_01             | CC0            | `apps/client/public/modeles/lanterne.glb`     |
| Tonneau « Wine Barrel 01 » (simplifié)              | James Ray Cock                                     | https://polyhaven.com/a/wine_barrel_01         | CC0            | `apps/client/public/modeles/tonneau.glb`      |
| Caisse « Wooden Crate 01 » (simplifiée)             | James Ray Cock                                     | https://polyhaven.com/a/wooden_crate_01        | CC0            | `apps/client/public/modeles/caisse.glb`       |
| Plante en pot « Potted Plant 02 » (simplifiée)      | Rico Cilliers                                      | https://polyhaven.com/a/potted_plant_02        | CC0            | `apps/client/public/modeles/plante.glb`       |

Chaque fichier est listé avec son URL et son empreinte SHA-256 dans `tools/assets/sources.json` ; `pnpm assets`
les retélécharge et les vérifie, puis simplifie et compresse les modèles (`tools/assets/modeles.json`).
