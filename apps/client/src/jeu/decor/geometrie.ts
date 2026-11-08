import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * UV en mètres, projetées selon l'axe dominant de la normale : une texture garde la même
 * échelle sur tous les volumes, sans étirement. À appeler après la mise en place.
 */
export function uvMonde(g: THREE.BufferGeometry, tuile: number): THREE.BufferGeometry {
  const p = g.getAttribute("position");
  const n = g.getAttribute("normal");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    const [u, v] =
      ay >= ax && ay >= az
        ? [p.getX(i), p.getZ(i)]
        : ax >= az
          ? [p.getZ(i), p.getY(i)]
          : [p.getX(i), p.getY(i)];
    uv[i * 2] = u / tuile;
    uv[i * 2 + 1] = v / tuile;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Géométrie à partir de faces (triangles), sommets non partagés : normales franches. */
export function depuisTriangles(sommets: readonly number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(sommets, 3));
  g.setIndex([...Array(sommets.length / 3).keys()]);
  g.computeVertexNormals();
  return g;
}

/**
 * Regroupe les pièces par matériau puis les fusionne : un appel de dessin par matériau,
 * quel que soit le nombre de maisons (budget ≤ 60 appels par image).
 */
export class Lots<K extends string> {
  private readonly pieces = new Map<K, THREE.BufferGeometry[]>();

  constructor(private readonly tuiles: Record<K, number>) {}

  /** Ajoute une pièce déjà placée dans le monde, avec une teinte (couleurs de sommets). */
  ajouter(cle: K, g: THREE.BufferGeometry, teinte = new THREE.Color(1, 1, 1)): void {
    uvMonde(g, this.tuiles[cle]);
    const couleurs = new Float32Array(g.getAttribute("position").count * 3);
    for (let i = 0; i < couleurs.length; i += 3) couleurs.set([teinte.r, teinte.g, teinte.b], i);
    g.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
    const liste = this.pieces.get(cle) ?? [];
    liste.push(g);
    this.pieces.set(cle, liste);
  }

  fusionner(materiaux: Record<K, THREE.Material>, ombres: boolean): THREE.Mesh[] {
    const maillages: THREE.Mesh[] = [];
    for (const [cle, liste] of this.pieces) {
      const g = mergeGeometries(liste);
      for (const p of liste) p.dispose();
      const m = new THREE.Mesh(g, materiaux[cle]);
      m.castShadow = m.receiveShadow = ombres;
      maillages.push(m);
    }
    return maillages;
  }
}

/** Boîte dans un repère local (x le long de la façade, z vers l'extérieur, y vers le haut). */
export function boite(
  repere: THREE.Matrix4,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g.applyMatrix4(repere);
}
