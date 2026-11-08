import { AXE_MAX } from "@astraelis/sim";

/** État partagé des commandes ; écrit par le clavier et la manette tactile, lu à chaque tick. */
export const commandes = { haut: false, bas: false, gauche: false, droite: false, tactileX: 0, tactileZ: 0 };

const TOUCHES: Record<string, keyof Pick<typeof commandes, "haut" | "bas" | "gauche" | "droite">> = {
  KeyW: "haut",
  KeyZ: "haut",
  ArrowUp: "haut",
  KeyS: "bas",
  ArrowDown: "bas",
  KeyA: "gauche",
  KeyQ: "gauche",
  ArrowLeft: "gauche",
  KeyD: "droite",
  ArrowRight: "droite",
};

export function brancherClavier(cible: Window): () => void {
  const changer = (valeur: boolean) => (e: KeyboardEvent) => {
    const nom = TOUCHES[e.code];
    if (nom) {
      commandes[nom] = valeur;
      e.preventDefault();
    }
  };
  const bas = changer(true);
  const haut = changer(false);
  const perte = () => Object.assign(commandes, { haut: false, bas: false, gauche: false, droite: false });
  cible.addEventListener("keydown", bas);
  cible.addEventListener("keyup", haut);
  cible.addEventListener("blur", perte);
  return () => {
    cible.removeEventListener("keydown", bas);
    cible.removeEventListener("keyup", haut);
    cible.removeEventListener("blur", perte);
  };
}

/**
 * Convertit les commandes en axes entiers de la simulation. La manette tactile
 * (valeurs dans [-1, 1]) l'emporte si elle est utilisée. z négatif = vers le nord (haut de l'écran).
 */
export function lireAxes(c: typeof commandes): { ax: number; az: number } {
  if (c.tactileX !== 0 || c.tactileZ !== 0) {
    return { ax: Math.round(c.tactileX * AXE_MAX), az: Math.round(c.tactileZ * AXE_MAX) };
  }
  const ax = (c.droite ? AXE_MAX : 0) - (c.gauche ? AXE_MAX : 0);
  const az = (c.bas ? AXE_MAX : 0) - (c.haut ? AXE_MAX : 0);
  return { ax, az };
}
