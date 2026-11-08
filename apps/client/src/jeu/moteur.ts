import { TICK_MS } from "@astraelis/net";
import * as THREE from "three";
import { creerAtmosphere } from "./atmosphere";
import { creerCiel, DIRECTION_LUNE } from "./ciel";
import { brancherClavier, commandes, lireAxes } from "./entrees";
import { ambianceDe } from "./rendu/ambiances";
import { chargerEnvironnement } from "./rendu/environnement";
import { creerChaine } from "./rendu/postprod";
import { REGLAGES, type Palier } from "./rendu/qualite";
import type { SessionJeu } from "./session";
import { construireZone, creerAvatar, versMetres } from "./zone3d";

const DEMI_COTE_OMBRE = 28;

const COULEURS = ["#f2d39b", "#9bc4f2", "#c9f29b", "#f29bd0"];

/**
 * Démarre le rendu d'une session (solo, hôte ou invité) dans un canvas.
 * Renvoie une fonction d'arrêt.
 */
export function demarrerJeu(canvas: HTMLCanvasElement, session: SessionJeu, palier: Palier): () => void {
  const { zone } = session;
  const reglages = REGLAGES[palier];
  const ambiance = ambianceDe(zone.id);
  // Inspection manuelle en développement seulement (retiré du build de production).
  if (import.meta.env.DEV) Object.assign(window, { __session: session });
  const exposerRendu = (r: THREE.WebGLRenderer, s: THREE.Scene) =>
    import.meta.env.DEV && Object.assign(window, { __rendu: r, __scene: s });

  // Avec post-traitement, l'anticrénelage vient du SMAA ; sans, du MSAA natif.
  const rendu = new THREE.WebGLRenderer({
    canvas,
    antialias: !reglages.postTraitement,
    powerPreference: "high-performance",
  });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, reglages.ratioPixelsMax));
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = ambiance.exposition;
  rendu.shadowMap.enabled = reglages.ombres;
  rendu.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(zone.palette.brouillard, ambiance.brouillard);
  scene.environmentIntensity = ambiance.environnement;
  scene.add(new THREE.HemisphereLight("#33449a", "#120c08", 0.35));
  const libererEnvironnement = chargerEnvironnement(rendu, scene, "/hdri/satara_night_1k.hdr");

  // Une seule lumière à ombres : la lune. Sa carte d'ombre suit le joueur (cascade
  // « près » ; au loin, le brouillard masque l'absence d'ombres).
  const lune = new THREE.DirectionalLight(ambiance.lune.couleur, ambiance.lune.intensite);
  lune.castShadow = reglages.ombres;
  if (reglages.ombres) {
    lune.shadow.mapSize.set(reglages.tailleOmbre, reglages.tailleOmbre);
    Object.assign(lune.shadow.camera, {
      left: -DEMI_COTE_OMBRE,
      right: DEMI_COTE_OMBRE,
      top: DEMI_COTE_OMBRE,
      bottom: -DEMI_COTE_OMBRE,
      near: 1,
      far: 120,
    });
    lune.shadow.camera.updateProjectionMatrix();
    lune.shadow.bias = -0.0004;
    lune.shadow.normalBias = 0.03;
    lune.shadow.radius = 3;
  }
  scene.add(lune, lune.target);
  // Lumière de remplissage froide, opposée à la lune et sans ombres : les façades à
  // contre-jour restent lisibles (principe d'éclairage de cinéma).
  const remplissage = new THREE.DirectionalLight("#6f86d6", 0.35);
  remplissage.position.set(25, 30, 60);
  scene.add(remplissage);
  const texelOmbre = (2 * DEMI_COTE_OMBRE) / Math.max(reglages.tailleOmbre, 1);

  const ciel = creerCiel(zone.palette.ciel, zone.palette.brouillard);
  const atmosphere = creerAtmosphere(zone, ambiance, reglages.postTraitement ? 800 : 300);
  const decor = construireZone(
    zone,
    ambiance,
    reglages.ombres,
    Math.min(8, rendu.capabilities.getMaxAnisotropy()),
    !reglages.postTraitement,
  );
  scene.add(ciel.maillage, decor.groupe, atmosphere.groupe);
  const tailleTampon = new THREE.Vector2();

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const chaine = creerChaine(rendu, scene, camera, reglages, ambiance);
  exposerRendu(rendu, scene);
  const avatars = new Map<string, THREE.Mesh>();
  let accumulateur = 0;
  let dernier = performance.now();
  const debranclerClavier = brancherClavier(window);
  const cibleCamera = new THREE.Vector3();
  const reduireMouvements = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const redimensionner = () => {
    const { clientWidth: l, clientHeight: h } = canvas;
    chaine.redimensionner(l, h);
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
    // Centre d'ombre aligné sur la grille des texels : pas de scintillement en marchant.
    const cx = Math.round(moi.position.x / texelOmbre) * texelOmbre;
    const cz = Math.round(moi.position.z / texelOmbre) * texelOmbre;
    lune.target.position.set(cx, 0, cz);
    lune.position.set(cx, 0, cz).addScaledVector(DIRECTION_LUNE, 60);
    ciel.maillage.position.copy(camera.position);
    ciel.avancer(maintenant / 1000);
    decor.avancer(reduireMouvements ? 0 : maintenant / 1000);
    atmosphere.avancer(reduireMouvements ? 0 : maintenant / 1000, rendu.getDrawingBufferSize(tailleTampon).y);
    chaine.rendre();
  };
  image = requestAnimationFrame(boucle);

  return () => {
    cancelAnimationFrame(image);
    clearInterval(minuterie);
    observateur.disconnect();
    debranclerClavier();
    session.fermer();
    libererEnvironnement();
    chaine.liberer();
    ciel.liberer();
    rendu.dispose();
  };
}
