import { appliquerEntree, type CarteCollision, type Entree, type EtatJoueur } from "./mouvement";

/**
 * Réconciliation côté client : repart du dernier état confirmé par le serveur et
 * rejoue les entrées que le serveur n'a pas encore traitées.
 */
export function reconcilier(
  etatServeur: EtatJoueur,
  derniereSeqTraitee: number,
  entreesEnAttente: readonly Entree[],
  carte: CarteCollision,
): { etat: EtatJoueur; restantes: Entree[] } {
  const restantes = entreesEnAttente.filter((e) => e.seq > derniereSeqTraitee);
  let etat = etatServeur;
  for (const e of restantes) etat = appliquerEntree(etat, e, carte);
  return { etat, restantes };
}
