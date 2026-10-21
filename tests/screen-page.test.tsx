import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "../messages/es.json";
import en from "../messages/en.json";

const pathname = vi.hoisted(() => ({ value: "/" }));

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    usePathname: () => pathname.value,
    useRouter: () => ({ replace: () => {} }),
    Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

vi.mock("next-intl/server", async () => {
  const path = await import("node:path");
  const fs = await import("node:fs/promises");
  return {
    setRequestLocale: () => {},
    getTranslations: async (arg: string | { locale?: string; namespace: string }) => {
      const namespace = typeof arg === "string" ? arg : arg.namespace;
      const locale = process.env.TEST_LOCALE ?? "en";
      const raw = await fs.readFile(
        path.resolve(process.cwd(), "messages", `${locale}.json`),
        "utf-8",
      );
      const ns = JSON.parse(raw)[namespace] as Record<string, unknown>;
      const t = (key: string) => {
        const v = key.split(".").reduce<unknown>(
          (acc, k) => (acc as Record<string, unknown> | undefined)?.[k],
          ns,
        );
        return typeof v === "string" ? v : key;
      };
      t.raw = (key: string) =>
        key.split(".").reduce<unknown>(
          (acc, k) => (acc as Record<string, unknown> | undefined)?.[k],
          ns,
        );
      return t;
    },
  };
});

function paths(obj: unknown, prefix = ""): string[] {
  if (typeof obj === "string") return [prefix];
  if (Array.isArray(obj)) return obj.flatMap((v, i) => paths(v, `${prefix}[${i}]`));
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    paths(v, prefix ? `${prefix}.${k}` : k),
  );
}
function values(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (Array.isArray(obj)) return obj.flatMap(values);
  return Object.values(obj as Record<string, unknown>).flatMap(values);
}
const words = (s: string) => s.trim().split(/\s+/).length;

describe("screen copy", () => {
  it("screen keys match between es and en", () => {
    expect(paths(es.screen).sort()).toEqual(paths(en.screen).sort());
    for (const v of [...values(es.screen), ...values(en.screen)]) {
      expect(v.trim()).not.toBe("");
    }
    expect(es.screen.s7.items).toHaveLength(5);
    expect(en.screen.s7.items).toHaveLength(5);
  });

  it("screen copy respects limits", () => {
    for (const m of [es, en]) {
      for (const [k, v] of Object.entries(m.screen.chat)) {
        if (k.endsWith("Jota")) expect(words(v), `chat.${k}`).toBeLessThan(10);
      }
      for (const [scene, block] of Object.entries(m.screen)) {
        if (!/^s\d$/.test(scene)) continue;
        for (const [k, v] of Object.entries(block as Record<string, unknown>)) {
          if (/^(caption|line)/.test(k) && typeof v === "string") {
            expect(words(v), `${scene}.${k}`).toBeLessThanOrEqual(25);
          }
        }
      }
    }
  });
});

describe("Nav", () => {
  afterEach(() => {
    pathname.value = "/";
  });

  function renderNav(Nav: () => ReactNode) {
    return render(
      <NextIntlClientProvider locale="en" messages={en}>
        <Nav />
      </NextIntlClientProvider>,
    );
  }

  it("Nav points to home sections from the product page", async () => {
    const { Nav } = await import("@/components/Nav");
    pathname.value = "/jota-screen";
    const { unmount } = renderNav(Nav);
    expect(screen.getByRole("link", { name: "What it can do" })).toHaveAttribute(
      "href",
      "/#what",
    );
    expect(screen.getByRole("link", { name: "J-Screen" })).toHaveAttribute(
      "href",
      "/jota-screen",
    );
    unmount();

    pathname.value = "/";
    renderNav(Nav);
    expect(screen.getByRole("link", { name: "What it can do" })).toHaveAttribute(
      "href",
      "#what",
    );
  });
});

describe("product page", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    delete process.env.TEST_LOCALE;
  });

  for (const locale of ["es", "en"] as const) {
    it(`page renders headline and every scene caption (${locale})`, async () => {
      process.env.TEST_LOCALE = locale;
      const messages = locale === "es" ? es : en;
      const { default: Page } = await import("@/app/[locale]/jota-screen/page");
      const el = await Page({ params: Promise.resolve({ locale }) });
      const { container } = render(
        <NextIntlClientProvider locale={locale} messages={messages}>
          {el}
        </NextIntlClientProvider>,
      );
      const s = messages.screen;
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(s.s1.headline);
      for (const scene of ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]) {
        expect(container.querySelector(`section#${scene}`)).not.toBeNull();
      }
      for (const [scene, block] of Object.entries(s)) {
        if (!/^s\d$/.test(scene)) continue;
        for (const [k, v] of Object.entries(block as Record<string, unknown>)) {
          if (/^(caption|line)/.test(k) && typeof v === "string") {
            expect(container.textContent, `${scene}.${k}`).toContain(v);
          }
        }
      }
    });
  }

  const reduce = () =>
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
  async function renderPage(locale: "es" | "en") {
    process.env.TEST_LOCALE = locale;
    const messages = locale === "es" ? es : en;
    const { default: Page } = await import("@/app/[locale]/jota-screen/page");
    const el = await Page({ params: Promise.resolve({ locale }) });
    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        {el}
      </NextIntlClientProvider>,
    );
  }

  it("reduced motion removes sticky tracks", async () => {
    const { container: live, unmount } = await renderPage("es");
    const liveTracks = [...live.querySelectorAll("[data-sticky]")];
    expect(liveTracks).toHaveLength(4);
    expect(liveTracks.filter((el) => el.getAttribute("data-sticky") === "true").length).toBeLessThanOrEqual(4);
    unmount();

    reduce();
    const { container } = await renderPage("es");
    const tracks = [...container.querySelectorAll("[data-sticky]")];
    expect(tracks).toHaveLength(4);
    for (const el of tracks) expect(el).toHaveAttribute("data-sticky", "false");
    const s = es.screen;
    for (const [scene, block] of Object.entries(s)) {
      if (!/^s\d$/.test(scene)) continue;
      for (const [k, v] of Object.entries(block as Record<string, unknown>)) {
        if (/^(caption|line|headline|subhead)/.test(k) && typeof v === "string") {
          expect(container.textContent, `${scene}.${k}`).toContain(v);
        }
      }
    }
    vi.unstubAllGlobals();
  });

  it("language switch keeps the product page", async () => {
    // every value of es.screen that differs from its English counterpart
    const at = (obj: unknown, p: string) =>
      p.split(/\.|\[(\d+)\]/).filter(Boolean).reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj);
    const spanish = paths(es.screen)
      .map((p) => [p, at(es.screen, p) as string, at(en.screen, p) as string] as const)
      .filter(([, a, b]) => a !== b);
    expect(spanish.length).toBeGreaterThan(50);
    for (const reduced of [false, true]) {
      if (reduced) reduce();
      const { container, unmount } = await renderPage("en");
      const attrs = [...container.querySelectorAll("[aria-label],[alt],[title]")]
        .flatMap((el) => ["aria-label", "alt", "title"].map((a) => el.getAttribute(a) ?? ""))
        .join("\n");
      const text = `${container.textContent}\n${attrs}`;
      expect(text).toContain(en.screen.s1.headline);
      for (const [p, v] of spanish) expect(text, `${p} (reduced: ${reduced})`).not.toContain(v);
      unmount();
    }
    vi.unstubAllGlobals();
  });
});
