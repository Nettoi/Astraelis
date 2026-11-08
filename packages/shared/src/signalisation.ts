/** Protocole de signalisation WebRTC entre les navigateurs et le Durable Object d'un salon. */

export type Role = "hote" | "invite";

/** Navigateur → salon. */
export interface SignalSortant {
  readonly t: "signal";
  /** Destinataire. Un invité ne peut s'adresser qu'à l'hôte. */
  readonly a: string;
  /** Offre/réponse SDP ou candidat ICE, relayé tel quel. */
  readonly donnees: unknown;
}

/** Salon → navigateur. */
export type MessageSalon =
  | { readonly t: "accueil"; readonly id: string; readonly role: Role; readonly hote: string | null }
  | { readonly t: "arrivee"; readonly id: string }
  | { readonly t: "depart"; readonly id: string }
  | { readonly t: "signal"; readonly de: string; readonly donnees: unknown }
  | { readonly t: "erreur"; readonly raison: RaisonRefus };

export type RaisonRefus = "salon-complet" | "pas-d-hote" | "hote-deja-present" | "message-invalide";
