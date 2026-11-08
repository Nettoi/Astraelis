/**
 * Étalonnage des couleurs par LUT 3D, générée par calcul plutôt que dessinée dans GIMP :
 * les paramètres sont lisibles, versionnés et testables (docs/DECISIONS.md).
 * La LUT s'applique après le tonemapping ACES, sur des valeurs sRGB dans [0, 1].
 */
export interface Etalonnage {
  /** Teinte ajoutée aux ombres (RVB, ±0,1 environ). */
  teinteOmbres: readonly [number, number, number];
  /** Teinte ajoutée aux hautes lumières. */
  teinteLumieres: readonly [number, number, number];
  /** 1 = neutre. */
  saturation: number;
  /** 1 = neutre ; courbe en S autour de 0,5. */
  contraste: number;
}

export const NEUTRE: Etalonnage = {
  teinteOmbres: [0, 0, 0],
  teinteLumieres: [0, 0, 0],
  saturation: 1,
  contraste: 1,
};

const borner = (v: number) => Math.min(1, Math.max(0, v));

/** Applique l'étalonnage à une couleur sRGB. */
export function etalonner(e: Etalonnage, r: number, g: number, b: number): [number, number, number] {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const ombre = (1 - luma) ** 2;
  const lumiere = luma ** 2;
  const c = [r, g, b].map((v, i) => {
    let x = v + e.teinteOmbres[i]! * ombre + e.teinteLumieres[i]! * lumiere;
    x = luma + (x - luma) * e.saturation;
    return borner(0.5 + (x - 0.5) * e.contraste);
  });
  return c as [number, number, number];
}

/** Données RGBA 8 bits d'une LUT de côté `taille` (rouge le plus rapide, puis vert, puis bleu). */
export function genererLut(e: Etalonnage, taille = 32): Uint8Array {
  const donnees = new Uint8Array(taille ** 3 * 4);
  let o = 0;
  for (let bi = 0; bi < taille; bi++)
    for (let gi = 0; gi < taille; gi++)
      for (let ri = 0; ri < taille; ri++) {
        const [r, g, b] = etalonner(e, ri / (taille - 1), gi / (taille - 1), bi / (taille - 1));
        donnees[o++] = Math.round(r * 255);
        donnees[o++] = Math.round(g * 255);
        donnees[o++] = Math.round(b * 255);
        donnees[o++] = 255;
      }
  return donnees;
}
