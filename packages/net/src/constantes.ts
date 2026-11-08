/** Fréquence de la simulation de l'hôte et des envois d'état (GDD §5). */
export const TICK_HZ = 20;
export const TICK_MS = 1000 / TICK_HZ;
/** Joueurs maximum dans une partie coop. */
export const JOUEURS_MAX = 4;
/** Nombre maximal d'entrées en attente par joueur (au-delà, les plus anciennes sont jetées). */
export const ENTREES_EN_ATTENTE_MAX = 30;
/** Entrées consommées par joueur et par tick au plus (rattrapage sans accélération). */
export const ENTREES_PAR_TICK_MAX = 2;
/** Entrées par message au plus. */
export const ENTREES_PAR_MESSAGE_MAX = 10;
/** Longueur maximale d'un nom de Veilleur. */
export const NOM_LONGUEUR_MAX = 20;
/** Retard d'affichage des autres joueurs chez un invité (interpolation entre deux états). */
export const RETARD_INTERPOLATION_MS = 100;
