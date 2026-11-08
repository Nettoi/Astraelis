import { ENTREES_EN_ATTENTE_MAX, ENTREES_PAR_TICK_MAX } from "./constantes";
import { describe, expect, it } from "vitest";
import { FileEntrees } from "./entrees";

const e = (seq: number) => ({ seq, ax: 127, az: 0 });

describe("FileEntrees", () => {
  it("ignore les doublons et les séquences anciennes", () => {
    const f = new FileEntrees();
    f.recevoir([e(1), e(2)]);
    f.recevoir([e(2), e(1), e(3)]);
    expect(f.taille).toBe(3);
  });

  it(`consomme au plus ${ENTREES_PAR_TICK_MAX} entrées par tick`, () => {
    const f = new FileEntrees();
    f.recevoir([e(1), e(2), e(3), e(4), e(5)]);
    expect(f.consommer().map((x) => x.seq)).toEqual([1, 2]);
    expect(f.derniereTraitee).toBe(2);
  });

  it("plafonne la file en jetant les plus anciennes", () => {
    const f = new FileEntrees();
    f.recevoir(Array.from({ length: ENTREES_EN_ATTENTE_MAX + 10 }, (_, i) => e(i + 1)));
    expect(f.taille).toBe(ENTREES_EN_ATTENTE_MAX);
    expect(f.consommer()[0]?.seq).toBe(11);
  });

  it("garde la dernière séquence traitée quand la file est vide", () => {
    const f = new FileEntrees();
    f.recevoir([e(7)]);
    f.consommer();
    expect(f.consommer()).toEqual([]);
    expect(f.derniereTraitee).toBe(7);
  });
});
