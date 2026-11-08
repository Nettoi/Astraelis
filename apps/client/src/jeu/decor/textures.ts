import * as THREE from "three";

export type NomTexture = "paves" | "facade" | "pierre" | "tuiles" | "bois";

const chargeur = new THREE.TextureLoader();

/**
 * Matériau PBR à partir d'un jeu Poly Haven (CC0) : couleur, normale (OpenGL) et ARM
 * (R = occlusion, V = rugosité). Les teintes par maison passent par les couleurs de sommets.
 */
export function materiauPbr(
  nom: NomTexture,
  anisotropie: number,
  parametres: THREE.MeshStandardMaterialParameters = {},
) {
  const charger = (carte: string, srgb: boolean) => {
    const t = chargeur.load(`/textures/${nom}_${carte}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = anisotropie;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const arm = charger("arm", false);
  return new THREE.MeshStandardMaterial({
    map: charger("couleur", true),
    normalMap: charger("normale", false),
    roughnessMap: arm,
    aoMap: arm,
    metalness: 0,
    vertexColors: true,
    ...parametres,
  });
}
