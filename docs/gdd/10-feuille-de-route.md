# 10. Feuille de route et règles de travail

## Phases

- **Phase 0** (sem. 1–2) : monorepo, CI, auth, Sarn en greybox avec ciel + lune, 4 joueurs synchronisés, déployé.
- **Phase 1** (sem. 3–10) : tranche verticale — Prologue complet solo/duo, 3 Constellations, combat Tempo entier,
  un boss, pipeline peint, UI, sauvegarde cloud, 60 fps mobile.
- **Phase 2** : Acte I, Arène 5v5 alpha, guildes, hôtel des ventes, Cartes des Constellations.
- **Phase 3** : Acte II, raids de 8, saisons, builds Capacitor/Tauri.
- **Phase 4** : Acte III, raid de 24, Grand Choix, lancement.

## « Fini » pour la Phase 0

- `pnpm dev` lance client + serveur ; `pnpm test` passe.
- URL publique : compte créé, entrée dans Sarn, Astrælis visible, déplacement vu par un second navigateur.
- README en français.

## Règles de travail

- PR < 500 lignes, une fonctionnalité par PR, titres en français.
- CI verte obligatoire ; fusion autonome ; description de PR = ce qui change, comment tester, ce qui reste.
- Décisions dans `docs/DECISIONS.md`. Question au propriétaire seulement si irréversible et coûteuse.
- Toute logique de jeu testée ; déterminisme de la simulation testé.
- Accessibilité dès le début. Aucun asset, nom, personnage ou musique copié d'un jeu existant.
