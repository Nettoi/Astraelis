import { appliquerEntree, type CarteCollision, type Entree } from "@astraelis/sim";
import { JOUEURS_MAX } from "./constantes";
import { FileEntrees } from "./entrees";
import { nettoyerNom } from "./nom";
import { lireMessageInvite, type JoueurReseau, type MessageHote, type MessageInvite } from "./protocole";
import type { Canal } from "./transport";

export interface ZoneJouable {
  readonly id: string;
  readonly apparitions: readonly { readonly x: number; readonly z: number }[];
  readonly carte: CarteCollision;
}

interface JoueurHote {
  id: string;
  nom: string;
  x: number;
  z: number;
  file: FileEntrees;
  canal?: Canal<MessageHote, unknown>;
}

export const ID_HOTE = "h";

/**
 * Hôte autoritaire : fait tourner la simulation pour tous, reçoit les entrées des
 * invités, diffuse l'état. Il est lui-même un joueur (identifiant ID_HOTE).
 */
export class Hote {
  private readonly joueurs = new Map<string, JoueurHote>();
  private prochainId = 1;
  tickCourant = 0;

  constructor(
    private readonly zone: ZoneJouable,
    nomHote: string,
  ) {
    this.placer(ID_HOTE, nettoyerNom(nomHote, "Veilleur 1"));
  }

  /** Branche un invité. Il devient joueur à réception de son « bonjour ». */
  accueillir(canal: Canal<MessageHote, unknown>): void {
    let id: string | null = null;
    canal.surMessage((brut) => {
      const message: MessageInvite | null = lireMessageInvite(brut);
      if (!message) return;
      if (message.t === "bonjour") {
        if (id !== null) return;
        if (this.joueurs.size >= JOUEURS_MAX) {
          canal.envoyer({ t: "complet" });
          canal.fermer();
          return;
        }
        id = String(this.prochainId++);
        const j = this.placer(id, nettoyerNom(message.nom, `Veilleur ${this.joueurs.size + 1}`));
        j.canal = canal;
        canal.envoyer({ t: "bienvenue", id, zone: this.zone.id });
      } else if (id !== null) {
        this.joueurs.get(id)?.file.recevoir(message.entrees);
      }
    });
    canal.surFermeture(() => {
      if (id !== null) this.joueurs.delete(id);
    });
  }

  /** Entrée du joueur de l'hôte (pas de réseau). */
  entreeLocale(entree: Entree): void {
    this.joueurs.get(ID_HOTE)?.file.recevoir([entree]);
  }

  /** Un pas de simulation, puis diffusion de l'état à tous les invités. */
  tick(): JoueurReseau[] {
    this.tickCourant++;
    for (const j of this.joueurs.values()) {
      for (const e of j.file.consommer()) {
        const p = appliquerEntree(j, e, this.zone.carte);
        j.x = p.x;
        j.z = p.z;
      }
    }
    const etat = this.instantane();
    const message: MessageHote = { t: "etat", tick: this.tickCourant, joueurs: etat };
    for (const j of this.joueurs.values()) j.canal?.envoyer(message);
    return etat;
  }

  instantane(): JoueurReseau[] {
    return [...this.joueurs.values()].map(({ id, nom, x, z, file }) => ({
      id,
      nom,
      x,
      z,
      seq: file.derniereTraitee,
    }));
  }

  get nombreJoueurs(): number {
    return this.joueurs.size;
  }

  private placer(id: string, nom: string): JoueurHote {
    const occupes = new Set([...this.joueurs.values()].map((j) => `${j.x},${j.z}`));
    const a = this.zone.apparitions.find((p) => !occupes.has(`${p.x},${p.z}`)) ?? this.zone.apparitions[0]!;
    const j: JoueurHote = { id, nom, x: a.x, z: a.z, file: new FileEntrees() };
    this.joueurs.set(id, j);
    return j;
  }
}
