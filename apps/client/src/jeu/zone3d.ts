import type { Zone } from "@astraelis/content";
import * as THREE from "three";
import type { Ambiance } from "./rendu/ambiances";

const MM = 0.001;

const pbr = (couleur: string, rugosite: number, metal = 0) =>
  new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: metal });

/**
 * Construit une zone à partir de ses données (aucune géométrie en dur). Matériaux PBR
 * unis en attendant les textures de Sarn ; les lanternes émettent assez pour le bloom.
 */
export function construireZone(zone: Zone, ambiance: Ambiance, ombres: boolean): THREE.Group {
  const groupe = new THREE.Group();
  const { limites, palette } = zone;

  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry((limites.maxX - limites.minX) * MM, (limites.maxZ - limites.minZ) * MM),
    pbr(palette.sol, 0.55),
  );
  sol.receiveShadow = true;
  sol.rotation.x = -Math.PI / 2;
  sol.position.set(((limites.minX + limites.maxX) / 2) * MM, 0, ((limites.minZ + limites.maxZ) / 2) * MM);
  groupe.add(sol);

  const boite = new THREE.BoxGeometry(1, 1, 1);
  const materiaux = {
    batiment: pbr(palette.batiment, 0.85),
    mur: pbr("#7d6a55", 0.9),
    eau: new THREE.MeshStandardMaterial({
      color: "#0d2244",
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    }),
    fontaine: pbr("#a7a29a", 0.6),
    lampadaire: pbr("#3a3128", 0.45, 0.8),
  };
  const verre = new THREE.MeshStandardMaterial({
    color: "#000000",
    emissive: ambiance.lanternes.couleur,
    emissiveIntensity: 6,
  });

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
    m.castShadow = ombres && e.type !== "eau";
    m.receiveShadow = ombres;
    groupe.add(m);
    if (e.type === "lampadaire") {
      const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), verre);
      flamme.position.set(m.position.x, hauteur + 0.3, m.position.z);
      groupe.add(flamme);
    }
  }

  // Quelques vraies lumières chaudes autour de la place ; le reste est émissif (budget mobile).
  for (const e of zone.elements.filter((x) => x.type === "lampadaire").slice(0, 4)) {
    const { couleur, intensite, portee } = ambiance.lanternes;
    const l = new THREE.PointLight(couleur, intensite, portee, 2);
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
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 6, 16), pbr(couleur, 0.5));
  m.position.y = 0.85;
  m.castShadow = true;
  return m;
}

export const versMetres = (mm: number) => mm * MM;
