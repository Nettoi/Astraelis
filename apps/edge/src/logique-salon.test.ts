import { describe, expect, it } from "vitest";
import { admettre, aLArrivee, auDepart, relayer, type Participant } from "./logique-salon";

const hote: Participant = { id: "h", role: "hote" };
const a: Participant = { id: "a", role: "invite" };
const b: Participant = { id: "b", role: "invite" };
const c: Participant = { id: "c", role: "invite" };

describe("admettre", () => {
  it("un seul hôte, pas d'invité sans hôte, quatre joueurs au plus", () => {
    expect(admettre([], "hote")).toEqual({ ok: true });
    expect(admettre([hote], "hote")).toEqual({ ok: false, raison: "hote-deja-present" });
    expect(admettre([], "invite")).toEqual({ ok: false, raison: "pas-d-hote" });
    expect(admettre([hote, a, b], "invite")).toEqual({ ok: true });
    expect(admettre([hote, a, b, c], "invite")).toEqual({ ok: false, raison: "salon-complet" });
  });
});

describe("aLArrivee / auDepart", () => {
  it("accueille l'invité et prévient l'hôte", () => {
    expect(aLArrivee([hote], a)).toEqual([
      { a: "a", message: { t: "accueil", id: "a", role: "invite", hote: "h" } },
      { a: "h", message: { t: "arrivee", id: "a" } },
    ]);
  });
  it("l'hôte se connaît lui-même comme hôte", () => {
    expect(aLArrivee([], hote)[0]?.message).toEqual({ t: "accueil", id: "h", role: "hote", hote: "h" });
  });
  it("prévient tous les restants d'un départ", () => {
    expect(auDepart([a, b], hote).map((e) => e.a)).toEqual(["a", "b"]);
  });
});

describe("relayer", () => {
  const tous = [hote, a, b];
  const signal = (dest: string) => JSON.stringify({ t: "signal", a: dest, donnees: { sdp: "x" } });

  it("relaie de l'invité vers l'hôte et de l'hôte vers l'invité", () => {
    expect(relayer(tous, a, signal("h"))).toEqual([
      { a: "h", message: { t: "signal", de: "a", donnees: { sdp: "x" } } },
    ]);
    expect(relayer(tous, hote, signal("b"))[0]?.a).toBe("b");
  });

  it.each([
    ["invité vers invité", a, signal("b")],
    ["vers soi-même", hote, signal("h")],
    ["destinataire inconnu", hote, signal("zz")],
    ["JSON invalide", a, "{"],
    ["mauvais type", a, JSON.stringify({ t: "autre", a: "h" })],
    ["trop gros", a, JSON.stringify({ t: "signal", a: "h", donnees: "x".repeat(20_000) })],
  ])("refuse : %s", (_cas, de, brut) => {
    expect(relayer(tous, de, brut)).toEqual([
      { a: de.id, message: { t: "erreur", raison: "message-invalide" } },
    ]);
  });
});
