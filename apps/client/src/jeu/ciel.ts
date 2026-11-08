import * as THREE from "three";

/**
 * Paramètres d'Astrælis selon l'avancée de l'histoire (0 = Prologue, 1 = impact).
 * La lune grossit et rougit à mesure qu'elle descend (pilier « le ciel est une horloge »).
 */
export function parametresAstraelis(avancee: number): { rayon: number; couleur: [number, number, number] } {
  const a = Math.min(1, Math.max(0, avancee));
  const rayon = 0.085 + a * a * 0.2; // rayon angulaire en radians
  const froid: [number, number, number] = [0.86, 0.9, 1.0];
  const rougeOr: [number, number, number] = [1.0, 0.55, 0.3];
  const couleur = froid.map((c, i) => c + (rougeOr[i]! - c) * a) as [number, number, number];
  return { rayon, couleur };
}

const sommets = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const fragments = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uLuneDir;
uniform vec3 uLuneCouleur;
uniform float uLuneRayon;
uniform float uTemps;
varying vec3 vDir;

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float bruit(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = hash(vec3(i, 0.0)), b = hash(vec3(i + vec2(1, 0), 0.0));
  float c = hash(vec3(i + vec2(0, 1), 0.0)), d = hash(vec3(i + vec2(1, 1), 0.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));

  // Étoiles : cellules aléatoires, scintillement doux.
  vec3 cellule = floor(d * 220.0);
  float s = hash(cellule);
  float etoile = step(0.9975, s) * smoothstep(0.0, 0.25, h) * (0.6 + 0.4 * sin(uTemps * 2.0 + s * 60.0));
  col += vec3(etoile);

  // Anneau de débris : bande sur un grand cercle incliné, granuleuse et animée.
  vec3 axe = normalize(vec3(0.25, 0.35, 1.0));
  float bande = abs(dot(d, axe));
  float largeur = 0.035;
  float anneau = smoothstep(largeur, 0.0, bande);
  float angle = atan(d.x, d.y);
  float grain = bruit(vec2(angle * 90.0 + uTemps * 0.15, bande * 400.0));
  col += vec3(0.95, 0.82, 0.6) * anneau * (0.25 + 0.6 * grain) * smoothstep(-0.05, 0.15, d.y);

  // Astrælis : disque au limbe doux, mers sombres, halo.
  float ang = acos(clamp(dot(d, uLuneDir), -1.0, 1.0));
  float disque = smoothstep(uLuneRayon, uLuneRayon * 0.96, ang);
  vec3 tangente = normalize(cross(uLuneDir, vec3(0.0, 1.0, 0.0)));
  vec2 uv = vec2(dot(d, tangente), dot(d, cross(tangente, uLuneDir))) / uLuneRayon;
  float mers = bruit(uv * 3.0 + 7.0) * 0.6 + bruit(uv * 9.0) * 0.4;
  vec3 surface = uLuneCouleur * (0.75 + 0.25 * smoothstep(0.35, 0.7, mers)) * (1.0 - 0.35 * dot(uv, uv));
  float halo = exp(-max(ang - uLuneRayon, 0.0) * 9.0) * 0.35;
  // Valeurs HDR : la lune dépasse le seuil du bloom, le ciel reste sombre.
  col = mix(col, surface * 1.5, disque) + uLuneCouleur * halo * 0.7 * (1.0 - disque);

  gl_FragColor = vec4(col, 1.0);
}`;

export function creerCiel(
  zenith: string,
  horizon: string,
): { maillage: THREE.Mesh; avancer: (t: number) => void } {
  const astraelis = parametresAstraelis(0);
  const materiau = new THREE.ShaderMaterial({
    vertexShader: sommets,
    fragmentShader: fragments,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uZenith: { value: new THREE.Color(zenith) },
      uHorizon: { value: new THREE.Color(horizon) },
      uLuneDir: { value: new THREE.Vector3(-0.32, 0.42, -1).normalize() },
      uLuneCouleur: { value: new THREE.Vector3(...astraelis.couleur) },
      uLuneRayon: { value: astraelis.rayon },
      uTemps: { value: 0 },
    },
  });
  const maillage = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), materiau);
  maillage.frustumCulled = false;
  maillage.renderOrder = -1;
  return {
    maillage,
    avancer: (t) => {
      materiau.uniforms.uTemps!.value = t;
    },
  };
}
