import { creerAleatoire } from "@astraelis/sim";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type Temps = { value: number };

const FANIONS = ["#e8b44c", "#b8323a", "#efe3c8", "#2c4a8a", "#d9772b"].map((c) => new THREE.Color(c));
const PETALES = ["#f4c6d0", "#fff1dc", "#e8a23a", "#f7d9a8", "#6b4a2a"].map((c) => new THREE.Color(c));

/** Fanions de la fête sur des cordes tendues ; la pointe flotte au vent (shader de sommets). */
export function creerGuirlandes(cordes: { de: number[]; a: number[] }[], temps: Temps): THREE.Mesh {
  const positions: number[] = [];
  const couleurs: number[] = [];
  const balancement: number[] = [];
  const point = (de: number[], a: number[], s: number) =>
    new THREE.Vector3(
      de[0]! + (a[0]! - de[0]!) * s,
      de[1]! + (a[1]! - de[1]!) * s - 0.9 * 4 * s * (1 - s), // flèche de la corde
      de[2]! + (a[2]! - de[2]!) * s,
    );
  for (const [k, c] of cordes.entries()) {
    const longueur = Math.hypot(c.a[0]! - c.de[0]!, c.a[2]! - c.de[2]!);
    const n = Math.floor(longueur / 0.55);
    for (let i = 1; i < n; i++) {
      const g = point(c.de, c.a, (i - 0.3) / n);
      const d = point(c.de, c.a, (i + 0.3) / n);
      const pointe = point(c.de, c.a, i / n).add(new THREE.Vector3(0, -0.45, 0));
      positions.push(g.x, g.y, g.z, d.x, d.y, d.z, pointe.x, pointe.y, pointe.z);
      const teinte = FANIONS[(i + k) % FANIONS.length]!;
      for (let j = 0; j < 3; j++) couleurs.push(teinte.r, teinte.g, teinte.b);
      balancement.push(0, 0, 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  g.setAttribute("aBalancement", new THREE.Float32BufferAttribute(balancement, 1));
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85 });
  m.onBeforeCompile = (s) => {
    s.uniforms.uTemps = temps;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTemps;\nattribute float aBalancement;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float phase = position.x * 1.7 + position.z * 1.3;
transformed.x += sin(uTemps * 2.3 + phase) * 0.12 * aBalancement;
transformed.z += cos(uTemps * 1.9 + phase) * 0.12 * aBalancement;`,
      );
  };
  const maillage = new THREE.Mesh(g, m);
  maillage.castShadow = true;
  return maillage;
}

/** Pétales et feuilles tombés après la fête : un seul appel de dessin instancié. */
export function creerPetales(nombre: number, rayon: number): THREE.InstancedMesh {
  const a = creerAleatoire(0xf1e7);
  const u = () => a.suivant() / 2 ** 32;
  const g = new THREE.PlaneGeometry(0.08, 0.055).rotateX(-Math.PI / 2);
  const m = new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(g, m, nombre);
  const matrice = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let i = 0; i < nombre; i++) {
    const r = Math.sqrt(u()) * rayon;
    const t = u() * Math.PI * 2;
    q.setFromEuler(new THREE.Euler((u() - 0.5) * 0.4, u() * Math.PI * 2, (u() - 0.5) * 0.4));
    const e = 0.7 + u() * 0.6;
    im.setMatrixAt(
      i,
      matrice.compose(
        new THREE.Vector3(Math.cos(t) * r, 0.006, Math.sin(t) * r),
        q,
        new THREE.Vector3(e, e, e),
      ),
    );
    im.setColorAt(i, PETALES[Math.floor(u() * PETALES.length)]!);
  }
  im.receiveShadow = true;
  return im;
}

/**
 * Ondes sur une surface d'eau : la normale est perturbée dans le shader (cercles autour d'un
 * centre pour la fontaine, houle croisée pour la mer). Les reflets font le reste.
 */
export function ajouterOndes(
  m: THREE.MeshStandardMaterial,
  temps: Temps,
  centre: THREE.Vector2 | null,
): void {
  m.onBeforeCompile = (s) => {
    s.uniforms.uTemps = temps;
    s.uniforms.uCentre = { value: centre ?? new THREE.Vector2() };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMondeEau;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvMondeEau = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uTemps;\nuniform vec2 uCentre;\nvarying vec3 vMondeEau;",
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
vec2 p = vMondeEau.xz;
vec2 pente;
${
  centre
    ? `vec2 v = p - uCentre; float r = length(v) + 1e-3;
pente = v / r * cos(r * 11.0 - uTemps * 4.0) * 0.18 * exp(-r * 0.4);`
    : `pente = vec2(0.7, 0.7) * cos(dot(p, vec2(0.7, 0.7)) * 1.3 + uTemps * 1.1) * 0.08
      + vec2(-0.3, 0.95) * cos(dot(p, vec2(-0.3, 0.95)) * 2.9 + uTemps * 1.7) * 0.05
      + vec2(0.95, -0.2) * cos(dot(p, vec2(0.95, -0.2)) * 6.1 + uTemps * 2.6) * 0.03;`
}
normal = normalize(normal + (viewMatrix * vec4(-pente.x, 0.0, -pente.y, 0.0)).xyz);`,
      );
  };
}

/** Rideau d'eau qui tombe de la vasque : stries additives qui défilent, écume au pied. */
export function creerChute(
  cx: number,
  cz: number,
  haut: number,
  bas: number,
  rayon: number,
  temps: Temps,
): THREE.Mesh {
  const rideau = new THREE.CylinderGeometry(rayon, rayon + 0.12, haut - bas, 32, 1, true).translate(
    cx,
    (haut + bas) / 2,
    cz,
  );
  const ecume = new THREE.RingGeometry(rayon, rayon + 0.35, 32)
    .rotateX(-Math.PI / 2)
    .translate(cx, bas + 0.01, cz);
  const uv2 = (g: THREE.BufferGeometry, v: number) => {
    const n = g.getAttribute("position").count;
    g.setAttribute("aEcume", new THREE.Float32BufferAttribute(new Array(n).fill(v), 1));
    return g;
  };
  const g = mergeGeometries([uv2(rideau, 0), uv2(ecume, 1)]);
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uTemps: temps },
    vertexShader: /* glsl */ `
attribute float aEcume;
varying vec2 vUv;
varying float vEcume;
void main() { vUv = uv; vEcume = aEcume; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
uniform float uTemps;
varying vec2 vUv;
varying float vEcume;
float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float strie = h(vec2(floor(vUv.x * 90.0), floor(vUv.y * 8.0 + uTemps * 6.0 + h(vec2(floor(vUv.x * 90.0))) * 8.0)));
  float rideau = smoothstep(0.55, 1.0, strie) * 0.35;
  float ecume = (1.0 - vUv.y) * (0.5 + 0.5 * sin(vUv.x * 60.0 + uTemps * 5.0)) * 0.25;
  gl_FragColor = vec4(vec3(0.75, 0.85, 1.0) * mix(rideau, ecume, vEcume), 1.0);
}`,
  });
  return new THREE.Mesh(g, m);
}
