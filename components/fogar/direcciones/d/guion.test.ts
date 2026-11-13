import { describe, expect, it } from "vitest";
import { ALTO_VH, N, TRAMOS, estacionDe, fotogramaDe, pasoBalda } from "./guion";

describe("guion de la dirección D", () => {
  it("el mapa scroll → fotograma es continuo, creciente y llega al último", () => {
    let antes = -1;
    for (let i = 0; i <= ALTO_VH; i++) {
      const f = fotogramaDe(i / ALTO_VH);
      expect(f).toBeGreaterThanOrEqual(antes);
      expect(f - Math.max(antes, 0)).toBeLessThan(1); // sin saltos de más de un fotograma por vh
      antes = f;
    }
    expect(fotogramaDe(0)).toBe(0);
    expect(fotogramaDe(1)).toBe(N - 1);
  });
  it("cada parada empieza en su fotograma", () => {
    for (const t of TRAMOS) expect(Math.floor(fotogramaDe((t.v[0] + 0.01) / ALTO_VH))).toBe(t.f[0]);
  });
  it("la balda nombra sus objetos de uno en uno y el giro no lleva texto", () => {
    expect([640, 660, 710, 760, 810].map(pasoBalda)).toEqual([0, 1, 2, 3, 4]);
    expect(estacionDe(140)).toBeNull();
    expect(estacionDe(0)).toBe("portada");
  });
});
