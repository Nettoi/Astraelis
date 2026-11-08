import { detecterPalier, lirePalier, type Palier } from "./qualite";

const CLE = "astraelis.qualite";

/** Palier proposé d'après le matériel (carte graphique, taille d'écran, mémoire). */
export function palierDetecte(): Palier {
  let gpu: string;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    gpu = ext ? String(gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : (gl?.getParameter(gl.RENDERER) ?? "");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    /* WebGL indisponible : le palier léger s'impose */
    return "leger";
  }
  return detecterPalier({
    gpu,
    petitCote: Math.min(screen.width, screen.height),
    tactile: navigator.maxTouchPoints > 0,
    memoireGo: (navigator as { deviceMemory?: number }).deviceMemory,
  });
}

/** Choix explicite : `?qualite=` dans l'URL, sinon celui des options ; `undefined` = automatique. */
export function choixQualite(): Palier | undefined {
  const url = lirePalier(new URLSearchParams(location.search).get("qualite"));
  if (url) return url;
  try {
    return lirePalier(localStorage.getItem(CLE));
  } catch {
    return undefined;
  }
}

export function enregistrerQualite(p: Palier | undefined): void {
  try {
    if (p) localStorage.setItem(CLE, p);
    else localStorage.removeItem(CLE);
  } catch {
    /* stockage indisponible : le choix vaut pour cette session */
  }
}
