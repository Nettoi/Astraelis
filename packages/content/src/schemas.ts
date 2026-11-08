import { z } from "zod";

const entierMm = z.number().int().min(-1_000_000).max(1_000_000);

export const SchemaRect = z
  .object({ minX: entierMm, minZ: entierMm, maxX: entierMm, maxZ: entierMm })
  .refine((r) => r.maxX > r.minX && r.maxZ > r.minZ, "rectangle vide ou inversé");

export const SchemaTexteLocalise = z.object({ fr: z.string().min(1), en: z.string().min(1) });

const couleur = z.string().regex(/^#[0-9a-f]{6}$/i, "couleur #rrggbb attendue");

export const SchemaElement = z.object({
  type: z.enum(["batiment", "mur", "eau", "lampadaire", "fontaine"]),
  rect: SchemaRect,
  /** Hauteur de rendu en mm (0 = au sol, ex. l'eau). */
  hauteur: z.number().int().min(0).max(200_000),
  /** Bloque le passage. Un lampadaire peut être décoratif. */
  bloquant: z.boolean().default(true),
});

export const SchemaZone = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nom: SchemaTexteLocalise,
  palette: z.object({ sol: couleur, batiment: couleur, accent: couleur, ciel: couleur, brouillard: couleur }),
  limites: SchemaRect,
  apparitions: z.array(z.object({ x: entierMm, z: entierMm })).min(4),
  elements: z.array(SchemaElement),
});

export type Rect = z.infer<typeof SchemaRect>;
export type ElementZone = z.infer<typeof SchemaElement>;
export type Zone = z.infer<typeof SchemaZone>;
