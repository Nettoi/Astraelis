# ASTRÆLIS

JRPG coopératif en ligne (1 à 4 joueurs) en 3D au réalisme stylisé cinématique, jouable dans le navigateur, sur PC et téléphone.
Vaelis est née sous sept lunes qui tombent une à une ; la dernière, Astrælis, descend, et le ciel entier est une
horloge.

**Coût d'exploitation : 0 $ par mois** — voir [`docs/COUTS.md`](docs/COUTS.md).

## Architecture

```
navigateur (hôte)  ──WebRTC──  navigateur (invité) ×3
   │  simulation autoritaire        │  prédiction + réconciliation
   │                                │
   └──── WebSocket (signalisation, quelques secondes) ────┐
                                                          ▼
                           Cloudflare Worker « astraelis-edge »
                           ├─ fichiers du jeu (statiques, gratuits)
                           └─ /api/salons → Durable Object par code de partie
```

Aucun serveur de jeu : celui qui crée la partie fait tourner la simulation ; le Worker ne sert qu'à se trouver.

| Dossier            | Rôle                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `apps/client`      | Jeu web : Vite, Three.js, React. Écran d'accueil, rendu de Sarn, ciel et Astrælis, commandes |
| `apps/edge`        | Worker Cloudflare : sert le jeu, crée les salons (code à 6 lettres), relaie la signalisation |
| `packages/sim`     | Simulation déterministe en entiers (mouvement, collisions, réconciliation, aléatoire)        |
| `packages/net`     | Hôte autoritaire, invité, protocole, adaptateur WebRTC                                       |
| `packages/content` | Données de jeu en JSON validées par Zod (zone de Sarn)                                       |
| `packages/shared`  | Code partagé navigateur / Worker (codes de salon, protocole de signalisation)                |
| `docs/`            | [GDD](docs/gdd/), [décisions](docs/DECISIONS.md), [ADR](docs/adr/), coûts, licences          |

## Commandes

Prérequis : Node 22 et pnpm (via `corepack enable`).

```sh
pnpm install
pnpm dev          # jeu sur http://localhost:5173 + Worker local (wrangler) sur :8787
pnpm test         # tous les tests (Vitest)
pnpm lint         # ESLint
pnpm typecheck    # TypeScript strict
pnpm build        # build de production du jeu
pnpm capture      # captures 1080p + mobile et images par seconde (jeu lancé par pnpm dev)
```

Pour tester la coop en local : un onglet _Créer une partie_, un second onglet ouvre le lien copié et _Rejoindre_.

## Déploiement

Chaque fusion sur `main` déploie le Worker (jeu + API) ; chaque PR reçoit une version de prévisualisation. Le
workflow ne fait rien tant que ces deux secrets du dépôt ne sont pas définis :

1. Créer un compte Cloudflare gratuit (plan Workers Free).
2. _My Profile → API Tokens → Create Token → modèle « Edit Cloudflare Workers »_.
3. Dans GitHub, _Settings → Secrets and variables → Actions_ : `CLOUDFLARE_API_TOKEN` (le jeton) et
   `CLOUDFLARE_ACCOUNT_ID` (visible sur la page d'accueil du tableau de bord Cloudflare).

Le jeu est alors en ligne sur `https://astraelis-edge.<sous-domaine>.workers.dev`.

## Feuille de route

- **Phase 0** (en cours) : monorepo et CI ✅, simulation partagée ✅, Sarn en greybox sous Astrælis ✅, coop à 4 en
  pair-à-pair ✅, déploiement public, comptes (lien magique + Google).
- **Phase 1** : Prologue complet, 3 Constellations, combat Tempo, un boss, rendu cinématique, PWA, 60 fps mobile.
- **Phase 2** : Acte I, Cartes des Constellations, classements, Ordres de Veilleurs.
- **Phase 3** : Acte II, Arène des Hérauts, saisons d'événements de Marée.
- **Phase 4** : Acte III, fins, vote communautaire, lancement.

Détails : [`docs/gdd/10-feuille-de-route.md`](docs/gdd/10-feuille-de-route.md).

## Licences

Code du projet : tous droits réservés pour l'instant. Assets tiers : [`docs/LICENSES.md`](docs/LICENSES.md).
