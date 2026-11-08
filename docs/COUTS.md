# Coûts — objectif 0 $ par mois

**Total actuel : 0 $/mois.** Chaque service est ajouté ici AVANT d'être utilisé, avec la limite de son palier gratuit
vérifiée à la date indiquée. Si un besoin dépasse un palier, on trouve une alternative gratuite ou on réduit la
fonctionnalité ; une dépense n'est proposée que si elle est inévitable, chiffrée.

| Besoin                            | Solution                                                              | Limite du palier gratuit                                                                                    | Statut      | Vérifié le |
| --------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| Dépôt, CI, déploiement            | GitHub public + Actions                                               | Minutes illimitées (dépôt public)                                                                           | **actif**   | 2026-11-07 |
| Hébergement du jeu web            | Workers Static Assets (même Worker que l'API)                         | Fichiers statiques **gratuits et illimités** ; seul `/api/*` compte dans les 100 k requêtes Workers/jour    | **en code** | 2026-11-07 |
| Assets (CDN)                      | Cloudflare R2                                                         | 10 Go stockés, sortie gratuite                                                                              | prévu       | —          |
| Comptes, sauvegardes, classements | Cloudflare D1 via Workers                                             | 5 Go, 5 M lectures/jour, 100 k requêtes Workers/jour                                                        | prévu       | —          |
| Signalisation WebRTC, salons      | Worker + Durable Objects SQLite (hibernation WebSocket)               | 100 k requêtes Workers/jour ; plan Free : DO SQLite seulement, tout dépassement **échoue sans facturation** | **en code** | 2026-11-07 |
| TURN (NAT strict)                 | Cloudflare Realtime TURN                                              | 1 To/mois                                                                                                   | prévu       | —          |
| Multijoueur                       | WebRTC pair-à-pair, hôte autoritaire                                  | Aucun serveur de jeu                                                                                        | prévu       | —          |
| Connexion                         | Resend (lien magique) + Google OAuth                                  | Resend : 3 000 courriels/mois                                                                               | prévu       | —          |
| Polices                           | Google Fonts (OFL)                                                    | —                                                                                                           | prévu       | —          |
| Assets 3D, audio                  | Kenney, Quaternius, Poly Haven, OpenGameArt, Freesound, Kevin MacLeod | Licence à vérifier par asset                                                                                | prévu       | —          |
| Domaine                           | `astraelis-edge.<compte>.workers.dev`                                 | Gratuit                                                                                                     | **en code** | 2026-11-07 |
| Distribution                      | itch.io + le site                                                     | —                                                                                                           | prévu       | —          |

« prévu » = limite tirée de la spécification, à revérifier sur la page de tarifs officielle au moment de l'activation.

## Dépenses volontairement exclues

- Domaine personnel (~15 $/an) : seulement sur demande.
- Stores : Apple (99 $/an), Google (25 $ une fois) — pas tant que le jeu n'a pas de public ; PWA à la place.
- Serveur autoritaire (PvP classé, raids massifs) : hors périmètre tant que non finançable.
