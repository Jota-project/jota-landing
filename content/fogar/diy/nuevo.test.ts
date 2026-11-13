import { describe, expect, it } from "vitest";
import { esNueva } from "./nuevo";

describe("esNueva", () => {
  const f = (d: string) => new Date(`${d}T12:00:00Z`);
  it("es nueva menos de 14 días", () => {
    expect(esNueva("2026-10-27", f("2026-10-27"))).toBe(true);
    expect(esNueva("2026-10-27", f("2026-11-09"))).toBe(true);
  });
  it("deja de serlo a los 14 días y no lo es si es futura", () => {
    expect(esNueva("2026-10-27", f("2026-11-10"))).toBe(false);
    expect(esNueva("2026-10-27", f("2026-10-20"))).toBe(false);
  });
});
