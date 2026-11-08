import {
  appliquerEntree,
  bornerAxe,
  reconcilier,
  type CarteCollision,
  type Entree,
  type EtatJoueur,
} from "@astraelis/sim";
import { RETARD_INTERPOLATION_MS } from "./constantes";
import type { JoueurReseau, MessageHote, MessageInvite } from "./protocole";
import type { Canal } from "./transport";

/** Nombre d'entrées récentes renvoyées dans chaque message (canal non fiable : redondance). */
const REDONDANCE = 3;
const INSTANTANES_GARDES = 20;

interface Instantane {
  temps: number;
  joueurs: Map<string, JoueurReseau>;
}

export interface JoueurAffiche {
  readonly id: string;
  readonly nom: string;
  readonly x: number;
  readonly z: number;
}

/**
 * Côté invité : prédit son propre déplacement, se réconcilie avec l'hôte et
 * interpole les autres joueurs avec un léger retard.
 */
export class Invite {
  id: string | null = null;
  zone: string | null = null;
  refuse = false;
  private etat: EtatJoueur | null = null;
  private enAttente: Entree[] = [];
  private seq = 0;
  private readonly instantanes: Instantane[] = [];

  constructor(
    private readonly canal: Canal<MessageInvite, MessageHote>,
    private readonly carte: CarteCollision,
    nom: string,
    private readonly horloge: () => number = () => performance.now(),
  ) {
    canal.surMessage((m) => this.recevoir(m));
    canal.envoyer({ t: "bonjour", nom });
  }

  /** Entrée locale pour un tick : appliquée tout de suite (prédiction) et envoyée à l'hôte. */
  entreeLocale(ax: number, az: number): void {
    if (this.etat === null) return;
    const entree: Entree = { seq: ++this.seq, ax: bornerAxe(ax), az: bornerAxe(az) };
    this.enAttente.push(entree);
    this.etat = appliquerEntree(this.etat, entree, this.carte);
    this.canal.envoyer({ t: "entrees", entrees: this.enAttente.slice(-REDONDANCE) });
  }

  get position(): EtatJoueur | null {
    return this.etat;
  }

  /** Les autres joueurs, interpolés à (maintenant − RETARD_INTERPOLATION_MS). */
  autres(): JoueurAffiche[] {
    const cible = this.horloge() - RETARD_INTERPOLATION_MS;
    const liste = this.instantanes;
    if (liste.length === 0) return [];
    let i = liste.length - 1;
    while (i > 0 && liste[i]!.temps > cible) i--;
    const a = liste[i]!;
    const b = liste[i + 1];
    const k = b ? Math.min(1, Math.max(0, (cible - a.temps) / (b.temps - a.temps || 1))) : 0;
    const resultat: JoueurAffiche[] = [];
    for (const ja of (b ?? a).joueurs.values()) {
      if (ja.id === this.id) continue;
      const depart = a.joueurs.get(ja.id) ?? ja;
      resultat.push({
        id: ja.id,
        nom: ja.nom,
        x: depart.x + (ja.x - depart.x) * k,
        z: depart.z + (ja.z - depart.z) * k,
      });
    }
    return resultat;
  }

  private recevoir(m: MessageHote): void {
    if (m.t === "bienvenue") {
      this.id = m.id;
      this.zone = m.zone;
    } else if (m.t === "complet") {
      this.refuse = true;
    } else if (m.t === "etat" && this.id !== null) {
      const moi = m.joueurs.find((j) => j.id === this.id);
      if (moi) {
        const r = reconcilier(moi, moi.seq, this.enAttente, this.carte);
        this.etat = { x: r.etat.x, z: r.etat.z };
        this.enAttente = r.restantes;
      }
      this.instantanes.push({ temps: this.horloge(), joueurs: new Map(m.joueurs.map((j) => [j.id, j])) });
      if (this.instantanes.length > INSTANTANES_GARDES) this.instantanes.shift();
    }
  }
}
