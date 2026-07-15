import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "@/components/Section";

// next-intl/server uses Next.js request context that doesn't exist in vitest.
// Mock it with a t() backed by the real en.json / es.json so server components
// render with production copy.
vi.mock("next-intl/server", async () => {
  const path = await import("node:path");
  const fs = await import("node:fs/promises");
  const messagesDir = path.resolve(process.cwd(), "messages");
  async function loadLocale(locale: string) {
    const raw = await fs.readFile(path.join(messagesDir, `${locale}.json`), "utf-8");
    return JSON.parse(raw);
  }
  function makeT(namespace: string, messages: Record<string, unknown>) {
    const ns = (messages as Record<string, Record<string, string>>)[namespace];
    return (key: string) => {
      const value = ns?.[key];
      return typeof value === "string" ? value : key;
    };
  }
  return {
    getTranslations: async (namespace: string) => {
      const locale = process.env.TEST_LOCALE ?? "en";
      const messages = await loadLocale(locale);
      return makeT(namespace, messages);
    },
  };
});

function makeT(map: Record<string, string>) {
  return (key: string) => map[key] ?? key;
}

describe("Section pattern", () => {
  it("renders eyebrow, headline and children", () => {
    const t = makeT({ eyebrow: "THE PROBLEM", headline: "Fast." });
    render(
      <Section eyebrow={t("eyebrow")} headline={t("headline")}>
        <p>body</p>
      </Section>,
    );
    expect(screen.getByText("THE PROBLEM")).toHaveClass("text-malva");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Fast.");
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("renders the italic emphasis when provided", () => {
    const t = makeT({ headline: "Not an assistant.", headlineItalic: "An agent." });
    render(
      <Section eyebrow="X" headline={t("headline")} headlineItalic={t("headlineItalic")} />,
    );
    const em = screen.getByText("An agent.");
    expect(em.tagName).toBe("EM");
    expect(em).toHaveClass("italic");
    expect(em).toHaveClass("text-malva");
  });
});

describe("Key copy is reachable through i18n namespaces", () => {
  it("en.json exposes the hero headline", async () => {
    const en = (await import("../messages/en.json")).default;
    expect(en.hero.headline).toBe("Not an assistant.");
    expect(en.hero.headlineItalic).toBe("An agent.");
    expect(en.hero.ctaPrimary).toBe("Let's talk");
  });

  it("es.json exposes the hero headline", async () => {
    const es = (await import("../messages/es.json")).default;
    expect(es.hero.headline).toBe("No un asistente.");
    expect(es.hero.headlineItalic).toBe("Un agente.");
    expect(es.hero.ctaPrimary).toBe("Hablemos");
  });

  it("en.json has the model recommended badge", async () => {
    const en = (await import("../messages/en.json")).default;
    expect(en.model.recommended).toBe("Recommended");
  });

  it("es.json has the model recommended badge", async () => {
    const es = (await import("../messages/es.json")).default;
    expect(es.model.recommended).toBe("Recomendado");
  });

  it("team.members includes both founders in both locales", async () => {
    const en = (await import("../messages/en.json")).default;
    const es = (await import("../messages/es.json")).default;
    expect(en.team.members).toHaveLength(2);
    expect(es.team.members).toHaveLength(2);
    expect(en.team.members[0].name).toBe("Alfonso Garre");
    expect(en.team.members[1].name).toBe("Joan Moreno");
  });

  it("contact namespace exposes emailSubject and waitlistSubject", async () => {
    const en = (await import("../messages/en.json")).default;
    const es = (await import("../messages/es.json")).default;
    expect(en.contact.emailSubject).toBeTruthy();
    expect(es.contact.emailSubject).toBeTruthy();
    expect(en.contact.waitlistSubject).toBeTruthy();
    expect(es.contact.waitlistSubject).toBeTruthy();
  });
});

describe("WhatItCanDo renders 5 cards", () => {
  it("renders exactly 5 cards", async () => {
    const { WhatItCanDo } = await import("@/components/sections/WhatItCanDo");
    // Wrap async server component for testing
    const Element = await WhatItCanDo();
    const { container } = render(<>{Element}</>);
    // 5 cards by the unique card1 text — first one is enough to confirm rendering
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });
});

describe("CloudVsLocal renders Cloud with recommended badge", () => {
  it("renders the English badge text", async () => {
    process.env.TEST_LOCALE = "en";
    const { CloudVsLocal } = await import("@/components/sections/CloudVsLocal");
    const Element = await CloudVsLocal();
    const { container } = render(<>{Element}</>);
    expect(container.textContent).toContain("Recommended");
  });

  it("renders the Spanish badge text", async () => {
    process.env.TEST_LOCALE = "es";
    const { CloudVsLocal } = await import("@/components/sections/CloudVsLocal");
    const Element = await CloudVsLocal();
    const { container } = render(<>{Element}</>);
    expect(container.textContent).toContain("Recomendado");
    delete process.env.TEST_LOCALE;
  });
});
