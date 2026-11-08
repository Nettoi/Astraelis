import { VITESSE_MM_PAR_TICK, type CarteCollision } from "@astraelis/sim";
import { describe, expect, it } from "vitest";
import {
  creerPaireMemoire,
  Hote,
  ID_HOTE,
  Invite,
  JOUEURS_MAX,
  lireMessageInvite,
  RETARD_INTERPOLATION_MS,
  type MessageHote,
  type MessageInvite,
  type ZoneJouable,
} from "./index";

const carte: CarteCollision = {
  limites: { minX: -20_000, minZ: -20_000, maxX: 20_000, maxZ: 20_000 },
  obstacles: [
    { minX: 3_000, minZ: -1_000, maxX: 4_000, maxZ: 1_000 },
    { minX: 6_000, minZ: 4_000, maxX: 7_000, maxZ: 6_000 },
  ],
};
const zone: ZoneJouable = {
  id: "test",
  carte,
  apparitions: [
    { x: 0, z: 0 },
    { x: 2_000, z: 5_000 },
    { x: -2_000, z: 0 },
    { x: 0, z: -2_000 },
  ],
};

function brancher(hote: Hote, nom: string, horloge?: () => number) {
  const [cHote, cInvite] = creerPaireMemoire<MessageHote, MessageInvite>();
  hote.accueillir(cHote);
  return { invite: new Invite(cInvite, carte, nom, horloge), canal: cInvite };
}

describe("Hote + Invite", () => {
  it("accueille trois invités, place chacun sur une apparition distincte, refuse le cinquième", () => {
    const hote = new Hote(zone, "Hôte");
    const invites = ["Élia", "Corvin", "Pip"].map((n) => brancher(hote, n).invite);
    expect(invites.map((i) => i.id)).toEqual(["1", "2", "3"]);
    expect(hote.nombreJoueurs).toBe(JOUEURS_MAX);
    const positions = hote.instantane().map((j) => `${j.x},${j.z}`);
    expect(new Set(positions).size).toBe(JOUEURS_MAX);

    const cinquieme = brancher(hote, "Zérah").invite;
    expect(cinquieme.refuse).toBe(true);
    expect(hote.nombreJoueurs).toBe(JOUEURS_MAX);
  });

  it("la prédiction de l'invité coïncide avec l'état de l'hôte", () => {
    const hote = new Hote(zone, "Hôte");
    const { invite } = brancher(hote, "Élia");
    hote.tick();
    for (let i = 0; i < 30; i++) {
      invite.entreeLocale(127, i % 2 === 0 ? 60 : -60);
      hote.tick();
    }
    const surHote = hote.instantane().find((j) => j.id === invite.id)!;
    expect(invite.position).toEqual({ x: surHote.x, z: surHote.z });
    expect(surHote.seq).toBe(30);
  });

  it("l'invité voit l'hôte bouger (interpolé avec retard)", () => {
    let maintenant = 0;
    const hote = new Hote(zone, "Hôte");
    const { invite } = brancher(hote, "Élia", () => maintenant);
    for (let i = 0; i < 10; i++) {
      hote.entreeLocale({ seq: i + 1, ax: -127, az: 0 });
      hote.tick();
      maintenant += 50;
    }
    maintenant -= 50;
    // Affiché RETARD_INTERPOLATION_MS dans le passé : deux ticks de retard.
    const vu = invite.autres().find((j) => j.id === ID_HOTE)!;
    expect(vu.nom).toBe("Hôte");
    expect(vu.x).toBe(-(10 - RETARD_INTERPOLATION_MS / 50) * VITESSE_MM_PAR_TICK);
    // À mi-chemin entre deux instantanés, la position est interpolée.
    maintenant += 25;
    expect(invite.autres().find((j) => j.id === ID_HOTE)!.x).toBe(-8.5 * VITESSE_MM_PAR_TICK);
  });

  it("se réconcilie si l'hôte a tranché autrement (obstacle inconnu de l'invité)", () => {
    const hote = new Hote(zone, "Hôte");
    const [cHote, cInvite] = creerPaireMemoire<MessageHote, MessageInvite>();
    hote.accueillir(cHote);
    const sansObstacle: CarteCollision = { ...carte, obstacles: [] };
    const invite = new Invite(cInvite, sansObstacle, "Élia");
    hote.tick();
    for (let i = 0; i < 20; i++) {
      invite.entreeLocale(127, 0);
      hote.tick();
    }
    expect(invite.position).toEqual({ x: 6_000 - 350, z: 5_000 });
  });

  it("un invité qui envoie trop d'entrées n'avance pas plus vite", () => {
    const hote = new Hote(zone, "Hôte");
    const { canal } = brancher(hote, "Tricheur");
    hote.tick();
    const depart = hote.instantane().find((j) => j.id === "1")!.x;
    canal.envoyer({
      t: "entrees",
      entrees: Array.from({ length: 10 }, (_, i) => ({ seq: i + 1, ax: -127, az: 0 })),
    });
    hote.tick();
    expect(hote.instantane().find((j) => j.id === "1")!.x).toBe(depart - 2 * VITESSE_MM_PAR_TICK);
  });

  it("retire un invité qui se déconnecte", () => {
    const hote = new Hote(zone, "Hôte");
    const { canal } = brancher(hote, "Élia");
    canal.fermer();
    expect(hote.instantane().map((j) => j.id)).toEqual([ID_HOTE]);
  });
});

describe("lireMessageInvite", () => {
  it("accepte un message valide", () => {
    expect(lireMessageInvite({ t: "entrees", entrees: [{ seq: 1, ax: 5, az: -5 }] })).not.toBeNull();
  });
  it.each([
    null,
    "texte",
    { t: "inconnu" },
    { t: "entrees", entrees: [{ seq: 0, ax: 0, az: 0 }] },
    { t: "entrees", entrees: [{ seq: 1, ax: 128, az: 0 }] },
    { t: "entrees", entrees: [{ seq: 1, ax: 1.5, az: 0 }] },
    { t: "entrees", entrees: Array.from({ length: 11 }, (_, i) => ({ seq: i + 1, ax: 0, az: 0 })) },
    { t: "bonjour", nom: 42 },
  ])("rejette %j", (brut) => {
    expect(lireMessageInvite(brut)).toBeNull();
  });
});
