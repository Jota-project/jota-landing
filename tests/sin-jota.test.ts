import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// La web da la migración por terminada: ningún texto visible dice Jota. Única excepción hasta que cambie el dominio: el correo.
const permitido = /contacto@jota-project\.com/g;
const raiz = path.resolve(__dirname, "..");
const archivos = [
  ...readdirSync(path.join(raiz, "messages")).map((f) => path.join("messages", f)),
  "lib/repos.ts",
  "components/fogar/landing/Resto.tsx",
  "components/fogar/sitio/Pie.tsx",
  "components/fogar/sitio/Cabecera.tsx",
  "components/fogar/direcciones/d/DireccionD.tsx",
  "components/fogar/direcciones/d/tele.ts",
];

describe("sin rastro de Jota", () => {
  it.each(archivos)("%s", (f) => {
    const texto = readFileSync(path.join(raiz, f), "utf8").replace(permitido, "");
    expect(texto).not.toMatch(/jota/i);
  });
});
