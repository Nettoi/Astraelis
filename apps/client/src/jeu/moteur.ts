import { chargerZone, versCarteCollision } from "@astraelis/content";
import { Hote, TICK_MS, type JoueurReseau } from "@astraelis/net";
import * as THREE from "three";
import { creerCiel } from "./ciel";
import { brancherClavier, commandes, lireAxes } from "./entrees";
import { construireZone, creerAvatar, versMetres } from "./zone3d";

const COULEURS = ["#f2d39b", "#9bc4f2", "#c9f29b", "#f29bd0"];

/**
 * Démarre le jeu dans un canvas. Phase 0 : partie solo, l'hôte tourne dans le
 * navigateur (même code que la coop, sans réseau). Renvoie une fonction d'arrêt.
 */
export function demarrerJeu(canvas: HTMLCanvasElement, nom: string): () => void {
  const zone = chargerZone("sarn");
  const hote = new Hote({ id: zone.id, apparitions: zone.apparitions, carte: versCarteCollision(zone) }, nom);

  const rendu = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rendu.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(zone.palette.brouillard, 30, 140);
  scene.add(new THREE.HemisphereLight("#6f83c9", "#3b2a1c", 0.8));
  const lune = new THREE.DirectionalLight("#cfd8ff", 1.4);
  lune.position.set(-35, 55, -100);
  scene.add(lune);
  const ciel = creerCiel(zone.palette.ciel, zone.palette.brouillard);
  scene.add(ciel.maillage, construireZone(zone));

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const avatars = new Map<string, THREE.Mesh>();
  let precedent: JoueurReseau[] = hote.instantane();
  let courant = precedent;
  let seq = 0;
  let accumulateur = 0;
  let dernier = performance.now();
  const debranclerClavier = brancherClavier(window);
  const cibleCamera = new THREE.Vector3();
  const reduireMouvements = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const redimensionner = () => {
    const { clientWidth: l, clientHeight: h } = canvas;
    rendu.setSize(l, h, false);
    camera.aspect = l / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };
  const observateur = new ResizeObserver(redimensionner);
  observateur.observe(canvas);
  redimensionner();

  let image = 0;
  const boucle = (maintenant: number) => {
    image = requestAnimationFrame(boucle);
    accumulateur += Math.min(maintenant - dernier, 250);
    dernier = maintenant;
    while (accumulateur >= TICK_MS) {
      const { ax, az } = lireAxes(commandes);
      hote.entreeLocale({ seq: ++seq, ax, az });
      precedent = courant;
      courant = hote.tick();
      accumulateur -= TICK_MS;
    }
    const alpha = accumulateur / TICK_MS;
    for (const [i, j] of courant.entries()) {
      let a = avatars.get(j.id);
      if (!a) {
        a = creerAvatar(COULEURS[i % COULEURS.length]!);
        avatars.set(j.id, a);
        scene.add(a);
      }
      const p = precedent.find((x) => x.id === j.id) ?? j;
      a.position.x = versMetres(p.x + (j.x - p.x) * alpha);
      a.position.z = versMetres(p.z + (j.z - p.z) * alpha);
    }
    const moi = avatars.get(courant[0]!.id)!;
    cibleCamera.set(moi.position.x, 5.5, moi.position.z + 11);
    camera.position.lerp(cibleCamera, reduireMouvements ? 1 : 0.12);
    camera.lookAt(moi.position.x, 3.2, moi.position.z - 12);
    ciel.maillage.position.copy(camera.position);
    ciel.avancer(maintenant / 1000);
    rendu.render(scene, camera);
  };
  image = requestAnimationFrame(boucle);

  return () => {
    cancelAnimationFrame(image);
    observateur.disconnect();
    debranclerClavier();
    rendu.dispose();
  };
}
