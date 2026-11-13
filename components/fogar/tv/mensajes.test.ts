import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Todo se llama Fogar: ni en los textos ni en las claves de la página de Fogar TV puede quedar «Jota».
describe("messages/tv.*.json", () => {
  for (const l of ["es", "en"]) {
    it(`tv.${l}.json no nombra a Jota`, () => {
      const txt = readFileSync(path.resolve(__dirname, `../../../messages/tv.${l}.json`), "utf8");
      expect(txt).not.toMatch(/jota/i);
      expect(Object.keys(JSON.parse(txt))).toEqual(["tv"]);
    });
  }
});
