/** Paliers de qualité du rendu (docs/gdd/08-direction-artistique.md, docs/DECISIONS.md). */
export type Palier = "cinema" | "equilibre" | "leger";
export const PALIERS: readonly Palier[] = ["cinema", "equilibre", "leger"];

export interface ReglagesRendu {
  /** Chaîne de post-traitement (sinon : ACES appliqué directement par le moteur). */
  postTraitement: boolean;
  ombres: boolean;
  /** Côté de la carte d'ombre de la lune, en texels. */
  tailleOmbre: number;
  /** Occlusion ambiante GTAO en demi-résolution. */
  ao: boolean;
  bloom: boolean;
  smaa: boolean;
  /** Plafond du rapport pixels physiques / pixels CSS. */
  ratioPixelsMax: number;
}

export const REGLAGES: Record<Palier, ReglagesRendu> = {
  cinema: {
    postTraitement: true,
    ombres: true,
    tailleOmbre: 2048,
    ao: true,
    bloom: true,
    smaa: true,
    ratioPixelsMax: 2,
  },
  equilibre: {
    postTraitement: true,
    ombres: true,
    tailleOmbre: 1024,
    ao: false,
    bloom: true,
    smaa: true,
    ratioPixelsMax: 1.5,
  },
  leger: {
    postTraitement: false,
    ombres: false,
    tailleOmbre: 0,
    ao: false,
    bloom: false,
    smaa: false,
    ratioPixelsMax: 1,
  },
};

export interface MaterielDetecte {
  /** Chaîne WEBGL_debug_renderer_info (vide si inconnue). */
  gpu: string;
  /** Plus petit côté de l'écran en pixels CSS. */
  petitCote: number;
  tactile: boolean;
  /** navigator.deviceMemory en Go, si exposé. */
  memoireGo?: number | undefined;
}

const LOGICIEL = /swiftshader|llvmpipe|softpipe|basic render|software/i;
const MOBILE_CAPABLE =
  /apple gpu|adreno \(tm\) (6[4-9]\d|[7-9]\d\d)|mali-g(7[1-9]|[89]\d|\d{3})|immortalis|xclipse/i;
const BUREAU_PUISSANT = /nvidia|geforce|quadro|rtx|radeon|amd|apple m\d|iris xe|arc/i;

/** Choisit le palier de départ ; le joueur peut le changer dans les options. */
export function detecterPalier(m: MaterielDetecte): Palier {
  if (LOGICIEL.test(m.gpu)) return "leger";
  if (m.memoireGo !== undefined && m.memoireGo <= 2) return "leger";
  const mobile = m.tactile && m.petitCote < 900;
  if (mobile) return MOBILE_CAPABLE.test(m.gpu) ? "equilibre" : "leger";
  return BUREAU_PUISSANT.test(m.gpu) ? "cinema" : "equilibre";
}

/** Lit un choix explicite (paramètre d'URL `?qualite=` ou options) ; `undefined` = automatique. */
export function lirePalier(valeur: string | null | undefined): Palier | undefined {
  return PALIERS.find((p) => p === valeur);
}
