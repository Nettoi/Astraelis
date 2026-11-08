import { describe, expect, it } from "vitest";
import { ALPHABET_CODE, genererCode, normaliserCode } from "./code-salon";

describe("codes de salon", () => {
  it("génère six lettres de l'alphabet sans I ni O", () => {
    for (let i = 0; i < 500; i++) expect(genererCode()).toMatch(/^[A-HJ-NP-Z]{6}$/);
  });

  it("rejette les octets qui biaiseraient la distribution", () => {
    const suites = [new Uint8Array([255, 250, 240, 0, 1, 2, 3, 4, 5, 6, 7, 8])];
    expect(genererCode(() => suites.shift() ?? new Uint8Array(12))).toBe(ALPHABET_CODE.slice(0, 6));
  });

  it("normalise la saisie et refuse les codes invalides", () => {
    expect(normaliserCode(" abc-def ")).toBe("ABCDEF");
    expect(normaliserCode("ABCDEO")).toBeNull();
    expect(normaliserCode("ABCDE")).toBeNull();
  });
});
