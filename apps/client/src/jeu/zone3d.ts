import type { Zone } from "@astraelis/content";
import * as THREE from "three";

const MM = 0.001;

/** Rampe toon à trois tons : première pierre du rendu peint (GDD §8). */
function rampeToon(): THREE.DataTexture {
  const tons = new Uint8Array([90, 170, 255]);
  const t = new THREE.DataTexture(tons, tons.length, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

/** Construit la greybox d'une zone à partir de ses données (aucune géométrie en dur). */
export function construireZone(zone: Zone): THREE.Group {
  const groupe = new THREE.Group();
  const rampe = rampeToon();
  const toon = (couleur: string, emissive = "#000000") =>
    new THREE.MeshToonMaterial({ color: couleur, gradientMap: rampe, emissive });
  const { limites, palette } = zone;

  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry((limites.maxX - limites.minX) * MM, (limites.maxZ - limites.minZ) * MM),
    toon(palette.sol),
  );
  sol.rotation.x = -Math.PI / 2;
  sol.position.set(((limites.minX + limites.maxX) / 2) * MM, 0, ((limites.minZ + limites.maxZ) / 2) * MM);
  groupe.add(sol);

  const boite = new THREE.BoxGeometry(1, 1, 1);
  const materiaux = {
    batiment: toon(palette.batiment),
    mur: toon("#7d6a55"),
    eau: new THREE.MeshToonMaterial({
      color: "#1d3b6b",
      gradientMap: rampe,
      transparent: true,
      opacity: 0.9,
    }),
    fontaine: toon("#a7a29a"),
    lampadaire: toon("#2e2822"),
  };

  for (const e of zone.elements) {
    const largeur = (e.rect.maxX - e.rect.minX) * MM;
    const profondeur = (e.rect.maxZ - e.rect.minZ) * MM;
    const hauteur = Math.max(e.hauteur * MM, 0.02);
    const m = new THREE.Mesh(boite, materiaux[e.type]);
    m.scale.set(largeur, hauteur, profondeur);
    m.position.set(
      (e.rect.minX * MM + e.rect.maxX * MM) / 2,
      hauteur / 2,
      (e.rect.minZ * MM + e.rect.maxZ * MM) / 2,
    );
    groupe.add(m);
    if (e.type === "lampadaire") {
      const flamme = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 8),
        new THREE.MeshBasicMaterial({ color: palette.accent }),
      );
      flamme.position.set(m.position.x, hauteur + 0.3, m.position.z);
      groupe.add(flamme);
    }
  }

  // Quelques vraies lumières chaudes autour de la place ; le reste est émissif (budget mobile).
  for (const e of zone.elements.filter((x) => x.type === "lampadaire").slice(0, 4)) {
    const l = new THREE.PointLight(palette.accent, 14, 18, 1.6);
    l.position.set(
      ((e.rect.minX + e.rect.maxX) / 2) * MM,
      e.hauteur * MM + 0.3,
      ((e.rect.minZ + e.rect.maxZ) / 2) * MM,
    );
    groupe.add(l);
  }
  return groupe;
}

export function creerAvatar(couleur: string): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 1.0, 4, 12),
    new THREE.MeshToonMaterial({ color: couleur, gradientMap: rampeToon() }),
  );
  m.position.y = 0.85;
  return m;
}

export const versMetres = (mm: number) => mm * MM;
