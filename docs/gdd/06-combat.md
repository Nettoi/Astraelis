# 6. Combat « Tempo »

Temps réel, avec un mode tactique en solo.

| Mécanique | Règle |
| --- | --- |
| Attaques de base | Libres, remplissent la jauge Tempo |
| Jauge Tempo | 3 segments ; les compétences coûtent des segments |
| Parade / esquive | Fenêtre de 180 ms ; parfaite à 80 ms. Parade parfaite = +1 segment et nourrit l'Invocation |
| Télégraphes | Tout coup ennemi est annoncé visuellement et par le son |
| Fêlure | 7 coups sur la faiblesse brisent l'ennemi : dégâts ×2 pendant 8 s |
| Résonances | Attaques en duo selon le Lien (joueur-compagnon ou joueur-joueur) |
| Invocations lunaires | Ultimes d'équipe, une par Héraut vaincu, cinématique de 6 à 8 s |
| Mode Tactique (solo) | Temps à 10 % pendant le choix d'une commande, menu de commandes |

## Constellations (classes échangeables)
Veilleur, Rempart, Chantre, Éclatiste, Rôdeur des Cendres, Mécaniste, Oracle.

## Difficultés
Histoire, Veilleur, Insomniaque.

## Exigences techniques
La simulation de combat vit dans `packages/sim` : déterministe, partagée client/serveur, testée et fuzzée.
