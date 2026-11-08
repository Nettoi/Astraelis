import { useEffect, useRef } from "react";
import { detecterLangue, TEXTES } from "../i18n";
import { demarrerJeu } from "../jeu/moteur";
import { Joystick } from "./Joystick";

const langue = detecterLangue(navigator.languages);
const t = TEXTES[langue];

export function App() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.documentElement.lang = langue;
    return demarrerJeu(canvas.current!, "Veilleur");
  }, []);

  return (
    <main className="jeu">
      <canvas ref={canvas} className="vue" role="img" aria-label={t.canvas} />
      <header className="hud">
        <h1>{t.titre}</h1>
        <p className="compte" aria-live="polite">
          {t.joursRestants(300)}
        </p>
      </header>
      <p className="aide">{t.aideClavier}</p>
      <Joystick libelle={t.joystick} />
    </main>
  );
}
