import { TICK_MS } from "@astraelis/net";
import * as THREE from "three";
import { creerCiel } from "./ciel";
import { brancherClavier, commandes, lireAxes } from "./entrees";
import type { SessionJeu } from "./session";
import { construireZone, creerAvatar, versMetres } from "./zone3d";

const COULEURS = ["#f2d39b", "#9bc4f2", "#c9f29b", "#f29bd0"];

/**
 * Démarre le rendu d'une session (solo, hôte ou invité) dans un canvas.
 * Renvoie une fonction d'arrêt.
 */
export function demarrerJeu(canvas: HTMLCanvasElement, session: SessionJeu): () => void {
  const { zone } = session;
  // Inspection manuelle en développement seulement (retiré du build de production).
  if (import.meta.env.DEV) Object.assign(window, { __session: session });

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

  // La simulation avance sur une minuterie, pas sur requestAnimationFrame : un onglet
  // caché suspend le rendu mais l'hôte doit continuer à servir ses invités. Le
  // rattrapage borné garde le temps de simulation juste quand le navigateur ralentit
  // les minuteries (1 s en arrière-plan).
  const avancer = () => {
    const maintenant = performance.now();
    accumulateur += Math.min(maintenant - dernier, 2_000);
    dernier = maintenant;
    while (accumulateur >= TICK_MS) {
      const { ax, az } = lireAxes(commandes);
      session.tick(ax, az);
      accumulateur -= TICK_MS;
    }
  };
  const minuterie = setInterval(avancer, TICK_MS / 2);

  let image = 0;
  const boucle = (maintenant: number) => {
    image = requestAnimationFrame(boucle);
    avancer();
    const alpha = accumulateur / TICK_MS;
    const vus = session.joueurs(alpha);
    for (const [i, j] of vus.entries()) {
      let a = avatars.get(j.id);
      if (!a) {
        a = creerAvatar(j.id === session.idLocal ? COULEURS[0]! : COULEURS[1 + (i % 3)]!);
        avatars.set(j.id, a);
        scene.add(a);
      }
      a.position.x = versMetres(j.x);
      a.position.z = versMetres(j.z);
    }
    for (const [id, a] of avatars) {
      if (!vus.some((j) => j.id === id)) {
        scene.remove(a);
        avatars.delete(id);
      }
    }
    const moi = avatars.get(session.idLocal);
    if (!moi) return;
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
    clearInterval(minuterie);
    observateur.disconnect();
    debranclerClavier();
    session.fermer();
    rendu.dispose();
  };
}
