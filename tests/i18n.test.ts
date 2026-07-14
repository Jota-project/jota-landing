import { describe, it, expect } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing", () => {
  it("declares English and Spanish as supported locales", () => {
    expect(routing.locales).toEqual(["en", "es"]);
  });

  it("defaults to English", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("uses no URL prefix (cookie + Accept-Language negotiation only)", () => {
    expect(routing.localePrefix).toBe("never");
  });
});
