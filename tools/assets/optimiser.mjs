// Optimise les modèles listés dans modeles.json : soudure, simplification (meshoptimizer),
// nettoyage, compression EXT_meshopt_compression, sortie .glb unique (textures incluses).
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const triangles = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3, 0);

export async function optimiserModeles(racine) {
  await MeshoptEncoder.ready;
  await MeshoptSimplifier.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  const liste = JSON.parse(await readFile(resolve(racine, "tools/assets/modeles.json"), "utf8"));
  for (const m of liste) {
    const doc = await io.read(resolve(racine, m.source));
    const avant = triangles(doc);
    await doc.transform(
      dedup(),
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: m.ratio, error: m.erreur }),
      prune(),
      meshopt({ encoder: MeshoptEncoder, level: "medium" }),
    );
    await mkdir(dirname(resolve(racine, m.sortie)), { recursive: true });
    await io.write(resolve(racine, m.sortie), doc);
    console.log(`optimisé  ${m.sortie} : ${Math.round(avant)} → ${Math.round(triangles(doc))} triangles`);
  }
}
