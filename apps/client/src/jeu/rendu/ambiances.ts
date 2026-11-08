import type { Etalonnage } from "./lut";

/**
 * Réglages visuels par région. C'est une couche au-dessus de `packages/content` :
 * les données de jeu (collisions, apparitions, limites) n'en dépendent pas.
 */
export interface Ambiance {
  exposition: number;
  /** Densité du brouillard exponentiel (par mètre). */
  brouillard: number;
  /** Intensité de l'éclairage d'environnement (HDRI de nuit). */
  environnement: number;
  lune: { couleur: string; intensite: number };
  lanternes: { couleur: string; intensite: number; portee: number };
  etalonnage: Etalonnage;
  /** 0 = aucune vignette. */
  vignette: number;
}

const SARN: Ambiance = {
  exposition: 0.9,
  brouillard: 0.011,
  environnement: 0.22,
  lune: { couleur: "#a9bbff", intensite: 1.7 },
  lanternes: { couleur: "#ffa94d", intensite: 14, portee: 16 },
  // Contraste chaud / froid : ombres bleu nuit, hautes lumières dorées.
  etalonnage: {
    teinteOmbres: [-0.02, 0.0, 0.06],
    teinteLumieres: [0.05, 0.02, -0.04],
    saturation: 1.08,
    contraste: 1.1,
  },
  vignette: 0.35,
};

const AMBIANCES: Record<string, Ambiance> = { sarn: SARN };

export function ambianceDe(idZone: string): Ambiance {
  return AMBIANCES[idZone] ?? SARN;
}
