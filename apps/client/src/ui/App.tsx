import { normaliserCode } from "@astraelis/shared";
import { useEffect, useRef, useState } from "react";
import { detecterLangue, TEXTES } from "../i18n";
import { demarrerJeu } from "../jeu/moteur";
import { sessionHote, sessionInvite, type SessionJeu } from "../jeu/session";
import { Accueil } from "./Accueil";
import { Joystick } from "./Joystick";

const langue = detecterLangue(navigator.languages);
const t = TEXTES[langue];

type Etat =
  | { ecran: "accueil"; erreur?: string | undefined }
  | { ecran: "connexion" }
  | { ecran: "jeu"; session: SessionJeu; code: string | null };

export function App() {
  const [etat, setEtat] = useState<Etat>({ ecran: "accueil" });
  const [copie, setCopie] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const session = etat.ecran === "jeu" ? etat.session : null;

  useEffect(() => {
    document.documentElement.lang = langue;
  }, []);

  useEffect(() => {
    if (session) return demarrerJeu(canvas.current!, session);
  }, [session]);

  const lancer = async (mode: "solo" | "creer" | "rejoindre", nom: string, saisie = "") => {
    setEtat({ ecran: "connexion" });
    try {
      if (mode === "solo")
        return setEtat({ ecran: "jeu", session: await sessionHote(nom, null), code: null });
      if (mode === "creer") {
        const r = await fetch("/api/salons", { method: "POST" }).catch(() => null);
        if (!r?.ok) throw new Error("reseau");
        const { code } = (await r.json()) as { code: string };
        history.replaceState(null, "", `?partie=${code}`);
        return setEtat({ ecran: "jeu", session: await sessionHote(nom, code), code });
      }
      const code = normaliserCode(saisie);
      if (!code) throw new Error("code-invalide");
      setEtat({ ecran: "jeu", session: await sessionInvite(nom, code), code });
    } catch (e) {
      const raison = e instanceof Error && e.message in t.erreurs ? e.message : "reseau";
      setEtat({ ecran: "accueil", erreur: t.erreurs[raison] });
    }
  };

  if (etat.ecran !== "jeu") {
    return (
      <Accueil
        t={t}
        occupe={etat.ecran === "connexion"}
        erreur={etat.ecran === "accueil" ? etat.erreur : undefined}
        lancer={lancer}
      />
    );
  }

  const lien = etat.code ? `${location.origin}${location.pathname}?partie=${etat.code}` : null;
  return (
    <main className="jeu">
      <canvas ref={canvas} className="vue" role="img" aria-label={t.canvas} />
      <header className="hud">
        <h1>{t.titre}</h1>
        <p className="compte" aria-live="polite">
          {t.joursRestants(300)}
        </p>
      </header>
      {lien && (
        <div className="partie">
          <span>{t.codePartie(etat.code!)}</span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(lien).then(() => setCopie(true));
            }}
          >
            {copie ? t.lienCopie : t.copierLien}
          </button>
        </div>
      )}
      <p className="aide">{t.aideClavier}</p>
      <Joystick libelle={t.joystick} />
    </main>
  );
}
