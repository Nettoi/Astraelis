import { describe, expect, it } from "vitest";
import { creerAleatoire } from "./aleatoire";

describe("creerAleatoire", () => {
  it("produit la même suite pour la même graine", () => {
    const a = creerAleatoire(42);
    const b = creerAleatoire(42);
    for (let i = 0; i < 1_000; i++) expect(a.suivant()).toBe(b.suivant());
  });

  it("suite de référence figée", () => {
    const a = creerAleatoire(7);
    expect([a.suivant(), a.suivant(), a.suivant()]).toMatchSnapshot();
  });

  it("reprend la suite depuis un état sauvegardé", () => {
    const a = creerAleatoire(1);
    a.suivant();
    const b = creerAleatoire(a.etat());
    expect(b.suivant()).toBe(a.suivant());
  });

  it("entier reste dans l'intervalle et refuse un intervalle invalide", () => {
    const a = creerAleatoire(3);
    for (let i = 0; i < 1_000; i++) {
      const v = a.entier(-3, 3);
      expect(v).toBeGreaterThanOrEqual(-3);
      expect(v).toBeLessThanOrEqual(3);
    }
    expect(() => a.entier(2, 1)).toThrow(RangeError);
  });
});
