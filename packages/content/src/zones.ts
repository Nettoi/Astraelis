import type { CarteCollision } from "@astraelis/sim";
import sarnBrut from "../data/zones/sarn.json";
import { SchemaZone, type Zone } from "./schemas";

const ZONES_BRUTES: Record<string, unknown> = { sarn: sarnBrut };

/** Charge et valide une zone ; lève une erreur lisible si le JSON est invalide. */
export function chargerZone(id: string): Zone {
  const brut = ZONES_BRUTES[id];
  if (brut === undefined) throw new Error(`zone inconnue : ${id}`);
  const resultat = SchemaZone.safeParse(brut);
  if (!resultat.success) {
    throw new Error(
      `zone « ${id} » invalide :\n${resultat.error.issues.map((i) => `- ${i.path.join(".")} : ${i.message}`).join("\n")}`,
    );
  }
  return resultat.data;
}

export const IDS_ZONES = Object.keys(ZONES_BRUTES);

/** Extrait la carte de collision utilisée par la simulation. */
export function versCarteCollision(zone: Zone): CarteCollision {
  return {
    limites: zone.limites,
    obstacles: zone.elements.filter((e) => e.bloquant).map((e) => e.rect),
  };
}
