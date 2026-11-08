import { useState } from "react";
import type { TEXTES } from "../i18n";
import { choixQualite, enregistrerQualite } from "../jeu/rendu/choix";
import { lirePalier, PALIERS } from "../jeu/rendu/qualite";

interface Props {
  t: (typeof TEXTES)[keyof typeof TEXTES];
  occupe: boolean;
  erreur: string | undefined;
  lancer: (mode: "solo" | "creer" | "rejoindre", nom: string, code?: string) => void;
}

const lireNom = () => {
  try {
    return localStorage.getItem("astraelis.nom") ?? "";
  } catch {
    return "";
  }
};

/** Écran d'accueil : nom, jouer seul, créer une partie, rejoindre par code. */
export function Accueil({ t, occupe, erreur, lancer }: Props) {
  const [nom, setNom] = useState(lireNom);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get("partie") ?? "");
  const [qualite, setQualite] = useState<string>(() => choixQualite() ?? "auto");
  const nomFinal = nom.trim() || "Veilleur";
  const go = (mode: "solo" | "creer" | "rejoindre") => {
    try {
      localStorage.setItem("astraelis.nom", nom);
    } catch {
      /* stockage indisponible : sans conséquence */
    }
    lancer(mode, nomFinal, code);
  };

  return (
    <main className="accueil">
      <h1>{t.titre}</h1>
      <label>
        {t.nom}
        <input value={nom} maxLength={20} autoComplete="nickname" onChange={(e) => setNom(e.target.value)} />
      </label>
      <div className="actions">
        <button type="button" disabled={occupe} onClick={() => go("solo")}>
          {t.solo}
        </button>
        <button type="button" disabled={occupe} onClick={() => go("creer")}>
          {t.creer}
        </button>
      </div>
      <form
        className="rejoindre"
        onSubmit={(e) => {
          e.preventDefault();
          go("rejoindre");
        }}
      >
        <label>
          {t.code}
          <input
            value={code}
            maxLength={7}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        <button type="submit" disabled={occupe}>
          {t.rejoindre}
        </button>
      </form>
      <label>
        {t.qualite}
        <select
          value={qualite}
          onChange={(e) => {
            setQualite(e.target.value);
            enregistrerQualite(lirePalier(e.target.value));
          }}
        >
          <option value="auto">{t.paliers.auto}</option>
          {PALIERS.map((p) => (
            <option key={p} value={p}>
              {t.paliers[p]}
            </option>
          ))}
        </select>
      </label>
      <p className="statut" role="status" aria-live="polite">
        {occupe ? t.connexion : (erreur ?? "")}
      </p>
    </main>
  );
}
