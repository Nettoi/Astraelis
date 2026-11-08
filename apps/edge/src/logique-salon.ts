import { JOUEURS_MAX, SIGNAL_OCTETS_MAX, type MessageSalon, type Role } from "@astraelis/shared";

export interface Participant {
  readonly id: string;
  readonly role: Role;
}

export interface Envoi {
  readonly a: string;
  readonly message: MessageSalon;
}

/**
 * Logique pure d'un salon de signalisation, sans WebSocket : l'état est la liste des
 * participants, reconstruite depuis les étiquettes des sockets après hibernation.
 */
export function admettre(
  participants: readonly Participant[],
  role: Role,
): { ok: true } | { ok: false; raison: "salon-complet" | "pas-d-hote" | "hote-deja-present" } {
  const hote = participants.some((p) => p.role === "hote");
  if (role === "hote") return hote ? { ok: false, raison: "hote-deja-present" } : { ok: true };
  if (!hote) return { ok: false, raison: "pas-d-hote" };
  if (participants.length >= JOUEURS_MAX) return { ok: false, raison: "salon-complet" };
  return { ok: true };
}

export function aLArrivee(participants: readonly Participant[], nouveau: Participant): Envoi[] {
  const hote = participants.find((p) => p.role === "hote") ?? (nouveau.role === "hote" ? nouveau : undefined);
  const envois: Envoi[] = [
    { a: nouveau.id, message: { t: "accueil", id: nouveau.id, role: nouveau.role, hote: hote?.id ?? null } },
  ];
  if (nouveau.role === "invite" && hote)
    envois.push({ a: hote.id, message: { t: "arrivee", id: nouveau.id } });
  return envois;
}

export function auDepart(restants: readonly Participant[], parti: Participant): Envoi[] {
  return restants.map((p) => ({ a: p.id, message: { t: "depart", id: parti.id } }));
}

/** Relaie un signal. Un invité ne parle qu'à l'hôte ; l'hôte parle à tout invité. */
export function relayer(participants: readonly Participant[], de: Participant, brut: string): Envoi[] {
  if (brut.length > SIGNAL_OCTETS_MAX)
    return [{ a: de.id, message: { t: "erreur", raison: "message-invalide" } }];
  let message: unknown;
  try {
    message = JSON.parse(brut);
  } catch {
    message = null;
  }
  const m = message as { t?: unknown; a?: unknown; donnees?: unknown } | null;
  const dest = participants.find((p) => p.id === m?.a);
  const autorise = dest !== undefined && dest.id !== de.id && (de.role === "hote" || dest.role === "hote");
  if (m?.t !== "signal" || !autorise)
    return [{ a: de.id, message: { t: "erreur", raison: "message-invalide" } }];
  return [{ a: dest.id, message: { t: "signal", de: de.id, donnees: m.donnees } }];
}
