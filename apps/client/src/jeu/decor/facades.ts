import type { Rect } from "@astraelis/sim";
import { creerAleatoire, type Aleatoire } from "@astraelis/sim";
import * as THREE from "three";
import { boite, depuisTriangles, type Lots } from "./geometrie";

export type CleQuartier = "facade" | "pierre" | "tuiles" | "bois" | "vitreAllumee" | "vitreSombre";

const MM = 0.001;
const PROFONDEUR = 4; // profondeur d'une maison depuis la façade (m)
const REZ = 3.4; // hauteur du rez-de-chaussée
const ETAGE = 3;
const PENTE = Math.tan((38 * Math.PI) / 180);
const DEBORD = 0.35;

/** Enduits d'un port ocre sous la lune (palette « ocre / bleu nuit » de Sarn). */
const ENDUITS = ["#ead6b4", "#dcb88e", "#cf9a5c", "#e6c7aa", "#d3ab80", "#f0e2c8"].map(
  (c) => new THREE.Color(c),
);

const reel = (a: Aleatoire) => a.suivant() / 2 ** 32;

/** Repère d'une maison : origine au pied de la façade, z vers la rue. */
function repere(cx: number, cz: number, ox: number, oz: number): THREE.Matrix4 {
  return new THREE.Matrix4().makeRotationY(Math.atan2(ox, oz)).setPosition(cx, 0, cz);
}

function toit(
  r: THREE.Matrix4,
  l: number,
  hMur: number,
  montee: number,
): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const x0 = -l / 2 - 0.05;
  const x1 = l / 2 + 0.05;
  const zAv = DEBORD;
  const zFaite = -PROFONDEUR / 2;
  const zAr = -PROFONDEUR - DEBORD;
  const yBas = hMur - DEBORD * PENTE;
  const yHaut = hMur + montee;
  // Deux pans de tuiles (sens antihoraire vu de l'extérieur).
  const pans = depuisTriangles([
    ...[x0, yBas, zAv, x1, yBas, zAv, x1, yHaut, zFaite, x0, yBas, zAv, x1, yHaut, zFaite, x0, yHaut, zFaite],
    ...[x1, yBas, zAr, x0, yBas, zAr, x0, yHaut, zFaite, x1, yBas, zAr, x0, yHaut, zFaite, x1, yHaut, zFaite],
  ]).applyMatrix4(r);
  // Pignons enduits aux deux bouts.
  const xa = -l / 2;
  const xb = l / 2;
  const pignons = depuisTriangles([
    ...[xa, hMur, -PROFONDEUR, xa, hMur, 0, xa, yHaut, zFaite],
    ...[xb, hMur, 0, xb, hMur, -PROFONDEUR, xb, yHaut, zFaite],
  ]).applyMatrix4(r);
  return [pans, pignons];
}

function fenetre(
  lots: Lots<CleQuartier>,
  r: THREE.Matrix4,
  x: number,
  y: number,
  allumee: boolean,
  l = 1,
  h = 1.5,
) {
  lots.ajouter("bois", boite(r, x - l / 2 - 0.1, x + l / 2 + 0.1, y - 0.1, y + h + 0.1, 0, 0.08));
  lots.ajouter(allumee ? "vitreAllumee" : "vitreSombre", boite(r, x - l / 2, x + l / 2, y, y + h, 0.08, 0.1));
  lots.ajouter("pierre", boite(r, x - l / 2 - 0.2, x + l / 2 + 0.2, y - 0.22, y - 0.1, 0, 0.18));
  if (!allumee) {
    // Volets ouverts de part et d'autre.
    lots.ajouter("bois", boite(r, x - l / 2 - 0.62, x - l / 2 - 0.12, y, y + h, 0, 0.05));
    lots.ajouter("bois", boite(r, x + l / 2 + 0.12, x + l / 2 + 0.62, y, y + h, 0, 0.05));
  }
}

