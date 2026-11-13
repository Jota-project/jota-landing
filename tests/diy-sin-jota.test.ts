import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { articuloEn } from "@/content/fogar/diy/articulo.en";
import { articuloEs } from "@/content/fogar/diy/articulo.es";
import { indiceEn } from "@/content/fogar/diy/indice.en";
import { indiceEs } from "@/content/fogar/diy/indice.es";
import * as entrada from "@/content/fogar/diy/entrada";

// Todo se llama Fogar: ni en el fuente ni en lo que queda tras interpolar enlaces (REPOS, PROTOCOLO).
const raiz = path.resolve(__dirname, "..");
const dir = path.join(raiz, "content/fogar/diy");
const fuentes = [
  ...readdirSync(dir).map((f) => path.join(dir, f)),
  path.join(raiz, "messages/diy.es.json"),
  path.join(raiz, "messages/diy.en.json"),
];

describe("DIY sin Jota", () => {
  it.each(fuentes.map((f) => [path.relative(raiz, f), f]))("%s no nombra a Jota", (_, f) => {
    expect(readFileSync(f, "utf8")).not.toMatch(/jota/i);
  });

  it("el contenido resuelto tampoco", () => {
    const todo = JSON.stringify([articuloEs, articuloEn, indiceEs, indiceEn, entrada]);
    expect(todo).not.toMatch(/jota/i);
    expect(todo).toContain("fogar-gateway");
  });

  it("los dos idiomas tienen las mismas secciones y la de #casa", () => {
    const ids = (a: typeof articuloEs) => a.secciones.map((s) => s.id);
    expect(ids(articuloEn)).toEqual(ids(articuloEs));
    expect(ids(articuloEs)).toContain("casa");
  });
});
