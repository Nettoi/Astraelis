import { describe, expect, it } from "vitest";
import { nettoyerNom } from "./nom";

describe("nettoyerNom", () => {
  it("garde les accents et les apostrophes", () => {
    expect(nettoyerNom("  Élia   d'Orme ", "x")).toBe("Élia d'Orme");
  });
  it("retire le balisage et les symboles", () => {
    expect(nettoyerNom("<b>Corvin</b>!", "x")).toBe("bCorvinb");
  });
  it("tronque à 20 caractères", () => {
    expect(nettoyerNom("A".repeat(50), "x")).toHaveLength(20);
  });
  it("utilise le repli si vide ou invalide", () => {
    expect(nettoyerNom("", "Veilleur 1")).toBe("Veilleur 1");
    expect(nettoyerNom(42, "Veilleur 1")).toBe("Veilleur 1");
    expect(nettoyerNom("🙂", "Veilleur 1")).toBe("Veilleur 1");
  });
});
