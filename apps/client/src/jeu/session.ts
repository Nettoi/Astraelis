import { chargerZone, versCarteCollision, type Zone } from "@astraelis/content";
import {
  ecouterInvites,
  Hote,
  ID_HOTE,
  Invite,
  rejoindreHote,
  type JoueurReseau,
  type MessageHote,
  type MessageInvite,
} from "@astraelis/net";

export interface JoueurVu {
  readonly id: string;
  readonly nom: string;
  readonly x: number;
  readonly z: number;
}

/** Ce que le moteur attend d'une partie, qu'elle soit solo, hébergée ou rejointe. */
export interface SessionJeu {
  readonly zone: Zone;
  readonly idLocal: string;
  /** Un pas à 20 Hz avec les axes du joueur local. */
  tick(ax: number, az: number): void;
  /** Positions à afficher ; alpha ∈ [0, 1] = avancée entre deux ticks. */
  joueurs(alpha: number): JoueurVu[];
  fermer(): void;
}

function urlSalon(code: string, role: "hote" | "invite"): string {
  const u = new URL(`/api/salons/${code}?role=${role}`, location.href);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  return u.toString();
}

const lerp = (a: JoueurReseau, b: JoueurReseau, k: number): JoueurVu => ({
  id: b.id,
  nom: b.nom,
  x: a.x + (b.x - a.x) * k,
  z: a.z + (b.z - a.z) * k,
});

/** Solo (sans code) ou hôte d'une partie coop. La simulation tourne ici dans les deux cas. */
export async function sessionHote(nom: string, code: string | null): Promise<SessionJeu> {
  const zone = chargerZone("sarn");
  const hote = new Hote({ id: zone.id, apparitions: zone.apparitions, carte: versCarteCollision(zone) }, nom);
  const ecoute = code
    ? ecouterInvites<MessageHote, unknown>(urlSalon(code, "hote"), (c) => hote.accueillir(c))
    : null;
  await ecoute?.pret;
  let seq = 0;
  let avant = hote.instantane();
  let apres = avant;
  return {
    zone,
    idLocal: ID_HOTE,
    tick(ax, az) {
      hote.entreeLocale({ seq: ++seq, ax, az });
      avant = apres;
      apres = hote.tick();
    },
    joueurs: (alpha) => apres.map((j) => lerp(avant.find((p) => p.id === j.id) ?? j, j, alpha)),
    fermer: () => ecoute?.fermer(),
  };
}

/** Invité : prédiction locale, les autres joueurs sont interpolés par `Invite`. */
export async function sessionInvite(nom: string, code: string): Promise<SessionJeu> {
  const zone = chargerZone("sarn");
  const { canal, fermer } = await rejoindreHote<MessageInvite, MessageHote>(urlSalon(code, "invite"));
  const invite = new Invite(canal, versCarteCollision(zone), nom);
  await new Promise<void>((ok, ko) => {
    const debut = Date.now();
    const attente = setInterval(() => {
      if (invite.refuse) ko(new Error("salon-complet"));
      else if (Date.now() - debut > 10_000) ko(new Error("delai-depasse"));
      else if (invite.position) ok();
      else return;
      clearInterval(attente);
    }, 50);
  });
  let avant = invite.position!;
  let apres = avant;
  return {
    zone,
    idLocal: invite.id!,
    tick(ax, az) {
      avant = apres;
      invite.entreeLocale(ax, az);
      apres = invite.position ?? apres;
    },
    joueurs: (alpha) => [
      {
        id: invite.id!,
        nom,
        x: avant.x + (apres.x - avant.x) * alpha,
        z: avant.z + (apres.z - avant.z) * alpha,
      },
      ...invite.autres(),
    ],
    fermer,
  };
}
