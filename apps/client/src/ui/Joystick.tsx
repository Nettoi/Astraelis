import { useRef, useState, type PointerEvent } from "react";
import { commandes } from "../jeu/entrees";

const RAYON = 56;

/** Manette tactile : glisser le pouce dans la zone en bas à gauche (cible ≥ 48 px). */
export function Joystick({ libelle }: { libelle: string }) {
  const centre = useRef<{ x: number; y: number } | null>(null);
  const [bouton, setBouton] = useState({ x: 0, y: 0 });

  const deplacer = (e: PointerEvent<HTMLDivElement>) => {
    if (!centre.current) return;
    let dx = e.clientX - centre.current.x;
    let dy = e.clientY - centre.current.y;
    const d = Math.hypot(dx, dy);
    if (d > RAYON) {
      dx = (dx / d) * RAYON;
      dy = (dy / d) * RAYON;
    }
    setBouton({ x: dx, y: dy });
    commandes.tactileX = dx / RAYON;
    commandes.tactileZ = dy / RAYON;
  };
  const relacher = () => {
    centre.current = null;
    setBouton({ x: 0, y: 0 });
    commandes.tactileX = commandes.tactileZ = 0;
  };

  return (
    <div
      className="joystick"
      role="application"
      aria-label={libelle}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        centre.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        e.currentTarget.setPointerCapture(e.pointerId);
        deplacer(e);
      }}
      onPointerMove={deplacer}
      onPointerUp={relacher}
      onPointerCancel={relacher}
    >
      <div className="joystick-bouton" style={{ transform: `translate(${bouton.x}px, ${bouton.y}px)` }} />
    </div>
  );
}
