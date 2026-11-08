import { ENTREES_EN_ATTENTE_MAX, ENTREES_PAR_TICK_MAX } from "./constantes";
import type { Entree } from "@astraelis/sim";

/**
 * File d'entrées d'un joueur. Refuse les doublons et les séquences anciennes, plafonne
 * la taille de la file et le nombre d'entrées consommées par tick : un client qui
 * envoie trop vite ne peut pas se déplacer plus vite que la simulation.
 */
export class FileEntrees {
  private file: Entree[] = [];
  private derniereRecue = 0;
  derniereTraitee = 0;

  recevoir(entrees: readonly Entree[]): void {
    for (const e of entrees) {
      if (e.seq <= this.derniereRecue) continue;
      this.derniereRecue = e.seq;
      this.file.push(e);
    }
    if (this.file.length > ENTREES_EN_ATTENTE_MAX) {
      this.file.splice(0, this.file.length - ENTREES_EN_ATTENTE_MAX);
    }
  }

  /** Retire les entrées à appliquer pendant ce tick. */
  consommer(): Entree[] {
    const lot = this.file.splice(0, ENTREES_PAR_TICK_MAX);
    const derniere = lot.at(-1);
    if (derniere) this.derniereTraitee = derniere.seq;
    return lot;
  }

  get taille(): number {
    return this.file.length;
  }
}
