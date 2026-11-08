import { DurableObject } from "cloudflare:workers";
import { genererCode, normaliserCode, type Role } from "@astraelis/shared";
import { admettre, aLArrivee, auDepart, relayer, type Envoi, type Participant } from "./logique-salon";

export interface Env {
  SALONS: DurableObjectNamespace<Salon>;
}

const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS" };

/**
 * Un salon = un Durable Object nommé par son code. API d'hibernation WebSocket :
 * aucun coût de durée quand personne n'envoie de message.
 */
export class Salon extends DurableObject<Env> {
  private participants(): Participant[] {
    return this.ctx.getWebSockets().map((ws) => {
      const [id, role] = this.ctx.getTags(ws) as [string, Role];
      return { id, role };
    });
  }

  private envoyer(envois: Envoi[]): void {
    for (const { a, message } of envois) {
      for (const ws of this.ctx.getWebSockets(a)) ws.send(JSON.stringify(message));
    }
  }

  override async fetch(requete: Request): Promise<Response> {
    if (requete.headers.get("upgrade") !== "websocket")
      return new Response("WebSocket attendu", { status: 426 });
    const role: Role = new URL(requete.url).searchParams.get("role") === "hote" ? "hote" : "invite";
    const [client, serveur] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    const avant = this.participants();
    const admission = admettre(avant, role);
    if (!admission.ok) {
      serveur.accept();
      serveur.send(JSON.stringify({ t: "erreur", raison: admission.raison }));
      serveur.close(4000, admission.raison);
      return new Response(null, { status: 101, webSocket: client });
    }
    const nouveau: Participant = { id: crypto.randomUUID().slice(0, 8), role };
    this.ctx.acceptWebSocket(serveur, [nouveau.id, role]);
    this.envoyer(aLArrivee(avant, nouveau));
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, brut: string | ArrayBuffer): Promise<void> {
    const [id, role] = this.ctx.getTags(ws) as [string, Role];
    this.envoyer(relayer(this.participants(), { id, role }, typeof brut === "string" ? brut : ""));
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    const [id, role] = this.ctx.getTags(ws) as [string, Role];
    this.envoyer(
      auDepart(
        this.participants().filter((p) => p.id !== id),
        { id, role },
      ),
    );
  }
}

export default {
  async fetch(requete: Request, env: Env): Promise<Response> {
    const url = new URL(requete.url);
    if (requete.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/api/sante") return Response.json({ ok: true }, { headers: CORS });
    if (url.pathname === "/api/salons" && requete.method === "POST") {
      return Response.json({ code: genererCode() }, { headers: CORS });
    }
    const m = url.pathname.match(/^\/api\/salons\/([^/]+)$/);
    if (m) {
      const code = normaliserCode(decodeURIComponent(m[1]!));
      if (!code) return new Response("Code invalide", { status: 400, headers: CORS });
      return env.SALONS.get(env.SALONS.idFromName(code)).fetch(requete);
    }
    return new Response("Introuvable", { status: 404, headers: CORS });
  },
} satisfies ExportedHandler<Env>;
