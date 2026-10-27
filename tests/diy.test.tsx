import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

vi.mock("next-intl/server", () => ({ setRequestLocale: () => {} }));

const ANCHORS = ["recorrido", "casa", "limites", "abierto", "home-assistant", "tele", "texto", "resumen", "por-que", "jota-voice", "siguientes"];
const TITLES = {
  index: { es: "Jota, por dentro y en tu casa", en: "Jota, inside out and in your home" },
  article: {
    es: "Cómo está hecho Jota: arquitectura de un agente de voz",
    en: "How Jota is built: the architecture of a voice agent",
  },
};

beforeEach(() => {
  // reduce = true: los textos del diagrama se pintan sin esperar a las transiciones
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

async function renderPage(which: "index" | "article", locale: "es" | "en") {
  const mod =
    which === "index"
      ? await import("@/app/[locale]/diy/page")
      : await import("@/app/[locale]/diy/como-esta-hecho-jota/page");
  const el = await mod.default({ params: Promise.resolve({ locale }) });
  return render(el);
}

describe("DIY", () => {
  for (const locale of ["es", "en"] as const) {
    it(`index renders its title and links the entry (${locale})`, async () => {
      await renderPage("index", locale);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(TITLES.index[locale]);
      expect(screen.getByRole("link", { name: TITLES.article[locale] })).toHaveAttribute("href", "/diy/como-esta-hecho-jota");
      expect(screen.getAllByRole("button", { pressed: true })).toHaveLength(2);
    });

    it(`article renders its title, anchors and links (${locale})`, async () => {
      vi.useFakeTimers();
      const { container } = await renderPage("article", locale);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(TITLES.article[locale]);
      for (const id of ANCHORS) expect(container.querySelector(`#${id}`), id).not.toBeNull();
      const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
      expect(hrefs).toContain("/");
      expect(hrefs).toContain("/diy");
      // el comportamiento cliente ha arrancado; en jsdom todas las secciones miden 0, así que manda la última
      vi.runAllTimers();
      expect(container.querySelector("#dia")).toHaveAttribute("data-state", "siguientes");
      expect(container.querySelector("#tk")).toHaveTextContent(locale === "es" ? "La frase" : "The sentence");
    });
  }

  it("article keeps the same ids in es and en", async () => {
    const ids = async (locale: "es" | "en") => {
      const { container, unmount } = await renderPage("article", locale);
      const out = [...container.querySelectorAll("[id]")].map((e) => e.id).sort();
      unmount();
      return out;
    };
    expect(await ids("en")).toEqual(await ids("es"));
  });

  it("metadata comes from the content of each locale", async () => {
    const { generateMetadata } = await import("@/app/[locale]/diy/como-esta-hecho-jota/page");
    const md = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(md.title).toBe("How Jota is built");
    expect(md.openGraph).toMatchObject({ locale: "en_US" });
  });
});
