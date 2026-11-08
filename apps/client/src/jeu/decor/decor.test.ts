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
};
const materiaux = Object.fromEntries(
  Object.keys(TUILES).map((k) => [k, new THREE.MeshBasicMaterial()]),
) as Record<CleQuartier, THREE.Material>;
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

  it("l'habit reste collé au rectangle de collision (débords de toit et appuis ≤ 0,5 m)", () => {
    const boite = new THREE.Box3();
    for (const m of ilot(3)) boite.expandByObject(m);
    expect(boite.min.x).toBeGreaterThanOrEqual(rect.minX / 1000 - 0.5);
    expect(boite.max.x).toBeLessThanOrEqual(rect.maxX / 1000 + 0.5);
    expect(boite.min.z).toBeGreaterThanOrEqual(rect.minZ / 1000 - 0.5);
    expect(boite.max.z).toBeLessThanOrEqual(rect.maxZ / 1000 + 0.5);
    expect(boite.max.y).toBeLessThanOrEqual(10.01);
  });

  it("un îlot peu profond (maisons de liaison étroites) se construit sans erreur", () => {
    const lots = new Lots<CleQuartier>(TUILES);
    construireIlot(lots, { minX: 0, minZ: 0, maxX: 22000, maxZ: 10000 }, 9, 1);
    expect(lots.fusionner(materiaux, false).length).toBeGreaterThan(3);
  });
});
