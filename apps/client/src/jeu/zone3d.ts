import type { Zone } from "@astraelis/content";
import * as THREE from "three";
import { construireIlot, type CleQuartier, type LumiereAuSol } from "./decor/facades";
import { boite as boiteLocale, Lots, uvMonde } from "./decor/geometrie";
import { instancierModele, type Pose } from "./decor/modeles";
import { guirlandes, lampadaires, placerAccessoires, type Accessoire } from "./decor/placements";
import { ajouterFlaques, construireReperes, construireSol } from "./decor/sol";
import { salirMurs, varierEmission } from "./decor/shaders";
import { materiauPbr } from "./decor/textures";
import { ajouterOndes, creerChute, creerGuirlandes, creerPetales, type Temps } from "./decor/vie";
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
  fer: 1,
  toile: 1,
};

const MODELES: Record<Accessoire, { url: string; hauteur: number }> = {
  tonneau: { url: "/modeles/tonneau.glb", hauteur: 0.95 },
  caisse: { url: "/modeles/caisse.glb", hauteur: 0.6 },
  plante: { url: "/modeles/plante.glb", hauteur: 1.1 },
};
const HAUTEUR_LANTERNE = 1;

export interface Decor {
  groupe: THREE.Group;
  /** Anime l'eau, les fanions (secondes). */
  avancer: (t: number) => void;
}

/**
 * Construit une zone à partir de ses données (aucune géométrie en dur) : les rectangles
 * de collision sont habillés de maisons, de pavés et de repères générés par le code.
 */
export function construireZone(
  zone: Zone,
  ambiance: Ambiance,
  ombres: boolean,
  anisotropie: number,
  leger: boolean,
): Decor {
  const groupe = new THREE.Group();
  const identite = new THREE.Matrix4();
  const temps: Temps = { value: 0 };

  const paves = materiauPbr("paves", anisotropie, { vertexColors: false, color: "#d8c3a5" });
  ajouterFlaques(paves);
  const sol = new THREE.Mesh(uvMonde(construireSol(zone), 2.2), paves);
  sol.receiveShadow = true;
  groupe.add(sol);

  const lots = new Lots<CleQuartier>(TUILES);
  const lumieres: LumiereAuSol[] = [];
  for (const [i, e] of zone.elements.entries()) {
    if (e.type === "batiment" && e.hauteur < 20_000)
      construireIlot(lots, e.rect, e.hauteur * MM, 0x5a40 + i, lumieres);
  }
  groupe.add(creerLumieresAuSol(lumieres, ambiance.lanternes.couleur));
  groupe.add(...construireReperes(lots, zone));

  const eau = zone.elements.find((e) => e.type === "eau");
  if (eau) {
    // Quai de pierre, puis la mer, sombre et lisse (reflets d'environnement).
    const zQuai = eau.rect.minZ * MM;
    lots.ajouter(
      "pierre",
      boiteLocale(identite, eau.rect.minX * MM, eau.rect.maxX * MM, -1.6, 0, zQuai, zQuai + 0.6),
    );
    const materiauMer = new THREE.MeshStandardMaterial({ color: "#081a33", roughness: 0.06, metalness: 0.2 });
    ajouterOndes(materiauMer, temps, null);
    const mer = new THREE.Mesh(
      new THREE.PlaneGeometry((eau.rect.maxX - eau.rect.minX) * MM, (eau.rect.maxZ - eau.rect.minZ) * MM),
      materiauMer,
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
      const materiauEau = new THREE.MeshStandardMaterial({ color: "#0a2440", roughness: 0.05 });
      ajouterOndes(materiauEau, temps, new THREE.Vector2(cx, cz));
      const surface = new THREE.Mesh(new THREE.CircleGeometry(r - 0.2, 48), materiauEau);
      surface.rotation.x = -Math.PI / 2;
      surface.position.set(cx, 0.6, cz);
      groupe.add(surface, creerChute(cx, cz, h - 0.05, 0.6, 0.95, temps));
    } else if (e.type === "lampadaire") {
      // Poteau de fer forgé : socle, fût, bague ; la lanterne de laiton se pose dessus.
      lots.ajouter("fer", boiteLocale(identite, cx - 0.22, cx + 0.22, 0, 0.5, cz - 0.22, cz + 0.22));
      lots.ajouter(
        "fer",
        new THREE.CylinderGeometry(0.07, 0.1, h - 0.5, 10).translate(cx, 0.5 + (h - 0.5) / 2, cz),
      );
      lots.ajouter("fer", new THREE.CylinderGeometry(0.16, 0.12, 0.12, 12).translate(cx, h - 0.06, cz));
    }
  }

  const materiaux: Record<CleQuartier, THREE.Material> = {
    facade: murSali(materiauPbr("facade", anisotropie)),
    pierre: murSali(materiauPbr("pierre", anisotropie)),
    tuiles: materiauPbr("tuiles", anisotropie),
    bois: materiauPbr("bois", anisotropie),
    vitreAllumee: vitreVariee(),
    vitreSombre: new THREE.MeshStandardMaterial({ color: "#0b1020", roughness: 0.08, metalness: 0.3 }),
    fer: new THREE.MeshStandardMaterial({
      color: "#2a2724",
      roughness: 0.5,
      metalness: 0.85,
      vertexColors: true,
    }),
    toile: new THREE.MeshStandardMaterial({ roughness: 0.9, vertexColors: true }),
  };
  groupe.add(...lots.fusionner(materiaux, ombres));

  // Modèles Poly Haven instanciés, chargés en arrière-plan : la scène est jouable avant.
  const ajouterQuandPret = (p: Promise<THREE.Object3D[]>) =>
    p.then((objets) => objets.length && groupe.add(...objets)).catch(() => {});
  const verre = new THREE.MeshStandardMaterial({
    color: "#000000",
    emissive: ambiance.lanternes.couleur,
    emissiveIntensity: 9,
  });
  ajouterQuandPret(
    instancierModele(
      "/modeles/lanterne.glb",
      HAUTEUR_LANTERNE,
      lampadaires(zone).map((l) => ({ x: l.x, y: l.h, z: l.z, angle: l.x + l.z })),
      ombres,
      (m) => (m.name.includes("glass") ? verre : m),
    ),
  );
  const poses = new Map<Accessoire, Pose[]>();
  for (const p of placerAccessoires(zone)) {
    poses.set(p.type, [...(poses.get(p.type) ?? []), { x: p.x, y: 0, z: p.z, angle: p.angle }]);
  }
  for (const [type, liste] of poses) {
    ajouterQuandPret(instancierModele(MODELES[type].url, MODELES[type].hauteur, liste, ombres));
  }

  groupe.add(creerGuirlandes(guirlandes(zone), temps), creerPetales(leger ? 600 : 1500, 26));

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
  return {
    groupe,
    avancer: (t) => {
      temps.value = t;
    },
  };
}

