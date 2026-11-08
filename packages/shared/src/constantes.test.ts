import { describe, expect, it } from "vitest";
import { TICK_HZ, TICK_MS } from "./constantes";

describe("constantes", () => {
  it("le tick dure 50 ms à 20 Hz", () => {
    expect(TICK_HZ).toBe(20);
    expect(TICK_MS).toBe(50);
  });
});
