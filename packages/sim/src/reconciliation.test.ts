import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { appliquerEntree, reconcilier, type CarteCollision, type Entree, type EtatJoueur } from "./index";

const carte: CarteCollision = {
  limites: { minX: -10_000, minZ: -10_000, maxX: 10_000, maxZ: 10_000 },
  obstacles: [{ minX: 1_000, minZ: 1_000, maxX: 3_000, maxZ: 3_000 }],
};

describe("reconcilier", () => {
  it("retombe exactement sur la prédiction quand le serveur est d'accord", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ ax: fc.integer({ min: -127, max: 127 }), az: fc.integer({ min: -127, max: 127 }) }),
          {
            minLength: 1,
            maxLength: 60,
          },
        ),
        fc.nat(),
        (axes, coupure) => {
          const entrees: Entree[] = axes.map((a, i) => ({ seq: i + 1, ...a }));
          const ack = coupure % (entrees.length + 1);
          const depart: EtatJoueur = { x: 0, z: 0 };
          const predit = entrees.reduce((s, e) => appliquerEntree(s, e, carte), depart);
          const serveur = entrees.slice(0, ack).reduce((s, e) => appliquerEntree(s, e, carte), depart);
          const { etat, restantes } = reconcilier(serveur, ack, entrees, carte);
          expect(etat).toEqual(predit);
          expect(restantes.map((e) => e.seq)).toEqual(entrees.slice(ack).map((e) => e.seq));
        },
      ),
    );
  });

  it("corrige la position si le serveur a tranché autrement", () => {
    const entrees: Entree[] = [{ seq: 5, ax: 127, az: 0 }];
    const { etat } = reconcilier({ x: -5_000, z: 0 }, 4, entrees, carte);
    expect(etat).toEqual({ x: -4_775, z: 0 });
  });
});
