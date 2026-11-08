import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/**
 * Charge le HDRI de nuit (Poly Haven, CC0) et le filtre en sonde PMREM pour les reflets
 * et la lumière ambiante. Le jeu reste jouable pendant le chargement ou s'il échoue.
 */
export function chargerEnvironnement(
  rendu: THREE.WebGLRenderer,
  scene: THREE.Scene,
  url: string,
): () => void {
  let libere = false;
  let carte: THREE.Texture | undefined;
  new HDRLoader().load(
    url,
    (hdr) => {
      if (libere) return hdr.dispose();
      const pmrem = new THREE.PMREMGenerator(rendu);
      carte = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      pmrem.dispose();
      scene.environment = carte;
    },
    undefined,
    () => {
      /* sans HDRI : éclairage direct seulement */
    },
  );
  return () => {
    libere = true;
    carte?.dispose();
  };
}