function maison(lots: Lots<CleQuartier>, a: Aleatoire, r: THREE.Matrix4, l: number, hauteurMax: number) {
  const montee = (PROFONDEUR / 2) * PENTE;
  const hMur = Math.max(REZ + ETAGE, hauteurMax - montee - reel(a) * 2.2);
  const enduit = ENDUITS[a.entier(0, ENDUITS.length - 1)]!;
  const rezPierre = reel(a) < 0.55;

  lots.ajouter("facade", boite(r, -l / 2, l / 2, rezPierre ? REZ : 0, hMur, -PROFONDEUR, 0), enduit);
  if (rezPierre) lots.ajouter("pierre", boite(r, -l / 2, l / 2, 0, REZ, -PROFONDEUR, 0.05));
  else lots.ajouter("pierre", boite(r, -l / 2, l / 2, 0, 0.6, -PROFONDEUR, 0.08));
  const [pans, pignons] = toit(r, l, hMur, montee);
  lots.ajouter("tuiles", pans, new THREE.Color().setHSL(0.04 + reel(a) * 0.03, 0.35, 0.55 + reel(a) * 0.2));
  lots.ajouter("facade", pignons, enduit);
  if (l < 3) return; // simple mur de liaison entre deux rangées

  // Colombages : poutres d'étage, poteaux d'angle sur une maison sur deux.
  const colombages = reel(a) < 0.5;
  for (let y = REZ; y < hMur - 1; y += ETAGE)
    lots.ajouter("bois", boite(r, -l / 2, l / 2, y - 0.12, y + 0.12, 0, 0.12));
  if (colombages) {
    for (const x of [-l / 2 + 0.12, l / 2 - 0.12])
      lots.ajouter("bois", boite(r, x - 0.12, x + 0.12, REZ, hMur, 0, 0.1));
  }
  lots.ajouter("bois", boite(r, -l / 2 - 0.1, l / 2 + 0.1, hMur - 0.25, hMur, 0, 0.3));

  // Rez-de-chaussée : une porte, une vitrine éclairée pour la fête des Lampes.
  const portes = l > 4.5 ? [-l / 4, l / 4] : [0];
  const iPorte = a.entier(0, portes.length - 1);
  for (const [i, x] of portes.entries()) {
    if (i === iPorte) lots.ajouter("bois", boite(r, x - 0.6, x + 0.6, 0, 2.3, 0, 0.1));
    else fenetre(lots, r, x, 0.9, reel(a) < 0.7, 1.6, 1.6);
  }
  // Étages : une ou deux fenêtres, près de la moitié éclairées de l'intérieur.
  const colonnes = l > 4.5 ? [-l / 4, l / 4] : [0];
  for (let y = REZ + 0.9; y + 1.6 < hMur - 0.3; y += ETAGE) {
    for (const x of colonnes) fenetre(lots, r, x, y, reel(a) < 0.45);
  }
}

/**
 * Habille un îlot de la carte : une rangée de maisons sur chaque côté, un cœur de pierre
 * au milieu. Le rectangle de collision ne change pas ; seul son habit est généré.
 */
export function construireIlot(lots: Lots<CleQuartier>, rect: Rect, hauteur: number, graine: number): void {
  const a = creerAleatoire(graine);
  const [x0, x1, z0, z1] = [rect.minX * MM, rect.maxX * MM, rect.minZ * MM, rect.maxZ * MM];
  const cotes = [
    { cx: (x0 + x1) / 2, cz: z1, ox: 0, oz: 1, longueur: x1 - x0 },
    { cx: (x0 + x1) / 2, cz: z0, ox: 0, oz: -1, longueur: x1 - x0 },
    { cx: x1, cz: (z0 + z1) / 2, ox: 1, oz: 0, longueur: z1 - z0 - 2 * PROFONDEUR },
    { cx: x0, cz: (z0 + z1) / 2, ox: -1, oz: 0, longueur: z1 - z0 - 2 * PROFONDEUR },
  ];
  for (const c of cotes) {
    const n = Math.max(1, Math.round(c.longueur / 5.5));
    const l = c.longueur / n;
    // Axe x local de la façade = (oz, 0, -ox).
    for (let i = 0; i < n; i++) {
      const decalage = -c.longueur / 2 + l * (i + 0.5);
      maison(lots, a, repere(c.cx + c.oz * decalage, c.cz - c.ox * decalage, c.ox, c.oz), l, hauteur);
    }
  }
  const cœur = new THREE.Matrix4();
  lots.ajouter(
    "pierre",
    boite(cœur, x0 + PROFONDEUR, x1 - PROFONDEUR, 0, hauteur * 0.6, z0 + PROFONDEUR, z1 - PROFONDEUR),
  );
}
