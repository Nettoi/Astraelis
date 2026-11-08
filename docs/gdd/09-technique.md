# 9. Technique

Contrainte : **0 $ par mois** — voir [`../COUTS.md`](../COUTS.md). Aucun serveur permanent.

## Stack

- Monorepo pnpm + TypeScript strict, Node 22.
- **Client** : Vite, Three.js (WebGPURenderer, repli WebGL2), React pour l'UI, Zustand, Howler, glTF + Draco/meshopt +
  KTX2, i18n FR/EN dès le premier jour, PWA (manifest, service worker, solo hors ligne).
- **Réseau** : WebRTC DataChannel (non fiable ordonné pour l'état, fiable pour les événements), hôte autoritaire ;
  Worker Cloudflare + Durable Object pour la signalisation et les salons ; TURN Cloudflare Realtime.
- **Backend léger** : Cloudflare Workers + D1 (comptes, sauvegardes, classements, guildes) + R2 (assets).
- **Auth** : lien magique par courriel (Resend) + Google OAuth.
- **`packages/sim`** : simulation déterministe partagée hôte/invités, fuzzée ; pourra tourner dans un Durable Object
  si un mode autoritaire devient finançable.
- **Contenu** : JSON validé par Zod dans `packages/content` (compétences, ennemis, quêtes, dialogues), jamais en dur.
- **Qualité** : Vitest, Playwright, ESLint, Prettier, GitHub Actions (lint, tests, build, prévisualisation Cloudflare
  par PR).

Interdits (coût) : Colyseus ou tout serveur Node permanent, VPS, base payante, API d'IA en production, analytique
payante (Cloudflare Web Analytics suffit), CDN tiers.

## Structure du dépôt

```
apps/client       jeu web (Three.js + React, PWA)
apps/edge         Workers Cloudflare (auth, sauvegardes, signalisation, classements)
packages/sim      simulation déterministe
packages/net      WebRTC, hôte/invité, migration d'hôte
packages/content  données de jeu + schémas Zod
packages/render   matériaux, ciel, post-traitement cinématique
packages/shared   types, protocole, utilitaires
docs/gdd  docs/adr  docs/DECISIONS.md  docs/COUTS.md  docs/LICENSES.md
```

## Budgets

- 60 fps sur iPhone 12 et Android milieu de gamme.
- Premier chargement < 30 Mo ; streaming des zones depuis R2.
- Latence coop perçue < 120 ms.

## Assets et licences

Uniquement gratuits ou libres (CC0, CC-BY, MIT, OFL) : Kenney, Quaternius, Poly Haven, Mixamo, OpenGameArt,
Freesound, Kevin MacLeod (CC-BY). Chaque asset est listé dans `docs/LICENSES.md` ; l'écran de crédits est généré
depuis ce fichier.
