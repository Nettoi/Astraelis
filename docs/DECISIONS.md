# Journal des décisions

Format : date — décision — raison. Les décisions structurantes ont aussi un ADR dans [`adr/`](adr/).

- **2026-11-07** — Dépôt `Nettoi/Astraelis` créé **privé**. Raison : réversible (passage en public possible à tout
  moment), alors que l'inverse ne l'est pas.
- **2026-11-07** — Le GDD est découpé en dix fichiers thématiques dans `docs/gdd/`. Le document Claude Docs reste la
  source longue ; en cas d'écart, le dépôt fait foi pour le code.
- **2026-11-07** — Les références à des jeux existants ne servent qu'à décrire l'intention ; aucun nom propre de ces
  jeux n'apparaît dans le contenu jouable.
- **2026-11-07** — Outillage : pnpm 12 (épinglé par `packageManager`), TypeScript 6.0 (typescript-eslint ne supporte
  pas encore TS 7), Vitest 5 en mode `projects` à la racine, ESLint 10 en configuration plate, Prettier 3.
- **2026-11-07** — Les paquets internes exposent directement leurs sources `.ts` (`exports` → `src/index.ts`) : pas de
  build intermédiaire, Vite et Vitest les consomment tels quels ; seuls les apps produisent un build.
- **2026-11-07** — La simulation (`packages/sim`) travaille **en entiers** : positions en millimètres, vitesses en
  mm/tick, axes d'entrée quantifiés sur [-127, 127]. Aucune fonction flottante non exacte (trigonométrie, `pow`) :
  le déterminisme entre moteurs JS est garanti par construction. Le fuzz (fast-check) vérifie les invariants et une
  empreinte figée détecte toute dérive.
