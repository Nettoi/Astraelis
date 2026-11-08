import * as THREE from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface Pose {
  x: number;
  y: number;
  z: number;
  angle: number;
}

// Les modèles sont simplifiés et compressés par `pnpm assets` (EXT_meshopt_compression).
const chargeur = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);

/**
 * Charge un modèle glTF (Poly Haven, CC0), le met à l'échelle (hauteur voulue, pied à y = 0)
 * et en tire un InstancedMesh par sous-maillage : un appel de dessin par matériau, quel
 * que soit le nombre de copies. `retoucher` permet de changer un matériau (verre émissif).
 */
export async function instancierModele(
  url: string,
  hauteur: number,
  poses: readonly Pose[],
  ombres: boolean,
  retoucher?: (m: THREE.MeshStandardMaterial) => THREE.Material,
): Promise<THREE.InstancedMesh[]> {
  if (poses.length === 0) return [];
  const gltf = await chargeur.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  const boite = new THREE.Box3().setFromObject(gltf.scene);
  const echelle = hauteur / Math.max(boite.max.y - boite.min.y, 1e-3);
  const normalisation = new THREE.Matrix4()
    .makeScale(echelle, echelle, echelle)
    .multiply(
      new THREE.Matrix4().makeTranslation(
        -(boite.min.x + boite.max.x) / 2,
        -boite.min.y,
        -(boite.min.z + boite.max.z) / 2,
      ),
    );

  const maillages: THREE.InstancedMesh[] = [];
  const matrice = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const haut = new THREE.Vector3(0, 1, 0);
  const un = new THREE.Vector3(1, 1, 1);
  gltf.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const geometrie = (o.geometry as THREE.BufferGeometry)
      .clone()
      .applyMatrix4(o.matrixWorld)
      .applyMatrix4(normalisation);
    const original = o.material as THREE.MeshStandardMaterial;
    const materiau = retoucher ? retoucher(original) : original;
    const im = new THREE.InstancedMesh(geometrie, materiau, poses.length);
    for (const [i, p] of poses.entries()) {
      rotation.setFromAxisAngle(haut, p.angle);
      im.setMatrixAt(i, matrice.compose(new THREE.Vector3(p.x, p.y, p.z), rotation, un));
    }
    im.castShadow = im.receiveShadow = ombres;
    im.computeBoundingSphere();
    maillages.push(im);
  });
  return maillages;
}
