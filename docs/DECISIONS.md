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
- **2026-11-07** — **Pivot « coût zéro »** (nouvelle version de la spécification) : plus de Colyseus, Fly.io, MongoDB
  ni Redis ; coop 1–4 en WebRTC hôte autoritaire, backend Cloudflare Workers + D1 + R2. Voir
  [ADR 0001](adr/0001-cout-zero-pair-a-pair.md). Alternatives : serveur Colyseus (payant), simulation en Durable
  Object (sortirait du palier gratuit).
- **2026-11-07** — Dépôt passé en **public** (demande explicite de la spécification : Actions illimitées et gratuites).
  Aucun secret n'était versionné.
- **2026-11-07** — Les limites des paliers gratuits de `COUTS.md` sont reprises de la spécification et marquées
  « prévu » ; chacune est revérifiée sur la page officielle au moment d'activer le service.
- **2026-11-07** — Client Phase 0 rendu avec `WebGLRenderer` + `ShaderMaterial` GLSL. La migration vers
  `WebGPURenderer` (repli WebGL2 automatique) se fera avec le pipeline peint dans `packages/render`, en TSL, pour ne
  pas écrire les shaders deux fois. Alternative : WebGPU dès maintenant (TSL obligatoire, plus long pour une greybox).
- **2026-11-07** — En solo, l'hôte tourne dans le navigateur avec exactement le même code que la coop
  (`@astraelis/net`) : un seul chemin à tester. Le ciel (dégradé, étoiles, anneau de débris, Astrælis) est un seul
  shader plein écran, piloté par `parametresAstraelis(avancée)`.
