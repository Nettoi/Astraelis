import { AXE_MAX, type Entree } from "@astraelis/sim";
import { ENTREES_PAR_MESSAGE_MAX } from "./constantes";

export interface JoueurReseau {
  readonly id: string;
  readonly nom: string;
  readonly x: number;
  readonly z: number;
  /** Dernière entrée de ce joueur appliquée par l'hôte. */
  readonly seq: number;
}

/** Invité → hôte. */
export type MessageInvite =
  { readonly t: "bonjour"; readonly nom: string } | { readonly t: "entrees"; readonly entrees: Entree[] };

/** Hôte → invité. */
export type MessageHote =
  | { readonly t: "bienvenue"; readonly id: string; readonly zone: string }
  | { readonly t: "complet" }
  | { readonly t: "etat"; readonly tick: number; readonly joueurs: JoueurReseau[] };

const estEntier = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/**
 * Valide un message reçu d'un pair (jamais digne de confiance). Renvoie null si invalide.
 * Validation écrite à la main : ce chemin est appelé 20 fois par seconde et par invité.
 */
export function lireMessageInvite(brut: unknown): MessageInvite | null {
  if (typeof brut !== "object" || brut === null) return null;
  const m = brut as Record<string, unknown>;
  if (m.t === "bonjour") return typeof m.nom === "string" ? { t: "bonjour", nom: m.nom.slice(0, 100) } : null;
  if (m.t !== "entrees" || !Array.isArray(m.entrees) || m.entrees.length > ENTREES_PAR_MESSAGE_MAX)
    return null;
  const entrees: Entree[] = [];
  for (const e of m.entrees as unknown[]) {
    if (typeof e !== "object" || e === null) return null;
    const { seq, ax, az } = e as Record<string, unknown>;
    if (
      !estEntier(seq, 1, 0xffffffff) ||
      !estEntier(ax, -AXE_MAX, AXE_MAX) ||
      !estEntier(az, -AXE_MAX, AXE_MAX)
    ) {
      return null;
    }
    entrees.push({ seq, ax, az });
  }
  return { t: "entrees", entrees };
}
