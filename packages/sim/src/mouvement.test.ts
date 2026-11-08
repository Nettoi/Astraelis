import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  AXE_MAX,
  appliquerEntree,
  bornerAxe,
  deplacementVoulu,
  positionValide,
  racineEntiere,
  RAYON_JOUEUR_MM,
  VITESSE_MM_PAR_TICK,
  type CarteCollision,
  type Entree,
  type EtatJoueur,
} from "./index";

const carte: CarteCollision = {
  limites: { minX: -20_000, minZ: -20_000, maxX: 20_000, maxZ: 20_000 },
  obstacles: [
    { minX: 2_000, minZ: -1_000, maxX: 4_000, maxZ: 1_000 },
    { minX: -6_000, minZ: 5_000, maxX: -3_000, maxZ: 5_300 },
  ],
};

const entree = (ax: number, az: number, seq = 1): Entree => ({ seq, ax, az });

const arbEntree = fc.record({
  seq: fc.nat(),
  ax: fc.integer({ min: -400, max: 400 }),
  az: fc.integer({ min: -400, max: 400 }),
});

describe("bornerAxe", () => {
  it("borne, tronque et neutralise les valeurs invalides", () => {
    expect(bornerAxe(500)).toBe(AXE_MAX);
    expect(bornerAxe(-500)).toBe(-AXE_MAX);
    expect(bornerAxe(12.9)).toBe(12);
    expect(bornerAxe(Number.NaN)).toBe(0);
    expect(bornerAxe(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("racineEntiere", () => {
  it("est le plancher exact de la racine", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 40 }), (n) => {
        const r = racineEntiere(n);
        return r * r <= n && (r + 1) * (r + 1) > n;
      }),
    );
  });
});

describe("deplacementVoulu", () => {
  it("avance à pleine vitesse sur un axe", () => {
    expect(deplacementVoulu(entree(AXE_MAX, 0))).toEqual({ dx: VITESSE_MM_PAR_TICK, dz: 0 });
  });

  it("ne va jamais plus vite en diagonale", () => {
    fc.assert(
      fc.property(arbEntree, (e) => {
        const { dx, dz } = deplacementVoulu(e);
        return dx * dx + dz * dz <= VITESSE_MM_PAR_TICK * VITESSE_MM_PAR_TICK;
      }),
    );
  });
});

describe("appliquerEntree", () => {
  it("s'arrête contre un obstacle", () => {
    let etat: EtatJoueur = { x: 0, z: 0 };
    for (let i = 0; i < 40; i++) etat = appliquerEntree(etat, entree(AXE_MAX, 0), carte);
    expect(etat).toEqual({ x: 2_000 - RAYON_JOUEUR_MM, z: 0 });
  });

  it("glisse le long d'un obstacle en diagonale", () => {
    let etat: EtatJoueur = { x: 2_000 - RAYON_JOUEUR_MM, z: 0 };
    etat = appliquerEntree(etat, entree(AXE_MAX, AXE_MAX), carte);
    expect(etat.x).toBe(2_000 - RAYON_JOUEUR_MM);
    expect(etat.z).toBeGreaterThan(0);
  });

  it("ne traverse pas un mur mince", () => {
    let etat: EtatJoueur = { x: -4_500, z: 4_000 };
    for (let i = 0; i < 40; i++) etat = appliquerEntree(etat, entree(0, AXE_MAX), carte);
    expect(etat.z).toBe(5_000 - RAYON_JOUEUR_MM);
  });

  it("reste dans les limites de la carte", () => {
    let etat: EtatJoueur = { x: 0, z: 0 };
    for (let i = 0; i < 200; i++) etat = appliquerEntree(etat, entree(-AXE_MAX, 0), carte);
    expect(etat.x).toBe(-20_000 + RAYON_JOUEUR_MM);
  });
});

describe("fuzz : invariants et déterminisme", () => {
  it("une position valide reste valide, en entiers, quelle que soit la suite d'entrées", () => {
    fc.assert(
      fc.property(fc.array(arbEntree, { maxLength: 300 }), (entrees) => {
        let etat: EtatJoueur = { x: 0, z: 0 };
        for (const e of entrees) {
          etat = appliquerEntree(etat, e, carte);
          if (!positionValide(etat, carte)) return false;
          if (!Number.isInteger(etat.x) || !Number.isInteger(etat.z)) return false;
        }
        return true;
      }),
      { numRuns: 300 },
    );
  });

  it("rejouer la même suite donne exactement le même état", () => {
    fc.assert(
      fc.property(fc.array(arbEntree, { maxLength: 300 }), (entrees) => {
        const jouer = () =>
          entrees.reduce<EtatJoueur>((s, e) => appliquerEntree(s, e, carte), { x: 0, z: 0 });
        expect(jouer()).toEqual(jouer());
      }),
    );
  });

  it("empreinte de référence stable (détecte toute dérive de la simulation)", () => {
    let etat: EtatJoueur = { x: 0, z: 0 };
    let empreinte = 0;
    for (let i = 0; i < 2_000; i++) {
      const ax = ((i * 37) % 255) - 127;
      const az = ((i * 91) % 255) - 127;
      etat = appliquerEntree(etat, entree(ax, az, i), carte);
      empreinte = (Math.imul(empreinte, 31) + etat.x * 7 + etat.z) | 0;
    }
    expect({ etat, empreinte }).toMatchSnapshot();
  });
});
