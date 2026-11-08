/**
 * Canal bidirectionnel entre l'hôte et UN invité. Implémenté par WebRTC DataChannel
 * dans le navigateur et par une paire en mémoire dans les tests.
 */
export interface Canal<Envoi, Reception> {
  envoyer(message: Envoi): void;
  surMessage(rappel: (message: Reception) => void): void;
  surFermeture(rappel: () => void): void;
  fermer(): void;
}

/** Paire de canaux reliés en mémoire, livraison synchrone (tests, solo local). */
export function creerPaireMemoire<A, B>(): [Canal<A, B>, Canal<B, A>] {
  type Cote<E, R> = {
    recevoir: ((m: R) => void)[];
    fermer: (() => void)[];
    ouvert: boolean;
    autre?: Cote<R, E>;
  };
  const a: Cote<A, B> = { recevoir: [], fermer: [], ouvert: true };
  const b: Cote<B, A> = { recevoir: [], fermer: [], ouvert: true };
  a.autre = b;
  b.autre = a;
  const fermerTout = () => {
    if (!a.ouvert) return;
    a.ouvert = b.ouvert = false;
    for (const f of [...a.fermer, ...b.fermer]) f();
  };
  // Copie structurée : comme sur le réseau, l'émetteur ne partage aucune référence avec le récepteur.
  const canal = <E, R>(moi: Cote<E, R>): Canal<E, R> => ({
    envoyer: (m) => {
      if (moi.ouvert) for (const r of moi.autre!.recevoir) r(structuredClone(m));
    },
    surMessage: (r) => void moi.recevoir.push(r),
    surFermeture: (r) => void moi.fermer.push(r),
    fermer: fermerTout,
  });
  return [canal(a), canal(b)];
}
