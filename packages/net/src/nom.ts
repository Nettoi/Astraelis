import { NOM_LONGUEUR_MAX } from "./constantes";

/** Nettoie un nom saisi : lettres, chiffres, espaces, tirets, apostrophes ; sinon un nom par défaut. */
export function nettoyerNom(brut: unknown, repli: string): string {
  if (typeof brut !== "string") return repli;
  const propre = brut
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} '’-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NOM_LONGUEUR_MAX)
    .trim();
  return propre.length >= 2 ? propre : repli;
}
