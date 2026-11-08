// Rejoue le pipeline d'assets : télécharge chaque source listée dans sources.json si le
// fichier manque ou diffère, et vérifie son empreinte SHA-256. Usage : pnpm assets
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sources = JSON.parse(await readFile(resolve(racine, "tools/assets/sources.json"), "utf8"));
const empreinte = (octets) => createHash("sha256").update(octets).digest("hex");

let echecs = 0;
for (const s of sources) {
  const chemin = resolve(racine, s.fichier);
  const present = await readFile(chemin).catch(() => null);
  if (present && empreinte(present) === s.sha256) {
    console.log(`ok        ${s.fichier}`);
    continue;
  }
  const reponse = await fetch(s.url, { headers: { "User-Agent": "astraelis-assets/1.0" } });
  const octets = Buffer.from(await reponse.arrayBuffer());
  if (!reponse.ok || empreinte(octets) !== s.sha256) {
    console.error(`ÉCHEC     ${s.fichier} (${reponse.status}, empreinte inattendue)`);
    echecs++;
    continue;
  }
  await mkdir(dirname(chemin), { recursive: true });
  await writeFile(chemin, octets);
  console.log(`téléchargé ${s.fichier} (${(octets.length / 1e6).toFixed(1)} Mo)`);
}
process.exit(echecs ? 1 : 0);
