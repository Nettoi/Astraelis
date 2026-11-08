import type * as THREE from "three";

/** Bruit de valeur 2D partagé par les retouches de matériaux. */
const BRUIT = /* glsl */ `
varying vec3 vMonde;
float hRetouche(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bRetouche(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hRetouche(i), hRetouche(i + vec2(1, 0)), f.x), mix(hRetouche(i + vec2(0, 1)), hRetouche(i + vec2(1, 1)), f.x), f.y);
}`;

type Shader = THREE.WebGLProgramParametersWithUniforms;

/** Ajoute la position monde (`vMonde`) et le bruit `bRetouche` aux deux étages du shader. */
export function injecterMonde(s: Shader): void {
  s.vertexShader = s.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vMonde;")
    .replace(
      "#include <project_vertex>",
      "#include <project_vertex>\nvMonde = (modelMatrix * vec4(transformed, 1.0)).xyz;",
    );
  s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\n${BRUIT}`);
}

/** Murs : pied sali par l'eau et la boue, coulures irrégulières ; casse la répétition. */
export function salirMurs(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (s) => {
    injecterMonde(s);
    s.fragmentShader = s.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
float coulure = bRetouche(vec2((vMonde.x + vMonde.z) * 1.7, 0.0)) * 0.9;
float pied = smoothstep(0.0, 1.2 + coulure, vMonde.y);
float taches = 0.82 + 0.36 * bRetouche((vMonde.xy + vMonde.zy) * 0.35);
diffuseColor.rgb *= mix(0.45, 1.0, pied) * taches;`,
    );
  };
}

/** Vitres éclairées : l'intensité suit la couleur de sommet (chaque fenêtre a sa lampe). */
export function varierEmission(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vColor.rgb;",
    );
  };
}
