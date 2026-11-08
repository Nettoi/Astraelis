import { chargerZone } from "@astraelis/content";
import { describe, expect, it } from "vitest";
import { guirlandes, lampadaires, placerAccessoires, RETRAIT_FACADE } from "./placements";

const sarn = chargerZone("sarn");

describe("placements du décor de Sarn", () => {
  it("sont déterministes", () => {
    expect(placerAccessoires(sarn)).toEqual(placerAccessoires(sarn));
    expect(placerAccessoires(sarn).length).toBeGreaterThan(10);
  });

  it("collent les accessoires aux façades, jamais au milieu de la place", () => {
    const blocs = sarn.elements.filter((e) => e.bloquant && e.type === "batiment");
    for (const p of placerAccessoires(sarn)) {
      const distance = Math.min(
        ...blocs.map((b) => {
          const dx = Math.max(b.rect.minX / 1000 - p.x, 0, p.x - b.rect.maxX / 1000);
          const dz = Math.max(b.rect.minZ / 1000 - p.z, 0, p.z - b.rect.maxZ / 1000);
          return Math.hypot(dx, dz);
        }),
      );
      expect(distance).toBeLessThanOrEqual(RETRAIT_FACADE + 1e-9);
    }
  });

  it("relient les lampadaires de la place en boucle", () => {
    const g = guirlandes(sarn);
    expect(g.length).toBe(8);
    expect(g.length).toBeLessThan(lampadaires(sarn).length);
  });
});
