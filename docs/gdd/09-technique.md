# 9. Technique

## Stack
- Monorepo pnpm + TypeScript strict, Node 22.
- **Client** : Vite, Three.js (WebGPU, repli WebGL2), React, Zustand, Howler, glTF + Draco/meshopt + KTX2, i18n FR/EN.
- **Serveur** : Node + Colyseus, tick 20 Hz, prédiction client + réconciliation.
- **`packages/sim`** : simulation de combat déterministe partagée, fuzzée.
- **Données** : MongoDB Atlas, Redis.
- **Hébergement** : Cloudflare Pages (client), Cloudflare R2 (assets), Fly.io Montréal/Toronto (serveurs).
- **Auth** : lien magique + Google + Apple.
- **Apps** : Capacitor (mobile), Tauri v2 (PC).
- **Contenu** : JSON validé par Zod dans `packages/content`.
- **Qualité** : Vitest, Playwright, ESLint, Prettier, GitHub Actions avec preview par PR.

## Structure du dépôt
```
apps/client     apps/server     apps/mobile     apps/desktop
packages/sim    packages/content    packages/shared    packages/render
docs/gdd        docs/adr        docs/DECISIONS.md        docs/LICENSES.md
```

## Budgets
- 60 fps sur iPhone 12 et Android milieu de gamme.
- Premier chargement < 40 Mo.
- Latence perçue < 100 ms.

## Assets
CC0 provisoires (Kenney, Quaternius, Poly Haven), licences dans `docs/LICENSES.md`.
