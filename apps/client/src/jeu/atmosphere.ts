import type { Zone } from "@astraelis/content";
import { creerAleatoire } from "@astraelis/sim";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Ambiance } from "./rendu/ambiances";

const MM = 0.001;

const sommetsCone = /* glsl */ `
varying float vHauteur;
varying float vBord;
void main() {
  vHauteur = uv.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vBord = abs(dot(n, normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}`;
const fragmentsCone = /* glsl */ `
uniform vec3 uCouleur;
varying float vHauteur;
varying float vBord;
void main() {
  // Plus dense près de la lanterne, fondu sur les bords : un cône de brume, pas un solide.
  float a = pow(vHauteur, 1.6) * pow(vBord, 2.0) * 0.16;
  gl_FragColor = vec4(uCouleur * a, 1.0);
}`;

const sommetsParticules = /* glsl */ `
uniform float uTemps;
uniform float uEchelle;
attribute vec4 aAlea;
varying float vEclat;
varying float vLuciole;
void main() {
  vec3 p = position;
  float luciole = step(0.5, aAlea.w);
  float f = mix(0.15, 0.6, aAlea.x);
  p += vec3(sin(uTemps * f + aAlea.y * 6.28), sin(uTemps * f * 1.3 + aAlea.z * 6.28) * 0.6,
            cos(uTemps * f * 0.8 + aAlea.x * 6.28)) * mix(0.35, 0.9, luciole);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // Les lucioles clignotent lentement ; la poussière scintille à peine.
  vEclat = luciole > 0.5 ? smoothstep(0.2, 1.0, sin(uTemps * (0.8 + aAlea.y) + aAlea.z * 20.0)) : 0.35;
  vLuciole = luciole;
  gl_PointSize = mix(0.05, 0.11, luciole) * uEchelle / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const fragmentsParticules = /* glsl */ `
uniform vec3 uLuciole;
uniform vec3 uPoussiere;
varying float vEclat;
varying float vLuciole;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, r);
  vec3 c = mix(uPoussiere, uLuciole * 4.0, vLuciole);
  gl_FragColor = vec4(c * a * a * vEclat, 1.0);
}`;

export interface Atmosphere {
  groupe: THREE.Group;
  avancer: (t: number, hauteurEcranPx: number) => void;
}

/** Cônes de brume sous les lanternes, lucioles autour d'elles, poussière sur la place. */
export function creerAtmosphere(zone: Zone, ambiance: Ambiance, nombreParticules: number): Atmosphere {
  const groupe = new THREE.Group();
  const lanternes = zone.elements.filter((e) => e.type === "lampadaire");
  const additif = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

  const materiauCone = new THREE.ShaderMaterial({
    vertexShader: sommetsCone,
    fragmentShader: fragmentsCone,
    uniforms: { uCouleur: { value: new THREE.Color(ambiance.lanternes.couleur) } },
    side: THREE.DoubleSide,
    ...additif,
  });
  // Tous les cônes en une seule géométrie : un appel de dessin.
  const cones = lanternes.map((e) => {
    const hauteur = e.hauteur * MM + 0.3;
    return new THREE.ConeGeometry(2.6, hauteur, 24, 1, true).translate(
      ((e.rect.minX + e.rect.maxX) / 2) * MM,
      hauteur / 2,
      ((e.rect.minZ + e.rect.maxZ) / 2) * MM,
    );
  });
  if (cones.length) groupe.add(new THREE.Mesh(mergeGeometries(cones), materiauCone));

  const alea = creerAleatoire(0x5a41);
  const u = () => alea.suivant() / 2 ** 32;
  const positions = new Float32Array(nombreParticules * 3);
  const aleas = new Float32Array(nombreParticules * 4);
  const { limites } = zone;
  for (let i = 0; i < nombreParticules; i++) {
    const luciole = i % 2 === 0 && lanternes.length > 0;
    if (luciole) {
      const e = lanternes[i % lanternes.length]!;
      const angle = u() * Math.PI * 2;
      const rayon = 0.6 + u() * 3.2;
      positions.set(
        [
          ((e.rect.minX + e.rect.maxX) / 2) * MM + Math.cos(angle) * rayon,
          0.4 + u() * 3,
          ((e.rect.minZ + e.rect.maxZ) / 2) * MM + Math.sin(angle) * rayon,
        ],
        i * 3,
      );
    } else {
      positions.set(
        [
          (limites.minX + u() * (limites.maxX - limites.minX)) * MM,
          0.2 + u() * 6,
          (limites.minZ + u() * (limites.maxZ - limites.minZ)) * MM,
        ],
        i * 3,
      );
    }
    aleas.set([u(), u(), u(), luciole ? 1 : 0], i * 4);
  }
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometrie.setAttribute("aAlea", new THREE.BufferAttribute(aleas, 4));
  const materiauParticules = new THREE.ShaderMaterial({
    vertexShader: sommetsParticules,
    fragmentShader: fragmentsParticules,
    uniforms: {
      uTemps: { value: 0 },
      uEchelle: { value: 800 },
      uLuciole: { value: new THREE.Color("#ffd27a") },
      uPoussiere: { value: new THREE.Color("#8a93b8") },
    },
    ...additif,
  });
  const points = new THREE.Points(geometrie, materiauParticules);
  points.frustumCulled = false;
  groupe.add(points);

  return {
    groupe,
    avancer: (t, hauteurEcranPx) => {
      materiauParticules.uniforms.uTemps!.value = t;
      // Taille en pixels ≈ taille monde × (hauteur d'écran / (2·tan(fov/2))) / distance.
      materiauParticules.uniforms.uEchelle!.value = hauteurEcranPx / (2 * Math.tan((60 * Math.PI) / 360));
    },
  };
}
