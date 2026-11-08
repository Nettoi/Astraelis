import { describe, expect, it } from "vitest";
import { canalDouble } from "./rtc";

function fauxCanal() {
  const ecouteurs: Record<string, ((e: { data: unknown }) => void)[]> = { message: [], close: [] };
  const envoyes: string[] = [];
  return {
    envoyes,
    readyState: "open",
    send: (d: string) => void envoyes.push(d),
    close() {
      this.readyState = "closed";
      for (const f of ecouteurs.close!) f({ data: null });
    },
    addEventListener: (t: "message" | "close", f: (e: { data: unknown }) => void) =>
      void ecouteurs[t]!.push(f),
    recevoir: (data: unknown) => {
      for (const f of ecouteurs.message!) f({ data });
    },
  };
}

describe("canalDouble", () => {
  it("envoie l'état et les entrées sur le canal rapide, le reste sur le canal fiable", () => {
    const fiable = fauxCanal();
    const rapide = fauxCanal();
    const c = canalDouble<{ t: string }, unknown>(fiable, rapide);
    c.envoyer({ t: "bonjour" });
    c.envoyer({ t: "entrees" });
    c.envoyer({ t: "etat" });
    expect(fiable.envoyes.map((m) => JSON.parse(m).t)).toEqual(["bonjour"]);
    expect(rapide.envoyes.map((m) => JSON.parse(m).t)).toEqual(["entrees", "etat"]);
  });

  it("reçoit des deux canaux et ignore l'illisible ou le trop gros", () => {
    const fiable = fauxCanal();
    const rapide = fauxCanal();
    const recus: unknown[] = [];
    canalDouble<{ t: string }, unknown>(fiable, rapide).surMessage((m) => recus.push(m));
    fiable.recevoir('{"t":"bienvenue"}');
    rapide.recevoir('{"t":"etat"}');
    rapide.recevoir("{pas du json");
    rapide.recevoir(new ArrayBuffer(4));
    rapide.recevoir(JSON.stringify({ t: "x".repeat(70_000) }));
    expect(recus).toEqual([{ t: "bienvenue" }, { t: "etat" }]);
  });

  it("signale la fermeture une seule fois et n'envoie plus rien", () => {
    const fiable = fauxCanal();
    const rapide = fauxCanal();
    const c = canalDouble<{ t: string }, unknown>(fiable, rapide);
    let fermetures = 0;
    c.surFermeture(() => fermetures++);
    rapide.close();
    fiable.close();
    c.envoyer({ t: "etat" });
    expect(fermetures).toBe(1);
    expect(rapide.envoyes).toEqual([]);
  });
});
