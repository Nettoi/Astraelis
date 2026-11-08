import type { MessageSalon } from "@astraelis/shared";
import type { Canal } from "./transport";

/** STUN public gratuit de Cloudflare ; le TURN (NAT strict) sera ajouté via le Worker. */
export const ICE_PAR_DEFAUT: RTCIceServer[] = [{ urls: "stun:stun.cloudflare.com:3478" }];

/** Types de messages qui passent par le canal non fiable (état, entrées) ; le reste est fiable. */
const NON_FIABLES = new Set(["etat", "entrees"]);

interface CanalDonnees {
  readyState: string;
  send(d: string): void;
  close(): void;
  addEventListener(type: "message", f: (e: { data: unknown }) => void): void;
  addEventListener(type: "close", f: () => void): void;
}

/**
 * Réunit deux DataChannels en un Canal : « fiable » (ordonné, retransmis) pour
 * les événements, « etat » (ordonné, sans retransmission) pour le flux à 20 Hz.
 */
export function canalDouble<E extends { t: string }, R>(
  fiable: CanalDonnees,
  rapide: CanalDonnees,
): Canal<E, R> {
  const recus: ((m: R) => void)[] = [];
  const fermes: (() => void)[] = [];
  let ferme = false;
  const surFerme = () => {
    if (ferme) return;
    ferme = true;
    for (const f of fermes) f();
  };
  for (const c of [fiable, rapide]) {
    c.addEventListener("message", (e) => {
      if (typeof e.data !== "string" || e.data.length > 65_536) return;
      try {
        const m = JSON.parse(e.data) as R;
        for (const r of recus) r(m);
      } catch {
        /* message illisible : ignoré */
      }
    });
    c.addEventListener("close", surFerme);
  }
  return {
    envoyer: (m) => {
      const c = NON_FIABLES.has(m.t) ? rapide : fiable;
      if (c.readyState === "open") c.send(JSON.stringify(m));
    },
    surMessage: (r) => void recus.push(r),
    surFermeture: (r) => void fermes.push(r),
    fermer: () => {
      fiable.close();
      rapide.close();
      surFerme();
    },
  };
}

/** Connexion WebSocket au salon de signalisation. */
export function connecterSalon(urlWs: string): {
  ws: WebSocket;
  surMessage: (f: (m: MessageSalon) => void) => void;
  signaler: (a: string, donnees: unknown) => void;
} {
  const ws = new WebSocket(urlWs);
  const ecouteurs: ((m: MessageSalon) => void)[] = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data)) as MessageSalon;
    for (const f of ecouteurs) f(m);
  });
  return {
    ws,
    surMessage: (f) => void ecouteurs.push(f),
    signaler: (a, donnees) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ t: "signal", a, donnees }));
    },
  };
}

type Signal = { sdp: RTCSessionDescriptionInit } | { ice: RTCIceCandidateInit };

/**
 * Côté hôte : pour chaque invité annoncé par le salon, crée la connexion pair-à-pair
 * et livre un Canal prêt à l'emploi dès que les deux DataChannels sont ouverts.
 */
export function ecouterInvites<E extends { t: string }, R>(
  urlWs: string,
  surCanal: (canal: Canal<E, R>) => void,
  ice: RTCIceServer[] = ICE_PAR_DEFAUT,
): { fermer: () => void; pret: Promise<void> } {
  const salon = connecterSalon(urlWs);
  const pairs = new Map<string, RTCPeerConnection>();
  let pret!: () => void;
  let echec!: (e: Error) => void;
  const promesse = new Promise<void>((ok, ko) => ((pret = ok), (echec = ko)));
  salon.surMessage(async (m) => {
    if (m.t === "accueil") pret();
    else if (m.t === "erreur") echec(new Error(m.raison));
    else if (m.t === "arrivee") {
      const pc = new RTCPeerConnection({ iceServers: ice });
      pairs.set(m.id, pc);
      const fiable = pc.createDataChannel("fiable", { ordered: true });
      const rapide = pc.createDataChannel("etat", { ordered: true, maxRetransmits: 0 });
      let ouverts = 0;
      const ouvert = () => {
        if (++ouverts === 2) surCanal(canalDouble<E, R>(fiable, rapide));
      };
      fiable.addEventListener("open", ouvert);
      rapide.addEventListener("open", ouvert);
      pc.addEventListener(
        "icecandidate",
        (e) => e.candidate && salon.signaler(m.id, { ice: e.candidate.toJSON() }),
      );
      await pc.setLocalDescription(await pc.createOffer());
      salon.signaler(m.id, { sdp: pc.localDescription!.toJSON() });
    } else if (m.t === "signal") {
      const pc = pairs.get(m.de);
      const s = m.donnees as Signal;
      if (!pc) return;
      if ("sdp" in s) await pc.setRemoteDescription(s.sdp);
      else if ("ice" in s) await pc.addIceCandidate(s.ice).catch(() => undefined);
    } else if (m.t === "depart") {
      // L'invité ferme sa signalisation dès que le pair-à-pair est ouvert : on oublie
      // seulement la négociation, la connexion directe continue. Sa fin est signalée par le Canal.
      pairs.delete(m.id);
    }
  });
  salon.ws.addEventListener("close", () => echec(new Error("salon-ferme")));
  return {
    pret: promesse,
    fermer: () => {
      salon.ws.close();
      for (const pc of pairs.values()) pc.close();
    },
  };
}

/** Côté invité : rejoint le salon et renvoie le Canal vers l'hôte une fois ouvert. */
export function rejoindreHote<E extends { t: string }, R>(
  urlWs: string,
  ice: RTCIceServer[] = ICE_PAR_DEFAUT,
): Promise<{ canal: Canal<E, R>; fermer: () => void }> {
  return new Promise((ok, ko) => {
    const salon = connecterSalon(urlWs);
    const pc = new RTCPeerConnection({ iceServers: ice });
    let hote: string | null = null;
    const canaux = new Map<string, RTCDataChannel>();
    const fermer = () => {
      salon.ws.close();
      pc.close();
    };
    pc.addEventListener("datachannel", (e) => {
      canaux.set(e.channel.label, e.channel);
      e.channel.addEventListener("open", () => {
        const fiable = canaux.get("fiable");
        const rapide = canaux.get("etat");
        if (fiable?.readyState === "open" && rapide?.readyState === "open") {
          salon.ws.close(); // la signalisation n'est plus utile : 0 requête de plus
          ok({ canal: canalDouble<E, R>(fiable, rapide), fermer });
        }
      });
    });
    pc.addEventListener(
      "icecandidate",
      (e) => hote && e.candidate && salon.signaler(hote, { ice: e.candidate.toJSON() }),
    );
    salon.surMessage(async (m) => {
      if (m.t === "accueil") hote = m.hote;
      else if (m.t === "erreur") ko(new Error(m.raison));
      else if (m.t === "signal") {
        const s = m.donnees as Signal;
        if ("sdp" in s) {
          await pc.setRemoteDescription(s.sdp);
          await pc.setLocalDescription(await pc.createAnswer());
          salon.signaler(m.de, { sdp: pc.localDescription!.toJSON() });
        } else if ("ice" in s) await pc.addIceCandidate(s.ice).catch(() => undefined);
      }
    });
  });
}
