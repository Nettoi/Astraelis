/** Alphabet des codes de salon : sans I ni O pour éviter la confusion avec 1 et 0. */
export const ALPHABET_CODE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const LONGUEUR_CODE = 6;

/** Code de salon aléatoire (24^6 ≈ 191 millions de possibilités). */
export function genererCode(
  octets: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n)),
): string {
  // Rejet des octets ≥ 240 pour éviter le biais du modulo (240 = 10 × 24).
  let code = "";
  while (code.length < LONGUEUR_CODE) {
    for (const o of octets(LONGUEUR_CODE * 2)) {
      if (o < 240 && code.length < LONGUEUR_CODE) code += ALPHABET_CODE[o % ALPHABET_CODE.length];
    }
  }
  return code;
}

/** Normalise une saisie (minuscules, espaces) ; null si ce n'est pas un code valide. */
export function normaliserCode(saisie: string): string | null {
  const code = saisie.toUpperCase().replace(/[\s-]/g, "");
  return new RegExp(`^[${ALPHABET_CODE}]{${LONGUEUR_CODE}}$`).test(code) ? code : null;
}
