import { describe, expect, it } from "vitest";
import { JOUEURS_MAX } from "./constantes";

describe("constantes", () => {
  it("une partie coop compte au plus quatre joueurs", () => {
    expect(JOUEURS_MAX).toBe(4);
  });
});
