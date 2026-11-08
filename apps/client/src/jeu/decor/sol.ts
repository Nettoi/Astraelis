import type { Zone } from "@astraelis/content";
import * as THREE from "three";
import { boite, type Lots } from "./geometrie";
import type { CleQuartier } from "./facades";
import { injecterMonde } from "./shaders";

const MM = 0.001;

/**
 * Flaques : un masque de bruit en coordonnées monde rend le pavé lisse, sombre et
 * réfléchissant par endroits (reflets des lanternes et de la lune). Aucune texture de plus.
 */
export function ajouterFlaques(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (s) => {
    injecterMonde(s);
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
float flaque = smoothstep(0.66, 0.7, bRetouche(vMonde.xz * 0.22) * 0.75 + bRetouche(vMonde.xz * 1.1) * 0.25);
// Variation de teinte à grande échelle : la répétition du pavé ne se voit plus.
diffuseColor.rgb *= (0.75 + 0.5 * bRetouche(vMonde.xz * 0.06)) * mix(1.0, 0.6, flaque);`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor * 0.85, 0.02, flaque);",
      )
      .replace(
        "#include <normal_fragment_maps>",
        "#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, flaque));",
      );
  };
}

/** Sol pavé de la terre ferme (la mer commence là où la carte place l'eau). */
export function construireSol(zone: Zone): THREE.BufferGeometry {
  const { limites } = zone;
  const eau = zone.elements.find((e) => e.type === "eau");
  const zMax = (eau ? eau.rect.minZ : limites.maxZ) * MM;
  const g = new THREE.PlaneGeometry((limites.maxX - limites.minX) * MM, zMax - limites.minZ * MM);
  g.rotateX(-Math.PI / 2);
  g.translate(((limites.minX + limites.maxX) / 2) * MM, 0, (limites.minZ * MM + zMax) / 2);
  return g;
}

/** Repères de Sarn : phare (bâtiment très haut), rempart, ponton (mur bas franchissable). */
export function construireReperes(lots: Lots<CleQuartier>, zone: Zone): THREE.Object3D[] {
  const extras: THREE.Object3D[] = [];
  const id = new THREE.Matrix4();
  for (const e of zone.elements) {
    const [x0, x1, z0, z1, h] = [
      e.rect.minX * MM,
      e.rect.maxX * MM,
      e.rect.minZ * MM,
      e.rect.maxZ * MM,
      e.hauteur * MM,
    ];
    if (e.type === "batiment" && h > 20) {
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      const r = Math.min(x1 - x0, z1 - z0) / 2;
      const tour = new THREE.CylinderGeometry(r * 0.78, r, h - 4, 12, 1);
      lots.ajouter("pierre", tour.translate(cx, (h - 4) / 2, cz));
      lots.ajouter(
        "vitreAllumee",
        new THREE.CylinderGeometry(r * 0.6, r * 0.6, 2.4, 12).translate(cx, h - 2.8, cz),
      );
      lots.ajouter("bois", new THREE.ConeGeometry(r * 0.9, 2.2, 12).translate(cx, h - 0.5, cz));
      const feu = new THREE.PointLight("#ffd9a0", 400, 70, 2);
      feu.position.set(cx, h - 2.8, cz);
      extras.push(feu);
    } else if (e.type === "mur" && e.bloquant) {
      lots.ajouter("pierre", boite(id, x0, x1, 0, h, z0, z1));
      // Créneaux tous les 2 m.
      for (let x = x0 + 0.5; x + 1 <= x1; x += 2)
        lots.ajouter("pierre", boite(id, x, x + 1, h, h + 0.9, z0, z1));
    } else if (e.type === "mur") {
      lots.ajouter("bois", boite(id, x0, x1, h - 0.25, h, z0, z1));
      for (let z = z0 + 1; z < z1; z += 3)
        for (const x of [x0 + 0.2, x1 - 0.2])
          lots.ajouter("bois", boite(id, x - 0.15, x + 0.15, -1.5, h, z - 0.15, z + 0.15));
    }
  }
  return extras;
}
