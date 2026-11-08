import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { construireIlot, type CleQuartier } from "./facades";
import { Lots, uvMonde } from "./geometrie";

const TUILES: Record<CleQuartier, number> = {
  facade: 3,
  pierre: 2.5,
  tuiles: 2,
  bois: 1.5,
  vitreAllumee: 1,
  vitreSombre: 1,
  fer: 1,
  toile: 1,
};
const basique = () => new THREE.MeshBasicMaterial();
const materiaux: Record<CleQuartier, THREE.Material> = {
  facade: basique(),
  pierre: basique(),
  tuiles: basique(),
  bois: basique(),
  vitreAllumee: basique(),
  vitreSombre: basique(),
  fer: basique(),
  toile: basique(),
};
const rect = { minX: -18000, minZ: -40000, maxX: -4000, maxZ: -18000 };

function ilot(graine: number) {
  const lots = new Lots<CleQuartier>(TUILES);
  construireIlot(lots, rect, 10, graine);
  return lots.fusionner(materiaux, false);
}

describe("décor de Sarn", () => {
  it("les UV sont en mètres : une texture de 3 m se répète une fois sur 3 m", () => {
    const g = uvMonde(new THREE.BoxGeometry(3, 3, 3), 3);
    const uv = g.getAttribute("uv");
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(1);
  });

  it("un îlot est déterministe : même graine, même géométrie", () => {
    const sommets = (ms: THREE.Mesh[]) => ms.map((m) => m.geometry.getAttribute("position").count);
    expect(sommets(ilot(7))).toEqual(sommets(ilot(7)));
    expect(sommets(ilot(7))).not.toEqual(sommets(ilot(8)));
  });

  it("à hauteur d'homme, l'habit reste collé à la collision ; auvents et balcons passent au-dessus", () => {
    const [x0, x1, z0, z1] = [rect.minX / 1000, rect.maxX / 1000, rect.minZ / 1000, rect.maxZ / 1000];
    const depasse = (x: number, z: number) => Math.max(x0 - x, x - x1, z0 - z, z - z1, 0);
    let hautMax = 0;
    for (const m of ilot(3)) {
      const p = m.geometry.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
        hautMax = Math.max(hautMax, y);
        expect(depasse(x, z)).toBeLessThanOrEqual(y < 2.2 ? 0.5 : 1.2);
      }
    }
    expect(hautMax).toBeLessThanOrEqual(10 + 1.2); // faîte ≤ hauteur de carte, cheminées comprises
  });

  it("un îlot peu profond (maisons de liaison étroites) se construit sans erreur", () => {
    const lots = new Lots<CleQuartier>(TUILES);
    construireIlot(lots, { minX: 0, minZ: 0, maxX: 22000, maxZ: 10000 }, 9, 1);
    expect(lots.fusionner(materiaux, false).length).toBeGreaterThan(3);
  });
});
