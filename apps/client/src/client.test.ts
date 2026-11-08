import { describe, expect, it } from "vitest";
import { parametresAstraelis } from "./jeu/ciel";
import { lireAxes } from "./jeu/entrees";
import { detecterLangue, TEXTES } from "./i18n";

const repos = { haut: false, bas: false, gauche: false, droite: false, tactileX: 0, tactileZ: 0 };

describe("lireAxes", () => {
  it("convertit le clavier en axes entiers (nord = z négatif)", () => {
    expect(lireAxes({ ...repos, haut: true, droite: true })).toEqual({ ax: 127, az: -127 });
    expect(lireAxes({ ...repos, haut: true, bas: true })).toEqual({ ax: 0, az: 0 });
  });
  it("la manette tactile l'emporte et reste dans les bornes", () => {
    expect(lireAxes({ ...repos, gauche: true, tactileX: 0.5, tactileZ: -1 })).toEqual({ ax: 64, az: -127 });
  });
});

describe("parametresAstraelis", () => {
  it("la lune grossit et rougit à mesure que l'histoire avance", () => {
    const debut = parametresAstraelis(0);
    const fin = parametresAstraelis(1);
    expect(fin.rayon).toBeGreaterThan(debut.rayon * 2);
    expect(fin.couleur[2]).toBeLessThan(debut.couleur[2]);
    expect(parametresAstraelis(5)).toEqual(fin);
  });
});

describe("i18n", () => {
  it("détecte la langue, français par défaut", () => {
    expect(detecterLangue(["en-CA", "fr"])).toBe("en");
    expect(detecterLangue(["fr-CA"])).toBe("fr");
    expect(detecterLangue(["de-DE"])).toBe("fr");
  });
  it("le français et l'anglais ont les mêmes clés", () => {
    expect(Object.keys(TEXTES.en).sort()).toEqual(Object.keys(TEXTES.fr).sort());
  });
});
