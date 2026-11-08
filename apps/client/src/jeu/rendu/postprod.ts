import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { LUTPass } from "three/addons/postprocessing/LUTPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import type { Ambiance } from "./ambiances";
import { genererLut } from "./lut";
import type { ReglagesRendu } from "./qualite";

const TAILLE_LUT = 32;

const Vignette = {
  uniforms: { tDiffuse: { value: null }, uForce: { value: 0.35 } },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uForce;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec2 d = vUv - 0.5;
  c.rgb *= 1.0 - uForce * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
  gl_FragColor = c;
}`,
};

export interface ChaineRendu {
  rendre: () => void;
  redimensionner: (largeur: number, hauteur: number) => void;
  liberer: () => void;
}

/**
 * Rendu → GTAO (demi-résolution) → bloom → tonemapping ACES + sRGB → LUT → vignette → SMAA.
 * La profondeur de champ (cinématiques) viendra avec la caméra de cinéma.
 */
export function creerChaine(
  rendu: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  reglages: ReglagesRendu,
  ambiance: Ambiance,
): ChaineRendu {
  if (!reglages.postTraitement) {
    return {
      rendre: () => rendu.render(scene, camera),
      redimensionner: (l, h) => rendu.setSize(l, h, false),
      liberer: () => {},
    };
  }

  // Cible en virgule flottante : le bloom travaille sur les valeurs HDR, avant ACES.
  const cible = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const composeur = new EffectComposer(rendu, cible);
  composeur.addPass(new RenderPass(scene, camera));

  if (reglages.ao) {
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1, scale: 1, samples: 8 });
    ao.updatePdMaterial({ samples: 8, radius: 6 });
    ao.blendIntensity = 0.85;
    const tailleComplete = ao.setSize.bind(ao);
    ao.setSize = (l: number, h: number) => tailleComplete(Math.ceil(l / 2), Math.ceil(h / 2));
    composeur.addPass(ao);
  }
  if (reglages.bloom) composeur.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.9, 0.6, 0.85));

  composeur.addPass(new OutputPass());

  const lut = new THREE.Data3DTexture(
    genererLut(ambiance.etalonnage, TAILLE_LUT),
    TAILLE_LUT,
    TAILLE_LUT,
    TAILLE_LUT,
  );
  lut.minFilter = lut.magFilter = THREE.LinearFilter;
  lut.wrapS = lut.wrapT = lut.wrapR = THREE.ClampToEdgeWrapping;
  lut.unpackAlignment = 1;
  lut.needsUpdate = true;
  composeur.addPass(new LUTPass({ lut, intensity: 1 }));

  if (ambiance.vignette > 0) {
    const vignette = new ShaderPass(Vignette);
    vignette.uniforms.uForce!.value = ambiance.vignette;
    composeur.addPass(vignette);
  }
  if (reglages.smaa) composeur.addPass(new SMAAPass());

  return {
    rendre: () => composeur.render(),
    redimensionner: (l, h) => {
      rendu.setSize(l, h, false);
      composeur.setPixelRatio(rendu.getPixelRatio());
      composeur.setSize(l, h);
    },
    liberer: () => {
      composeur.dispose();
      lut.dispose();
    },
  };
}
