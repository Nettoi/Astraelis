import * as THREE from "three";

/**
 * Paramètres d'Astrælis selon l'avancée de l'histoire (0 = Prologue, 1 = impact).
 * La lune grossit et rougit à mesure qu'elle descend (pilier « le ciel est une horloge »).
 */
export function parametresAstraelis(avancee: number): { rayon: number; couleur: [number, number, number] } {
  const a = Math.min(1, Math.max(0, avancee));
  const rayon = 0.15 + a * a * 0.25; // rayon angulaire en radians : déjà énorme au Prologue
  const froid: [number, number, number] = [0.82, 0.88, 1.0];
  const rougeOr: [number, number, number] = [1.0, 0.55, 0.3];
  const couleur = froid.map((c, i) => c + (rougeOr[i]! - c) * a) as [number, number, number];
  return { rayon, couleur };
}

/** Direction de la lune, partagée avec la lumière directionnelle qui porte ses ombres. */
export const DIRECTION_LUNE = new THREE.Vector3(-0.3, 0.25, -1).normalize();

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
uniform vec3 uSoleilDir;
uniform vec3 uLuneCouleur;
uniform vec3 uAxeAnneau;
uniform float uLuneRayon;
uniform float uTemps;
uniform float uTextures;
uniform sampler2D uCarteLune;
uniform sampler2D uRelief;
varying vec3 vDir;

#define PI 3.14159265

float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
vec3 hash3(vec3 p) {
  return fract(sin(vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)),
                        dot(p, vec3(113.5, 271.9, 124.6)))) * 43758.5453);
}
float bruit(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * bruit(p); p *= 2.03; a *= 0.5; }
  return s;
}

