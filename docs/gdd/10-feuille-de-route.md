# 10. Feuille de route et règles de travail

## Phases

- **Phase 0** (sem. 1–2) : monorepo, CI, auth gratuite, Sarn en greybox avec shader de ciel et lune, 4 joueurs qui se
  déplacent ensemble en pair-à-pair, déployé publiquement. Coût : 0 $.
- **Phase 1** (sem. 3–10) : tranche verticale — Prologue complet, solo ou coop, 3 Constellations, combat Tempo entier
  (parade, Fêlure, Résonance, une Invocation), un boss, pipeline de rendu cinématique, UI art nouveau, sauvegarde cloud, PWA
  installable, 60 fps mobile. Publié sur itch.io et le site.
- **Phase 2** : Acte I, Cartes des Constellations, classements, Ordres de Veilleurs.
- **Phase 3** : Acte II, Arène des Hérauts (défis coop contre la montre), saisons gratuites d'événements de Marée.
- **Phase 4** : Acte III, fins, vote communautaire, lancement. Ensuite seulement : stores et PvP autoritaire, si le
  jeu a un public et un financement.

## « Fini » pour la Phase 0

- `pnpm dev` lance le client et les Workers en local (wrangler) ; `pnpm test` passe.
- URL publique gratuite : compte créé par courriel, entrée dans Sarn, Astrælis visible dans le ciel, création d'une
  partie, un deuxième navigateur rejoint par le code et les deux joueurs se voient bouger.
- `docs/COUTS.md` montre 0 $/mois avec les limites de chaque palier gratuit.
- README en français avec architecture, commandes et feuille de route.

## Règles de travail

- PR < 500 lignes, une fonctionnalité par PR, titres en français.
- CI verte obligatoire ; fusion autonome ; description de PR = ce qui change, comment tester, ce qui reste.
- Décisions non évidentes dans `docs/DECISIONS.md` (date, choix, pourquoi, alternatives). Question au propriétaire
  seulement si irréversible et coûteuse, ou si une dépense est inévitable.
- Toute logique de jeu testée ; tests de déterminisme de la simulation.
- Aucun asset, nom, personnage ou musique copié d'un jeu existant.
