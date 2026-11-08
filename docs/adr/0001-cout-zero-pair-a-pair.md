# ADR 0001 — Coût zéro : pair-à-pair hôte autoritaire au lieu d'un serveur Colyseus

- **Date** : 2026-11-07
- **Statut** : accepté

## Contexte

La première version de la spécification prévoyait un serveur Node + Colyseus sur Fly.io, MongoDB Atlas et Redis.
La version « coût zéro » impose 0 $/mois : aucun serveur permanent.

## Décision

- Multijoueur coop 1–4 en WebRTC : l'hôte fait tourner `packages/sim` et fait autorité ; les invités envoient leurs
  entrées et reçoivent l'état à 20 Hz.
- Signalisation, salons, comptes, sauvegardes et classements sur Cloudflare Workers + Durable Objects + D1.
- Le serveur Colyseus commencé (salle, tests) n'est pas fusionné ; sa logique pure (file d'entrées plafonnée, nettoyage
  des noms) est reprise côté hôte dans `packages/net`.

## Alternatives écartées

- Colyseus sur Fly.io : payant au-delà de l'essai.
- Simulation dans un Durable Object : possible plus tard, mais la facturation à la durée d'exécution d'un tick à 20 Hz
  sortirait vite du palier gratuit.

## Conséquences

- Un hôte peut tricher sur sa propre partie : acceptable en coop, inacceptable en PvP classé (hors périmètre).
- La simulation reste indépendante du réseau, donc transportable plus tard dans un Durable Object.