// Étoiles ponctuelles : une par cellule, position et éclat aléatoires, scintillement doux.
vec3 etoiles(vec3 d, float densite, float echelle) {
  vec3 q = d * echelle;
  vec3 c = floor(q);
  vec3 h = hash3(c);
  float dist = length(q - (c + 0.15 + 0.7 * h));
  float eclat = step(1.0 - densite, h.x) * pow(h.y, 6.0) * 3.0 + step(1.0 - densite, h.x) * 0.25;
  float point = smoothstep(0.09, 0.0, dist) * eclat * (0.75 + 0.25 * sin(uTemps * (1.5 + 3.0 * h.z) + h.y * 40.0));
  vec3 teinte = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.7), h.z);
  return teinte * point;
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.45));
  // Lueur chaude de la ville au ras de l'horizon : le contre-jour des lanternes.
  col += vec3(0.5, 0.22, 0.08) * exp(-max(d.y, 0.0) * 18.0) * 0.18;

  // Voie lactée : grand cercle nuageux, veine de poussière sombre, étoiles plus denses.
  vec3 axeGalaxie = normalize(vec3(0.85, 0.2, 0.45));
  float g = dot(d, axeGalaxie);
  float bandeG = exp(-g * g * 28.0);
  float nuages = fbm(d * 3.5 + 11.0);
  float poussiere = smoothstep(0.45, 0.75, fbm(d * 7.0 + 3.0)) * exp(-g * g * 300.0);
  col += vec3(0.32, 0.3, 0.45) * bandeG * nuages * (1.0 - 0.8 * poussiere) * 0.35;
  float visible = smoothstep(-0.02, 0.2, d.y);
  col += (etoiles(d, 0.06, 160.0) + etoiles(d, 0.5 * bandeG, 260.0)) * visible;

  // Astrælis : sphère éclairée par un soleil lointain (phase gibbeuse), texture NASA
  // recolorée, relief, veines de lunite émissives, limbe atmosphérique.
  vec3 L = uLuneDir;
  vec3 t = normalize(cross(vec3(0.0, 1.0, 0.0), L));
  vec3 b = cross(L, t);
  vec2 p = vec2(dot(d, t), dot(d, b)) / sin(uLuneRayon);
  float r2 = dot(p, p);
  float aa = fwidth(r2) * 1.5;
  float disque = 1.0 - smoothstep(1.0 - aa, 1.0, r2);
  float distLune = acos(clamp(dot(d, L), -1.0, 1.0));
  if (disque > 0.0) {
    float z = sqrt(max(1.0 - r2, 0.0));
    vec3 nLocal = vec3(p.x, p.y, z); // repère de la lune, z vers l'observateur
    float rot = uTemps * 0.004 + 0.6;
    vec3 nr = vec3(nLocal.x * cos(rot) + nLocal.z * sin(rot), nLocal.y, -nLocal.x * sin(rot) + nLocal.z * cos(rot));
    vec2 uv = vec2(atan(nr.x, nr.z) / (2.0 * PI) + 0.5, asin(clamp(nr.y, -1.0, 1.0)) / PI + 0.5);
    float albedo = 0.55;
    vec3 n = t * p.x + b * p.y - L * z;
    if (uTextures > 0.5) {
      albedo = dot(texture2D(uCarteLune, uv).rgb, vec3(0.3333));
      vec2 e = vec2(1.0 / 1024.0, 1.0 / 512.0);
      float hx = texture2D(uRelief, uv + vec2(e.x, 0.0)).r - texture2D(uRelief, uv - vec2(e.x, 0.0)).r;
      float hy = texture2D(uRelief, uv + vec2(0.0, e.y)).r - texture2D(uRelief, uv - vec2(0.0, e.y)).r;
      n = normalize(n - (t * hx + b * hy) * 2.5);
    } else {
      albedo = 0.45 + 0.25 * fbm(nr * 3.0);
    }
    // Lommel-Seeliger : l'éclairage plat et poudreux des corps sans atmosphère.
    float mu0 = max(dot(n, uSoleilDir), 0.0);
    float mu = max(z, 0.05);
    float eclairage = 2.0 * mu0 / (mu0 + mu + 1e-3);
    vec3 surface = mix(vec3(0.3, 0.36, 0.55), vec3(1.0, 0.98, 0.96), smoothstep(0.15, 0.75, albedo)) * uLuneCouleur;
    vec3 lune = surface * (eclairage * 0.42 + 0.025);
    // Veines de lunite : bruit « crête », visibles aussi sur la face nocturne.
    float crete = 1.0 - abs(fbm(nr * 4.0 + 5.0) * 2.0 - 1.0);
    float gisement = smoothstep(0.42, 0.62, fbm(nr * 1.7 + 2.0));
    float veine = smoothstep(0.965, 0.995, crete) * gisement * (0.7 + 0.3 * sin(uTemps * 0.7 + crete * 20.0));
    // Plus visibles sur la face nocturne, où la lunite est la seule lumière.
    lune += vec3(0.35, 0.9, 1.0) * veine * mix(1.6, 0.5, clamp(eclairage, 0.0, 1.0));
    // Limbe : diffusion atmosphérique côté éclairé.
    lune += uLuneCouleur * pow(1.0 - z, 4.0) * 0.6 * smoothstep(-0.2, 0.4, dot(-L, uSoleilDir) + p.x * 0.5);
    col = mix(col, lune, disque);
  }
  // Halo atmosphérique, large et doux.
  float ecart = max(distLune - uLuneRayon, 0.0);
  col += uLuneCouleur * (exp(-ecart * 14.0) * 0.22 + exp(-ecart * 3.5) * 0.06) * (1.0 - disque);

  // Anneau de débris de Vaelis : arche au premier plan (il passe devant la lune), en
  // bandes de densité inégale, grains qui accrochent la lumière, plus vif près de la lune.
  vec3 axe = uAxeAnneau;
  float s = dot(d, axe) + 0.05;
  float largeur = 0.07;
  if (abs(s) < largeur && d.y > -0.05) {
    float x = s / largeur;
    // Densité en bandes douces : une division sombre, des anneaux internes fins.
    float profil = (1.0 - x * x) * (0.6 + 0.4 * bruit(vec3(x * 9.0, 0.5, 0.5)))
                 * (1.0 - 0.75 * exp(-pow((x - 0.25) * 14.0, 2.0)));
    float angle = atan(dot(d, normalize(cross(axe, vec3(0, 1, 0)))), d.y);
    float grain = hash(floor(vec3(angle * 900.0 + uTemps * 0.05, x * 60.0, 0.0)));
    float eclat = step(0.985, grain) * (0.5 + 0.5 * sin(uTemps * 3.0 + grain * 90.0));
    float diffusion = 1.0 + 2.5 * exp(-distLune * 3.0);
    vec3 anneau = vec3(0.95, 0.85, 0.68) * (profil * 0.16 + eclat * 1.4) * diffusion;
    float couvrance = clamp(profil * 0.55, 0.0, 0.8) * smoothstep(-0.05, 0.12, d.y);
    col = mix(col, col * 0.6 + anneau, couvrance);
  }

  gl_FragColor = vec4(col, 1.0);
}`;

export interface Ciel {
  maillage: THREE.Mesh;
  avancer: (t: number) => void;
  liberer: () => void;
}

export function creerCiel(zenith: string, horizon: string): Ciel {
  const astraelis = parametresAstraelis(0);
  // Soleil lointain derrière l'épaule droite de l'observateur : phase gibbeuse.
  const droite = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), DIRECTION_LUNE).normalize();
  const soleil = DIRECTION_LUNE.clone()
    .negate()
    .addScaledVector(droite, -1.9)
    .add(new THREE.Vector3(0, 0.35, 0));
  const materiau = new THREE.ShaderMaterial({
    vertexShader: sommets,
    fragmentShader: fragments,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uZenith: { value: new THREE.Color(zenith) },
      uHorizon: { value: new THREE.Color(horizon) },
      uLuneDir: { value: DIRECTION_LUNE.clone() },
      uSoleilDir: { value: soleil.normalize() },
      uLuneCouleur: { value: new THREE.Vector3(...astraelis.couleur) },
      uLuneRayon: { value: astraelis.rayon },
      // L'anneau traverse le ciel en diagonale et passe juste devant la lune.
      uAxeAnneau: {
        value: new THREE.Vector3().crossVectors(DIRECTION_LUNE, new THREE.Vector3(1, 0.3, 0)).normalize(),
      },
      uTemps: { value: 0 },
      uTextures: { value: 0 },
      uCarteLune: { value: null },
      uRelief: { value: null },
    },
  });

  // Textures NASA (domaine public) ; le ciel procédural tient lieu de repli.
  const chargeur = new THREE.TextureLoader();
  let restantes = 2;
  const pret = () => {
    if (--restantes === 0) materiau.uniforms.uTextures!.value = 1;
  };
  const couleur = chargeur.load("/ciel/lune_couleur_2k.jpg", pret);
  couleur.colorSpace = THREE.SRGBColorSpace;
  const relief = chargeur.load("/ciel/lune_relief.jpg", pret);
  for (const tex of [couleur, relief]) tex.wrapS = THREE.RepeatWrapping;
  materiau.uniforms.uCarteLune!.value = couleur;
  materiau.uniforms.uRelief!.value = relief;

  const maillage = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), materiau);
  maillage.frustumCulled = false;
  maillage.renderOrder = -1;
  return {
    maillage,
    avancer: (t) => {
      materiau.uniforms.uTemps!.value = t;
    },
    liberer: () => {
      couleur.dispose();
      relief.dispose();
      materiau.dispose();
      maillage.geometry.dispose();
    },
  };
}
