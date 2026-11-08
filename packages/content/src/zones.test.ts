import { positionValide } from "@astraelis/sim";
import { describe, expect, it } from "vitest";
import { chargerZone, IDS_ZONES, SchemaZone, versCarteCollision } from "./index";

describe.each(IDS_ZONES)("zone %s", (id) => {
  const zone = chargerZone(id);
  const carte = versCarteCollision(zone);

  it("chaque point d'apparition est une position valide", () => {
    for (const a of zone.apparitions) expect(positionValide(a, carte), JSON.stringify(a)).toBe(true);
  });

  it("chaque élément est dans les limites de la zone", () => {
    for (const e of zone.elements) {
      expect(e.rect.minX).toBeGreaterThanOrEqual(zone.limites.minX);
      expect(e.rect.maxX).toBeLessThanOrEqual(zone.limites.maxX);
      expect(e.rect.minZ).toBeGreaterThanOrEqual(zone.limites.minZ);
      expect(e.rect.maxZ).toBeLessThanOrEqual(zone.limites.maxZ);
    }
  });

  it("a un nom en français et en anglais", () => {
    expect(zone.nom.fr).not.toBe("");
    expect(zone.nom.en).not.toBe("");
  });
});

describe("validation", () => {
  it("refuse un rectangle inversé avec un message utile", () => {
    const r = SchemaZone.safeParse({
      ...chargerZone("sarn"),
      limites: { minX: 5, minZ: 0, maxX: 1, maxZ: 10 },
    });
    expect(r.success).toBe(false);
  });

  it("refuse une zone inconnue", () => {
    expect(() => chargerZone("atlantide")).toThrow(/zone inconnue/);
  });
});
