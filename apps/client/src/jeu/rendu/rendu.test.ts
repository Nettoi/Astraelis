import { describe, expect, it } from "vitest";
import { ambianceDe } from "./ambiances";
import { etalonner, genererLut, NEUTRE } from "./lut";
import { detecterPalier, lirePalier, REGLAGES } from "./qualite";

describe("detecterPalier", () => {
  it("rendu logiciel ou peu de mémoire → léger", () => {
    expect(detecterPalier({ gpu: "ANGLE (Google, SwiftShader)", petitCote: 1080, tactile: false })).toBe(
      "leger",
    );
    expect(detecterPalier({ gpu: "Apple GPU", petitCote: 390, tactile: true, memoireGo: 2 })).toBe("leger");
  });
  it("carte graphique dédiée → cinéma ; intégrée ancienne → équilibré", () => {
    expect(detecterPalier({ gpu: "ANGLE (AMD Radeon Pro 5300)", petitCote: 1080, tactile: false })).toBe(
      "cinema",
    );
    expect(
      detecterPalier({ gpu: "ANGLE (Intel, Intel(R) UHD Graphics 620)", petitCote: 900, tactile: false }),
    ).toBe("equilibre");
  });
  it("téléphone récent → équilibré ; ancien → léger", () => {
    expect(detecterPalier({ gpu: "Adreno (TM) 730", petitCote: 412, tactile: true })).toBe("equilibre");
    expect(detecterPalier({ gpu: "Mali-G52", petitCote: 360, tactile: true })).toBe("leger");
  });
  it("le palier léger coupe post-traitement et ombres", () => {
    expect(REGLAGES.leger.postTraitement).toBe(false);
    expect(REGLAGES.leger.ombres).toBe(false);
    expect(REGLAGES.equilibre.ao).toBe(false);
  });
  it("lit un choix explicite, ignore le reste", () => {
    expect(lirePalier("cinema")).toBe("cinema");
    expect(lirePalier("ultra")).toBeUndefined();
    expect(lirePalier(null)).toBeUndefined();
  });
});

describe("LUT d'étalonnage", () => {
  it("l'étalonnage neutre est l'identité", () => {
    const lut = genererLut(NEUTRE, 4);
    expect(lut.length).toBe(4 ** 3 * 4);
    // Texel (r=1, g=2, b=3) → indice ((3·4 + 2)·4 + 1)
    const i = ((3 * 4 + 2) * 4 + 1) * 4;
    expect([lut[i], lut[i + 1], lut[i + 2]]).toEqual([85, 170, 255]);
  });
  it("Sarn : ombres plus bleues, hautes lumières plus chaudes, valeurs bornées", () => {
    const { etalonnage } = ambianceDe("sarn");
    const [r1, , b1] = etalonner(etalonnage, 0.15, 0.15, 0.15);
    expect(b1).toBeGreaterThan(r1);
    const [r2, , b2] = etalonner(etalonnage, 0.85, 0.85, 0.85);
    expect(r2).toBeGreaterThan(b2);
    for (const v of genererLut(etalonnage, 8)) expect(v).toBeLessThanOrEqual(255);
  });
});
