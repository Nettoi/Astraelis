# Licences des assets tiers

Tout asset tiers ajouté au dépôt est listé ici : nom, auteur, source (URL), licence, fichiers concernés.
Licences acceptées : CC0, domaine public, CC-BY (créditée), OFL pour les polices. Sources privilégiées pour la
direction cinématique : Poly Haven, ambientCG, NASA SVS ; pas d'assets d'un autre jeu.

| Asset                                               | Auteur                                             | Source                               | Licence        | Fichiers                                      |
| --------------------------------------------------- | -------------------------------------------------- | ------------------------------------ | -------------- | --------------------------------------------- |
| HDRI « Satara Night » (1K)                          | Greg Zaal                                          | https://polyhaven.com/a/satara_night | CC0            | `apps/client/public/hdri/satara_night_1k.hdr` |
| Carte de couleur lunaire LROC 2K (recolorée en jeu) | NASA Scientific Visualization Studio, Ernie Wright | https://svs.gsfc.nasa.gov/4720       | Domaine public | `apps/client/public/ciel/lune_couleur_2k.jpg` |
| Relief lunaire LOLA 8 bits                          | NASA Scientific Visualization Studio, Ernie Wright | https://svs.gsfc.nasa.gov/4720       | Domaine public | `apps/client/public/ciel/lune_relief.jpg`     |

Chaque fichier est listé avec son URL et son empreinte SHA-256 dans `tools/assets/sources.json` ; `pnpm assets`
les retélécharge et les vérifie.
