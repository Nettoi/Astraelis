# 6. Combat « Tempo »

Temps réel, avec un mode tactique en solo.

| Mécanique            | Règle                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Attaques de base     | Libres ; la jauge Tempo se remplit avec le temps et les coups                              |
| Jauge Tempo          | 3 segments ; les compétences coûtent des segments                                          |
| Parade / esquive     | Fenêtre de 180 ms ; parfaite à 80 ms. Parade parfaite = +1 segment et nourrit l'Invocation |
| Télégraphes          | Chaque coup ennemi est annoncé : lueur, son, posture                                       |
| Fêlure               | 7 coups sur la faiblesse brisent l'ennemi : dégâts ×2 pendant 8 s                          |
| Résonances           | Attaques en duo selon le Lien (joueur-compagnon ou joueur-joueur)                          |
| Invocations lunaires | Ultimes de groupe, une par Héraut vaincu, cinématique en moteur de 6 à 8 s, jauge partagée |
| Mode Tactique (solo) | Temps à 10 % pendant le choix d'une commande, menu de commandes                            |

## Constellations (classes échangeables)

Échangeables en ville, un seul personnage par joueur : Veilleur, Rempart, Chantre, Éclatiste, Rôdeur des Cendres,
Mécaniste, Oracle.

## Difficultés

- **Histoire** — parades automatiques.
- **Veilleur** — normal.
- **Insomniaque** — pas de télégraphe visuel (le son et la posture restent).

## Exigences techniques

La simulation de combat vit dans `packages/sim` : déterministe, partagée hôte/invités (même graine = même résultat), testée et fuzzée.
