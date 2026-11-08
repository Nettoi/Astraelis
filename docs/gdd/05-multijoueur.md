# 5. Multijoueur coop (gratuit, pair-à-pair)

## Parties

- 1 à 4 joueurs. L'hôte crée une partie et reçoit un **code à 6 lettres** ; les autres rejoignent par le code ou un
  lien. Drop-in / drop-out à tout moment.
- La progression d'histoire est celle de l'hôte ; le butin et l'expérience sont à chacun.

## Réseau

- **Hôte autoritaire** : la simulation (`packages/sim`) tourne chez l'hôte ; les invités envoient leurs entrées et
  reçoivent l'état à 20 Hz (interpolation, prédiction locale du déplacement, réconciliation).
- **Migration d'hôte** si l'hôte part.
- WebRTC DataChannel : non fiable ordonné pour l'état, fiable pour les événements.
- Signalisation et liste de salons : Worker Cloudflare + Durable Object. TURN Cloudflare Realtime en secours.

## Social (gratuit)

- Liste d'amis par code.
- Classements hebdomadaires (temps de boss, Arène des Hérauts en défi contre la montre) stockés dans D1.
- Ordres de Veilleurs (guildes) : simples groupes avec tableau d'honneur.

## Solo

Toute la campagne se joue seul avec compagnons IA. Le solo fonctionne hors ligne (PWA) ; la sauvegarde se
synchronise au retour en ligne.

## Hors périmètre tant que non finançable

PvP classé et raids massifs (exigent un serveur autoritaire). L'architecture le permettra sans réécriture : la
simulation est séparée du réseau et pourra tourner dans un Durable Object.

## Modèle

Gratuit à jouer pendant le développement. Zéro pay-to-win, zéro gacha, zéro publicité.
