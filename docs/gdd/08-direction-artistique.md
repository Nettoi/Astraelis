# 8. Direction artistique (belle ET gratuite)

## Rendu

- **Réalisme stylisé cinématique** (remplace la direction « peinte » le 2026-11-08, voir
  [DECISIONS](../DECISIONS.md)) : matériaux PBR, lumière physiquement plausible, personnages aux proportions
  héroïques. Une lumière clé froide (Astrælis, bleu-argent), des contre-jours chauds (lanternes), des ombres
  profondes mais lisibles : chaque scène joue le contraste chaud / froid.
- Le post-traitement fait la moitié du travail : tonemapping ACES, bloom doux sur ce qui émet, occlusion ambiante,
  brume, étalonnage par LUT, vignette, SMAA ; profondeur de champ en cinématique.
- Trois paliers de qualité détectés au lancement et réglables dans les options : Cinéma, Équilibré, Léger.
  Objectif 60 i/s sur PC, 30 i/s stables sur téléphone milieu de gamme.
- On s'inspire des principes des JRPG modernes, jamais de leur contenu (noms, modèles, textures, musique).
- Ciel custom : Astrælis toujours visible, taille et couleur pilotées par l'acte ; anneau de débris animé ; nuit
  éclairée par la lune.
- Cinématiques 100 % en moteur ; caméra dynamique sur les parades parfaites et les Invocations.

## Palettes par région

Voir [02-univers.md](02-univers.md#régions).

## Interface

- Art nouveau céleste (laiton, courbes, constellations).
- Cormorant Garamond (titres) + Inter (texte), Google Fonts, licence OFL.
- Zones tactiles ≥ 48 px.
- Accessibilité dès le début : remappage, modes daltoniens, taille de texte, mode Histoire, réduction des effets.

## Musique et voix

- Pistes CC0 / CC-BY choisies par région (créditées en jeu).
- Le motif à sept notes (la berceuse) est joué par une petite bibliothèque de synthèse Web Audio écrite pour le jeu :
  un thème original sans compositeur. Thème de combat superposé sans coupure.
- Pas de doublage : dialogues écrits, « voix » stylisées synthétiques optionnelles (babillage syllabique).
