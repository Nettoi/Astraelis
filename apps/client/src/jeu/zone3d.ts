import type { Zone } from "@astraelis/content";
import * as THREE from "three";
import { construireIlot, type CleQuartier } from "./decor/facades";
import { boite as boiteLocale, Lots, uvMonde } from "./decor/geometrie";
import { ajouterFlaques, construireReperes, construireSol } from "./decor/sol";
import { materiauPbr } from "./decor/textures";
import type { Ambiance } from "./rendu/ambiances";

const MM = 0.001;

const pbr = (couleur: string, rugosite: number, metal = 0) =>
  new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: metal });

/** Taille d'une répétition de chaque texture, en mètres. */
const TUILES: Record<CleQuartier, number> = {
  facade: 3,
  pierre: 2.5,
  tuiles: 2,
  bois: 1.5,
  vitreAllumee: 1,
  vitreSombre: 1,
};

/**
 * Construit une zone à partir de ses données (aucune géométrie en dur) : les rectangles
 * de collision sont habillés de maisons, de pavés et de repères générés par le code.
 */
export function construireZone(
  zone: Zone,
  ambiance: Ambiance,
  ombres: boolean,
  anisotropie: number,
): THREE.Group {
  const groupe = new THREE.Group();
  const identite = new THREE.Matrix4();

  const paves = materiauPbr("paves", anisotropie, { vertexColors: false, color: "#d8c3a5" });
  ajouterFlaques(paves);
  const sol = new THREE.Mesh(uvMonde(construireSol(zone), 2.2), paves);
  sol.receiveShadow = true;
  groupe.add(sol);

  const lots = new Lots<CleQuartier>(TUILES);
  for (const [i, e] of zone.elements.entries()) {
    if (e.type === "batiment" && e.hauteur < 20_000) construireIlot(lots, e.rect, e.hauteur * MM, 0x5a40 + i);
  }
  groupe.add(...construireReperes(lots, zone));

  const verre = new THREE.MeshStandardMaterial({
    color: "#000000",
    emissive: ambiance.lanternes.couleur,
    emissiveIntensity: 6,
  });
  const eau = zone.elements.find((e) => e.type === "eau");
  if (eau) {
    // Quai de pierre, puis la mer, sombre et lisse (reflets d'environnement).
    const zQuai = eau.rect.minZ * MM;
    lots.ajouter(
      "pierre",
      boiteLocale(identite, eau.rect.minX * MM, eau.rect.maxX * MM, -1.6, 0, zQuai, zQuai + 0.6),
    );
    const mer = new THREE.Mesh(
      new THREE.PlaneGeometry((eau.rect.maxX - eau.rect.minX) * MM, (eau.rect.maxZ - eau.rect.minZ) * MM),
      new THREE.MeshStandardMaterial({ color: "#081a33", roughness: 0.06, metalness: 0.2 }),
    );
    mer.rotation.x = -Math.PI / 2;
    mer.position.set(
      ((eau.rect.minX + eau.rect.maxX) / 2) * MM,
      -0.7,
      ((eau.rect.minZ + eau.rect.maxZ) / 2) * MM,
    );
    groupe.add(mer);
  }

  for (const e of zone.elements) {
    const [x0, x1, z0, z1] = [e.rect.minX * MM, e.rect.maxX * MM, e.rect.minZ * MM, e.rect.maxZ * MM];
    const [cx, cz, h] = [(x0 + x1) / 2, (z0 + z1) / 2, e.hauteur * MM];
    if (e.type === "fontaine") {
      const r = (x1 - x0) / 2;
      lots.ajouter("pierre", new THREE.CylinderGeometry(r, r + 0.1, 0.7, 24).translate(cx, 0.35, cz));
      lots.ajouter("pierre", new THREE.CylinderGeometry(0.35, 0.45, h, 12).translate(cx, h / 2, cz));
      lots.ajouter("pierre", new THREE.CylinderGeometry(1, 0.4, 0.3, 16).translate(cx, h, cz));
      const surface = new THREE.Mesh(
        new THREE.CircleGeometry(r - 0.2, 32),
        new THREE.MeshStandardMaterial({ color: "#0a2440", roughness: 0.05 }),
      );
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(cx, 0.6, cz);
      groupe.add(surface);
    } else if (e.type === "lampadaire") {
      const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 8), pbr("#3a3128", 0.45, 0.8));
      poteau.position.set(cx, h / 2, cz);
      poteau.castShadow = ombres;
      const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), verre);
      flamme.position.set(cx, h + 0.3, cz);
      groupe.add(poteau, flamme);
    }
  }

  const materiaux: Record<CleQuartier, THREE.Material> = {
    facade: materiauPbr("facade", anisotropie),
    pierre: materiauPbr("pierre", anisotropie),
    tuiles: materiauPbr("tuiles", anisotropie),
    bois: materiauPbr("bois", anisotropie),
    vitreAllumee: new THREE.MeshStandardMaterial({
      color: "#000000",
      emissive: "#ffb766",
      emissiveIntensity: 1.1,
    }),
    vitreSombre: new THREE.MeshStandardMaterial({ color: "#0b1020", roughness: 0.08, metalness: 0.3 }),
  };
  groupe.add(...lots.fusionner(materiaux, ombres));

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