function murSali(m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  salirMurs(m);
  return m;
}

function vitreVariee(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color: "#000000",
    emissive: "#ffb766",
    emissiveIntensity: 1.3,
    vertexColors: true,
  });
  varierEmission(m);
  return m;
}

/** Flaques de lumière chaude devant les vitrines : disques additifs dégradés, un appel de dessin. */
function creerLumieresAuSol(lumieres: LumiereAuSol[], couleur: string): THREE.InstancedMesh {
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uCouleur: { value: new THREE.Color(couleur) } },
    vertexShader: /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
uniform vec3 uCouleur;
varying vec2 vUv;
void main() {
  vec2 d = (vUv - vec2(0.5, 0.75)) * vec2(1.0, 1.4);
  float a = pow(max(1.0 - length(d) * 2.0, 0.0), 2.0) * 0.45;
  gl_FragColor = vec4(uCouleur * a, 1.0);
}`,
  });
  const im = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(3.2, 3.2).rotateX(-Math.PI / 2),
    m,
    Math.max(lumieres.length, 1),
  );
  const matrice = new THREE.Matrix4();
  for (const [i, l] of lumieres.entries()) {
    matrice.makeRotationY(l.angle).setPosition(l.x, 0.02, l.z);
    im.setMatrixAt(i, matrice);
  }
  im.count = lumieres.length;
  return im;
}

export function creerAvatar(couleur: string): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.0, 6, 16), pbr(couleur, 0.5));
  m.position.y = 0.85;
  m.castShadow = true;
  return m;
}

export const versMetres = (mm: number) => mm * MM;
