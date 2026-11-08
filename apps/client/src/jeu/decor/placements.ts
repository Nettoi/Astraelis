import type { Zone } from "@astraelis/content";
import { creerAleatoire } from "@astraelis/sim";

const MM = 0.001;

export type Accessoire = "tonneau" | "caisse" | "plante";

export interface Placement {
  type: Accessoire;
  x: number;
  z: number;
  /** Rotation autour de la verticale, en radians. */
  angle: number;
}

/** Distance du centre d'un accessoire au mur (m) : collé à la façade, dans la marge du joueur. */
export const RETRAIT_FACADE = 0.45;
/** Seules les façades proches de la place sont garnies (budget de triangles). */
const RAYON_PLACE = 34;

/**
 * Pose tonneaux, caisses et plantes en petits groupes le long des façades qui donnent sur
 * la place. Déterministe (graine fixe) ; ne touche pas aux données de collision.
 */
export function placerAccessoires(zone: Zone, graine = 0x51a7): Placement[] {
  const a = creerAleatoire(graine);
  const u = () => a.suivant() / 2 ** 32;
  const sorties: Placement[] = [];
  const ilots = zone.elements.filter((e) => e.type === "batiment" && e.hauteur < 20_000);
  for (const e of ilots) {
    const [x0, x1, z0, z1] = [e.rect.minX * MM, e.rect.maxX * MM, e.rect.minZ * MM, e.rect.maxZ * MM];
    const cotes = [
      { ax: x0, az: z1, bx: x1, bz: z1, nx: 0, nz: 1 },
      { ax: x0, az: z0, bx: x1, bz: z0, nx: 0, nz: -1 },
      { ax: x1, az: z0, bx: x1, bz: z1, nx: 1, nz: 0 },
      { ax: x0, az: z0, bx: x0, bz: z1, nx: -1, nz: 0 },
    ];
    for (const c of cotes) {
      const longueur = Math.hypot(c.bx - c.ax, c.bz - c.az);
      for (let d = 2.5; d < longueur - 2.5; d += 4 + u() * 5) {
        const t = d / longueur;
        const x = c.ax + (c.bx - c.ax) * t + c.nx * RETRAIT_FACADE;
        const z = c.az + (c.bz - c.az) * t + c.nz * RETRAIT_FACADE;
        if (Math.hypot(x, z) > RAYON_PLACE || u() < 0.35) continue;
        const tirage = u();
        const type: Accessoire = tirage < 0.4 ? "tonneau" : tirage < 0.7 ? "caisse" : "plante";
        sorties.push({ type, x, z, angle: u() * Math.PI * 2 });
        // Un voisin de temps en temps : les objets vont par deux ou trois.
        if (u() < 0.5) {
          const dx = (c.bx - c.ax) / longueur;
          const dz = (c.bz - c.az) / longueur;
          const voisin: Accessoire = type === "plante" ? "plante" : u() < 0.5 ? "tonneau" : "caisse";
          sorties.push({ type: voisin, x: x + dx * 0.9, z: z + dz * 0.9, angle: u() * Math.PI * 2 });
        }
      }
    }
  }
  return sorties;
}

/** Positions des lampadaires (m), dans l'ordre de la carte. */
export function lampadaires(zone: Zone): { x: number; z: number; h: number }[] {
  return zone.elements
    .filter((e) => e.type === "lampadaire")
    .map((e) => ({
      x: ((e.rect.minX + e.rect.maxX) / 2) * MM,
      z: ((e.rect.minZ + e.rect.maxZ) / 2) * MM,
      h: e.hauteur * MM,
    }));
}

/**
 * Guirlandes de fanions de la fête des Lampes : d'un lampadaire de la place au suivant,
 * en faisant le tour (les lampadaires du port restent nus).
 */
export function guirlandes(zone: Zone): { de: [number, number, number]; a: [number, number, number] }[] {
  const place = lampadaires(zone).filter((l) => Math.hypot(l.x, l.z) < 20);
  const tries = place.sort((p, q) => Math.atan2(p.z, p.x) - Math.atan2(q.z, q.x));
  return tries.map((l, i) => {
    const s = tries[(i + 1) % tries.length]!;
    return { de: [l.x, l.h - 0.2, l.z], a: [s.x, s.h - 0.2, s.z] };
  });
}
