/**
 * Mouvement déterministe partagé client/serveur.
 *
 * Toutes les grandeurs sont des ENTIERS (millimètres, millimètres par tick) : aucune
 * opération flottante non exacte (sin, cos, pow) n'entre dans la simulation, ce qui
 * garantit le même résultat sur tous les moteurs JavaScript.
 */

/** Valeur maximale d'un axe d'entrée (joystick quantifié sur 8 bits signés). */
export const AXE_MAX = 127;
/** Vitesse de marche : 4,5 m/s à 20 Hz = 225 mm par tick. */
export const VITESSE_MM_PAR_TICK = 225;
/** Demi-largeur de la boîte de collision d'un joueur (mm). */
export const RAYON_JOUEUR_MM = 350;

export interface EtatJoueur {
  readonly x: number;
  readonly z: number;
}

export interface Entree {
  /** Numéro de séquence croissant, propre à chaque client. */
  readonly seq: number;
  /** Axe horizontal, entier dans [-AXE_MAX, AXE_MAX]. */
  readonly ax: number;
  /** Axe de profondeur, entier dans [-AXE_MAX, AXE_MAX]. */
  readonly az: number;
}

/** Rectangle aligné sur les axes, en millimètres (minimum inclus, maximum exclu). */
export interface Rect {
  readonly minX: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxZ: number;
}

export interface CarteCollision {
  readonly limites: Rect;
  readonly obstacles: readonly Rect[];
}

/** Ramène un axe reçu du réseau dans l'intervalle autorisé (entier). */
export function bornerAxe(v: number): number {
  if (!Number.isFinite(v)) return 0;
  const t = Math.trunc(v);
  return t > AXE_MAX ? AXE_MAX : t < -AXE_MAX ? -AXE_MAX : t;
}

/** Racine carrée entière (plancher), exacte pour tout entier sûr positif. */
export function racineEntiere(n: number): number {
  if (n <= 0) return 0;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r--;
  while ((r + 1) * (r + 1) <= n) r++;
  return r;
}

/**
 * Déplacement voulu pour un tick : la norme de (ax, az) est plafonnée à AXE_MAX
 * pour que la diagonale ne soit pas plus rapide que l'axe.
 */
export function deplacementVoulu(entree: Entree): { dx: number; dz: number } {
  const ax = bornerAxe(entree.ax);
  const az = bornerAxe(entree.az);
  const carre = ax * ax + az * az;
  const plancher = racineEntiere(carre);
  // Racine arrondie vers le haut : garantit |déplacement| <= VITESSE.
  const norme = plancher * plancher === carre ? plancher : plancher + 1;
  const diviseur = norme > AXE_MAX ? norme : AXE_MAX;
  return {
    dx: Math.trunc((ax * VITESSE_MM_PAR_TICK) / diviseur),
    dz: Math.trunc((az * VITESSE_MM_PAR_TICK) / diviseur),
  };
}

function chevauche(x: number, z: number, r: Rect): boolean {
  return (
    x + RAYON_JOUEUR_MM > r.minX &&
    x - RAYON_JOUEUR_MM < r.maxX &&
    z + RAYON_JOUEUR_MM > r.minZ &&
    z - RAYON_JOUEUR_MM < r.maxZ
  );
}

function bornerDansLimites(v: number, min: number, max: number): number {
  const lo = min + RAYON_JOUEUR_MM;
  const hi = max - RAYON_JOUEUR_MM;
  return v < lo ? lo : v > hi ? hi : v;
}

/** Avance sur un seul axe et s'arrête contre le premier obstacle rencontré. */
function avancerAxe(
  depart: number,
  delta: number,
  autre: number,
  axe: "x" | "z",
  carte: CarteCollision,
): number {
  const { limites } = carte;
  let cible =
    axe === "x"
      ? bornerDansLimites(depart + delta, limites.minX, limites.maxX)
      : bornerDansLimites(depart + delta, limites.minZ, limites.maxZ);
  for (const o of carte.obstacles) {
    const x = axe === "x" ? cible : autre;
    const z = axe === "x" ? autre : cible;
    if (!chevauche(x, z, o)) continue;
    const min = axe === "x" ? o.minX : o.minZ;
    const max = axe === "x" ? o.maxX : o.maxZ;
    cible = delta > 0 ? Math.min(cible, min - RAYON_JOUEUR_MM) : Math.max(cible, max + RAYON_JOUEUR_MM);
  }
  // Ne jamais reculer à cause d'un obstacle déjà chevauché au départ.
  return delta > 0 ? Math.max(depart, cible) : delta < 0 ? Math.min(depart, cible) : depart;
}

/** Applique une entrée pour un tick. Fonction pure. */
export function appliquerEntree(etat: EtatJoueur, entree: Entree, carte: CarteCollision): EtatJoueur {
  const { dx, dz } = deplacementVoulu(entree);
  const x = dx === 0 ? etat.x : avancerAxe(etat.x, dx, etat.z, "x", carte);
  const z = dz === 0 ? etat.z : avancerAxe(etat.z, dz, x, "z", carte);
  return { x, z };
}

/** Vrai si la position est valide (dans les limites, hors de tout obstacle). */
export function positionValide(etat: EtatJoueur, carte: CarteCollision): boolean {
  const { limites } = carte;
  if (etat.x - RAYON_JOUEUR_MM < limites.minX || etat.x + RAYON_JOUEUR_MM > limites.maxX) return false;
  if (etat.z - RAYON_JOUEUR_MM < limites.minZ || etat.z + RAYON_JOUEUR_MM > limites.maxZ) return false;
  return !carte.obstacles.some((o) => chevauche(etat.x, etat.z, o));
}
