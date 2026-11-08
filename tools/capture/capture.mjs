// Capture d'écran + mesure d'images par seconde de la scène de jeu (mode solo).
// Usage : node tools/capture/capture.mjs <url> <dossier-sortie> <etiquette> [qualite]
// Produit <etiquette>-pc.jpg et <etiquette>-mobile.jpg, et affiche les mesures en JSON.
import { chromium } from "playwright";

const [url = "http://localhost:5173", sortie = ".", etiquette = "capture", qualite = ""] =
  process.argv.slice(2);

const navigateur = await chromium.launch({
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});

async function mesurer(nom, options, ralentissementCpu) {
  const contexte = await navigateur.newContext(options);
  const page = await contexte.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(String(e)));
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  if (ralentissementCpu > 1) {
    const cdp = await contexte.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: ralentissementCpu });
  }
  const cible = new URL(url);
  if (qualite) cible.searchParams.set("qualite", qualite);
  await page.goto(cible.href);
  await page.getByRole("button", { name: /Jouer seul|Play solo/ }).click();
  await page.waitForTimeout(5000);
  const ips = await page.evaluate(
    () =>
      new Promise((fin) => {
        let n = 0;
        const debut = performance.now();
        const f = () => {
          n++;
          if (performance.now() - debut < 4000) requestAnimationFrame(f);
          else fin(Math.round((n * 1000) / (performance.now() - debut)));
        };
        requestAnimationFrame(f);
      }),
  );
  const gpu = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "inconnu";
  });
  await page.screenshot({ path: `${sortie}/${etiquette}-${nom}.jpg`, quality: 88 });
  await contexte.close();
  return { nom, ips, gpu, erreurs };
}

const resultats = [
  await mesurer("pc", { viewport: { width: 1920, height: 1080 } }, 1),
  await mesurer(
    "mobile",
    { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true },
    4,
  ),
];
console.log(JSON.stringify(resultats, null, 2));
await navigateur.close();
