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
- **2026-11-07** — Salons de signalisation : un Durable Object SQLite par code (nommé `idFromName(code)`), API
  d'hibernation WebSocket (pas de durée comptée au repos), état reconstruit depuis les étiquettes des sockets. Les
  codes (6 lettres, sans I ni O) sont générés sans biais de modulo. Un invité ne peut signaler qu'à l'hôte.
  Alternative écartée : PeerJS Cloud (service tiers gratuit mais sans garantie ni contrôle).
- **2026-11-07** — `@astraelis/shared` ne garde que ce qui est partagé entre navigateur et Workers (codes de salon,
  protocole de signalisation) ; les constantes de simulation réseau vivent dans `@astraelis/net`.
- **2026-11-07** — WebRTC : deux DataChannels par invité, « fiable » (événements) et « etat » (ordonné, sans
  retransmission, pour le flux à 20 Hz). STUN public gratuit de Cloudflare ; le TURN viendra par le Worker. L'invité
  ferme sa signalisation dès que le pair-à-pair est ouvert (moins de requêtes Workers).
- **2026-11-07** — La simulation de l'hôte avance sur une minuterie avec rattrapage, pas sur `requestAnimationFrame`
  (suspendu dans un onglet caché : la partie gelait si l'hôte changeait d'onglet). Limite connue : en arrière-plan,
  le navigateur ralentit les minuteries à 1/s, donc les invités reçoivent l'état par à-coups. Correctif prévu : faire
  tourner l'hôte dans un Web Worker.
- **2026-11-07** — Le client appelle l'API en chemin relatif (`/api/...`) : Vite la relaie vers `wrangler dev` en
  local, et en production le même Worker servira le jeu et l'API (même origine, pas de CORS).
- **2026-11-07** — Hébergement : **Workers Static Assets** plutôt que Cloudflare Pages. Le même Worker sert le jeu et
  l'API (même origine, un seul déploiement) ; les fichiers statiques sont gratuits et illimités, seul `/api/*`
  invoque le Worker. Cloudflare oriente les nouveaux projets vers Workers. Prévisualisation par PR via
  `wrangler versions upload --preview-alias`. Le workflow est inerte sans secrets Cloudflare.
- **2026-11-08** — **Direction artistique : abandon du rendu « peint »** (rampe toon, filtre Kuwahara, contours) au
  profit d'un **réalisme stylisé cinématique** façon JRPG moderne : PBR, lumière plausible, post-traitement lourd,
  personnages héroïques. On reprend les principes, jamais le contenu d'un jeu existant. Le GDD (§8) est mis à jour.
- **2026-11-08** — Pipeline de rendu avec les passes fournies par Three.js (`EffectComposer`) plutôt que la
  bibliothèque `postprocessing` : aucune dépendance de plus, et tout tient dans une seule chaîne. Ordre : rendu en
  virgule flottante → GTAO (demi-résolution, Cinéma seulement) → bloom (seuil 0,85, rayon 0,6, force 0,9) →
  ACES + sRGB → LUT → vignette → SMAA. Le palier Léger saute le composeur : ACES directement et MSAA natif.
- **2026-11-08** — La LUT d'étalonnage 32³ est **calculée** (teinte des ombres, des hautes lumières, saturation,
  contraste) au lieu d'être peinte dans GIMP : réglages lisibles et testés, zéro fichier binaire, une par région.
  Les réglages visuels (exposition, brouillard, lumières, LUT) vivent dans `apps/client/src/jeu/rendu/ambiances.ts`,
  au-dessus de `packages/content` dont les données ne changent pas.
- **2026-11-08** — Ombres : une seule lumière à ombres (la lune), carte de 2048 (Cinéma) ou 1024 (Équilibré) qui suit
  le joueur sur 56 m, calée sur la grille des texels pour ne pas scintiller. La « cascade loin » est le brouillard :
  une seconde carte coûterait un rendu de plus pour des ombres que la brume efface déjà.
