export const TEXTES = {
  fr: {
    titre: "Astrælis",
    joursRestants: (n: number) => `Il reste ${n} jours`,
    aideClavier: "Déplacement : ZQSD, WASD ou flèches",
    canvas: "Vue du jeu : la place des Lampes de Sarn, la nuit, sous Astrælis",
    joystick: "Manette tactile de déplacement",
    solo: "Solo",
  },
  en: {
    titre: "Astrælis",
    joursRestants: (n: number) => `${n} days remain`,
    aideClavier: "Move: WASD, ZQSD or arrow keys",
    canvas: "Game view: Sarn's Lamplight Square at night, beneath Astrælis",
    joystick: "Touch movement stick",
    solo: "Solo",
  },
} as const;

export type Langue = keyof typeof TEXTES;

/** Langue détectée automatiquement : français sauf si le navigateur préfère l'anglais. */
export function detecterLangue(preferees: readonly string[]): Langue {
  for (const l of preferees) {
    const code = l.toLowerCase().slice(0, 2);
    if (code === "fr") return "fr";
    if (code === "en") return "en";
  }
  return "fr";
}
