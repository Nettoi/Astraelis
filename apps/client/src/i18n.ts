export const TEXTES = {
  fr: {
    titre: "Astrælis",
    joursRestants: (n: number) => `Il reste ${n} jours`,
    aideClavier: "Déplacement : ZQSD, WASD ou flèches",
    canvas: "Vue du jeu : la place des Lampes de Sarn, la nuit, sous Astrælis",
    joystick: "Manette tactile de déplacement",
    solo: "Jouer seul",
    nom: "Nom du Veilleur",
    creer: "Créer une partie",
    rejoindre: "Rejoindre",
    code: "Code de la partie",
    connexion: "Connexion…",
    codePartie: (c: string) => `Partie ${c}`,
    copierLien: "Copier le lien",
    lienCopie: "Lien copié",
    retour: "Retour",
    qualite: "Qualité graphique",
    paliers: { auto: "Automatique", cinema: "Cinéma", equilibre: "Équilibré", leger: "Léger" },
    erreurs: {
      "salon-complet": "La partie est complète (4 joueurs).",
      "pas-d-hote": "Aucune partie avec ce code.",
      "code-invalide": "Le code compte 6 lettres.",
      "delai-depasse": "La connexion à l'hôte a échoué.",
      reseau: "Le service de parties est injoignable.",
    } as Record<string, string>,
  },
  en: {
    titre: "Astrælis",
    joursRestants: (n: number) => `${n} days remain`,
    aideClavier: "Move: WASD, ZQSD or arrow keys",
    canvas: "Game view: Sarn's Lamplight Square at night, beneath Astrælis",
    joystick: "Touch movement stick",
    solo: "Play solo",
    nom: "Watcher name",
    creer: "Host a game",
    rejoindre: "Join",
    code: "Game code",
    connexion: "Connecting…",
    codePartie: (c: string) => `Game ${c}`,
    copierLien: "Copy link",
    lienCopie: "Link copied",
    retour: "Back",
    qualite: "Graphics quality",
    paliers: { auto: "Automatic", cinema: "Cinematic", equilibre: "Balanced", leger: "Light" },
    erreurs: {
      "salon-complet": "This game is full (4 players).",
      "pas-d-hote": "No game with this code.",
      "code-invalide": "The code has 6 letters.",
      "delai-depasse": "Could not connect to the host.",
      reseau: "The game service is unreachable.",
    } as Record<string, string>,
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