- **2026-11-08** — Captures et mesures avec Playwright (`pnpm capture`), Chromium sans interface mais sur le vrai
  GPU (Metal). Limite : l'émulation mobile ralentit le processeur (×4) mais pas le GPU ; la vraie mesure 30 i/s sur
  téléphone viendra avec la PR d'optimisation mobile.
- **2026-11-08** — Ciel : Astrælis est une sphère calculée dans le shader du ciel (intersection rayon / sphère), pas
  un maillage : éclairée par un soleil lointain (phase gibbeuse, modèle de Lommel-Seeliger des corps sans
  atmosphère), texture et relief NASA (domaine public) recolorés bleu-argent, veines de lunite émissives par bruit
  « crête », plus visibles sur la face nocturne. Rayon angulaire porté à 0,15 rad au Prologue : la lune occupe une
  grande part du cadre. L'anneau de débris de Vaelis passe devant elle, ce qui donne la profondeur.
- **2026-11-08** — Brume : cônes additifs sous les lanternes (fondus selon l'angle de vue) et particules
  (lucioles autour des lanternes, poussière sur la place) animées dans le shader de sommets, 800 points (300 en
  Léger), un seul appel de dessin. Pas de vraie brume volumétrique par marche de rayons : trop chère sur téléphone.
- **2026-11-08** — Assets téléchargés rejouables : `tools/assets/sources.json` (URL, empreinte, licence) et
  `pnpm assets`. Les fichiers sont aussi versionnés pour que le build ne dépende pas du réseau.
- **2026-11-08** — Bâtiments de Sarn **générés par le code** à partir des rectangles de la carte, plutôt que
  modélisés dans Blender (non installé ici, et des fichiers binaires seraient plus durs à relire et à rejouer).
  Chaque côté d'îlot devient une rangée de maisons de 5 à 6 m : rez de pierre ou soubassement, enduit teinté
  (couleurs de sommets), colombages, fenêtres à appuis et volets, environ 45 % éclairées, porte, toit de tuiles à
  pignons. Aléatoire à graine fixe : même ville à chaque partie. Le faîte ne dépasse jamais la hauteur de la carte
  (test), donc Astrælis reste visible au-dessus des toits nord.
- **2026-11-08** — Une fusion de géométrie par matériau (6 appels de dessin pour toute la ville). Textures Poly
  Haven 1K (couleur, normale, ARM) en UV « monde » : même échelle sur tous les volumes, aucun dépliage.
- **2026-11-08** — Flaques par masque de bruit dans le shader du pavé (rugosité presque nulle, normale à plat,
  albédo assombri) : reflets des lanternes sans texture ni passe de réflexion. Une lumière de remplissage froide,
  opposée à la lune et sans ombre, garde lisibles les façades à contre-jour.
- **2026-11-08** — Incident : la PR #14 a été fusionnée alors que la CI était rouge (erreur de typage dans un test).
  Corrigé par la PR suivante. Règle désormais appliquée mécaniquement : la fusion est enchaînée au code de sortie de
  `gh pr checks --watch` (`&&`), jamais décidée en lisant une sortie tronquée.
- **2026-11-08** — Modèles de décor Poly Haven (CC0) passés par un pipeline **gltf-transform + meshoptimizer** :
  soudure, simplification, compression `EXT_meshopt_compression`, un `.glb` par modèle. Les sources brutes vont dans
  `tools/assets/.cache/` (non versionné) ; seules les sorties optimisées sont versionnées. Résultat : 121 k → 16 k
  triangles pour les quatre modèles. Chaque modèle est instancié (un appel de dessin par matériau).
- **2026-11-08** — Accessoires (tonneaux, caisses, plantes) posés à 0,45 m des façades par une fonction pure et
  testée, sans toucher aux collisions : le joueur peut les frôler de quelques centimètres. Si ça gêne, on ajoutera
  des obstacles dans `packages/content`, ce qui est une décision de jeu, pas de rendu.
- **2026-11-08** — Fête des Lampes : fanions sur des cordes entre les lampadaires de la place, pointes animées
  dans le shader de sommets ; pétales et feuilles au sol instanciés (1 500, 600 en Léger) ; eau de la fontaine et
  de la mer animée par perturbation de normale ; rideau d'eau additif sous la vasque.
