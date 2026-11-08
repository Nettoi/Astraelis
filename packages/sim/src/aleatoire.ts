/**
 * Générateur pseudo-aléatoire déterministe (mulberry32), pour le combat et les
 * événements de la simulation. Même graine = même suite sur toutes les plateformes.
 */
export interface Aleatoire {
  /** Entier non signé sur 32 bits. */
  suivant(): number;
  /** Entier dans [min, max] inclus. */
  entier(min: number, max: number): number;
  /** État interne, pour sauvegarder et reprendre la suite. */
  etat(): number;
}

export function creerAleatoire(graine: number): Aleatoire {
  let s = graine >>> 0;
  const suivant = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  return {
    suivant,
    entier(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
        throw new RangeError(`intervalle invalide [${min}, ${max}]`);
      }
      return min + (suivant() % (max - min + 1));
    },
    etat: () => s,
  };
}
