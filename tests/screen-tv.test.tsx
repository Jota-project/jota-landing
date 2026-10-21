import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "../messages/es.json";
import { TvFrame } from "@/components/screen/tv/TvFrame";
import { Reposo } from "@/components/screen/tv/Reposo";
import { Words } from "@/components/screen/tv/Words";
import { ToolCard } from "@/components/screen/tv/ToolCard";
import { ActivityPill } from "@/components/screen/tv/ActivityPill";
import { Inicio } from "@/components/screen/tv/Inicio";
import { Serie } from "@/components/screen/tv/Serie";
import { MusicaFull } from "@/components/screen/tv/MusicaFull";
import { WebReceta } from "@/components/screen/tv/WebReceta";
import { GrowTile } from "@/components/screen/tv/GrowTile";
import { PairCode } from "@/components/screen/tv/PairCode";

const wrap = (ui: ReactNode) =>
  render(
    <NextIntlClientProvider locale="es" messages={es}>
      {ui}
    </NextIntlClientProvider>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const mockReduced = () =>
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: true,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));

describe("TvFrame", () => {
  it("scales to its width", () => {
    let cb: ResizeObserverCallback = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(c: ResizeObserverCallback) {
          cb = c;
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    render(<TvFrame paused>hola</TvFrame>);
    const box = screen.getByTestId("tv-frame");
    act(() => {
      cb([{ contentRect: { width: 960 } } as ResizeObserverEntry], {} as ResizeObserver);
    });
    expect(box.style.getPropertyValue("--s")).toBe("0.5");
    expect(box).toHaveAttribute("data-paused", "true");
    expect(box.querySelector(".tv-stage")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Reposo", () => {
  it("shows the fixed time and the date", () => {
    wrap(<Reposo layout="rotate" perfil="dia" />);
    expect(screen.getByText("21:40")).toBeInTheDocument();
    expect(screen.getByText(es.screen.tv.date)).toBeInTheDocument();
    expect(screen.getByText(es.screen.tv.song)).toBeInTheDocument();
  });

  it("rotates its layout every 10 s", () => {
    vi.useFakeTimers();
    const { container } = wrap(<Reposo layout="rotate" perfil="dia" />);
    const hora = () => container.querySelector<HTMLElement>(".z-hora")!.style.transform;
    const first = hora();
    act(() => {
      vi.advanceTimersByTime(10700);
    });
    expect(hora()).not.toBe(first);
  });

  it("keeps the talk layout fixed", () => {
    vi.useFakeTimers();
    const { container } = wrap(<Reposo layout="talk" perfil="dia" />);
    const root = container.querySelector(".tv-reposo")!;
    const hora = () => container.querySelector<HTMLElement>(".z-hora")!.style.transform;
    const first = hora();
    act(() => {
      vi.advanceTimersByTime(10700);
    });
    expect(root).toHaveAttribute("data-layout", "talk");
    expect(hora()).toBe(first);
  });

  it("does not stay dimmed when switching to talk mid-leave", () => {
    vi.useFakeTimers();
    const ui = (layout: "rotate" | "talk") => (
      <NextIntlClientProvider locale="es" messages={es}>
        <Reposo layout={layout} perfil="dia" />
      </NextIntlClientProvider>
    );
    const { container, rerender } = render(ui("rotate"));
    act(() => {
      vi.advanceTimersByTime(10200);
    });
    expect(container.querySelector(".tv-reposo")).toHaveAttribute("data-leaving", "true");
    rerender(ui("talk"));
    expect(container.querySelector(".tv-reposo")).toHaveAttribute("data-leaving", "false");
  });

  it("does not rotate with reduced motion", () => {
    vi.useFakeTimers();
    mockReduced();
    const { container } = wrap(<Reposo layout="rotate" perfil="dia" />);
    const hora = () => container.querySelector<HTMLElement>(".z-hora")!.style.transform;
    const first = hora();
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(hora()).toBe(first);
  });
});

describe("Words", () => {
  it("renders all words when not playing", () => {
    const { container } = wrap(<Words text="En la Costa da Morte" play={false} />);
    expect(container.querySelectorAll(".tv-w.in")).toHaveLength(5);
  });

  it("paints all words with reduced motion even while playing", () => {
    mockReduced();
    const { container } = wrap(<Words text="uno dos tres" play />);
    expect(container.querySelectorAll(".tv-w.in")).toHaveLength(3);
  });

  it("reveals words one by one while playing", () => {
    vi.useFakeTimers();
    const { container } = wrap(<Words text="uno dos tres" play gap={100} />);
    expect(container.querySelectorAll(".tv-w.in")).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(container.querySelectorAll(".tv-w.in")).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(container.querySelectorAll(".tv-w.in")).toHaveLength(3);
  });
});

describe("ToolCard", () => {
  it("shows a check when done", () => {
    render(<ToolCard icon="where" title="Buscando" sub="la costa" state="done" />);
    expect(screen.getByTestId("tool-check")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-spin")).toBeNull();
  });
  it("shows a spinner while running", () => {
    render(<ToolCard icon="timer" title="Temporizador" state="run" />);
    expect(screen.getByTestId("tool-spin")).toBeInTheDocument();
  });
});

describe("ActivityPill", () => {
  it("exposes its label and time", () => {
    render(<ActivityPill on label="Cena" time="20:00" progress={0.5} />);
    expect(screen.getByText("Cena")).toBeInTheDocument();
    expect(screen.getByText("20:00")).toBeInTheDocument();
  });
});

describe("TV screens", () => {
  it("Inicio focuses the first tile on El faro with the fixed time", () => {
    wrap(<Inicio />);
    expect(screen.getByText("21:40")).toBeTruthy();
    expect(screen.getAllByText("El faro").length).toBeGreaterThan(0);
    expect(screen.getByTestId("tv-tile-0").getAttribute("data-focus")).toBe("true");
    expect(screen.getByTestId("tv-tile-1").getAttribute("data-focus")).toBe("false");
  });

  it("Inicio hero follows the focus", () => {
    wrap(<Inicio focus={2} />);
    expect(screen.getAllByText("Mareas").length).toBeGreaterThan(1);
  });

  it("Serie shows the show title", () => {
    wrap(<Serie playing progress={0.38} />);
    expect(screen.getByText(/El faro/)).toBeTruthy();
    expect(screen.getByTestId("tv-serie").getAttribute("data-playing")).toBe("true");
  });

  it("MusicaFull compact adds the compact class", () => {
    const { container, rerender } = wrap(<MusicaFull compact />);
    expect(container.querySelector(".tv-musica")!.classList.contains("compact")).toBe(true);
    expect(screen.getByText("Blue in Green")).toBeTruthy();
    rerender(
      <NextIntlClientProvider locale="es" messages={es}>
        <MusicaFull compact={false} />
      </NextIntlClientProvider>,
    );
    expect(container.querySelector(".tv-musica")!.classList.contains("compact")).toBe(false);
  });

  it("WebReceta shows the recipe site and its loading state", () => {
    wrap(<WebReceta loading />);
    expect(screen.getByText("cocinadecasa.example")).toBeTruthy();
    expect(screen.getByTestId("tv-web").getAttribute("data-loading")).toBe("true");
  });

  it("GrowTile full shows its title", () => {
    wrap(<GrowTile phase="full" title="Netflix" sub="Abriendo…" from={{ x: 96, y: 572, scale: 0.206 }} />);
    expect(screen.getByText("Netflix")).toBeTruthy();
    const t = screen.getByTestId("tv-grow");
    expect(t.getAttribute("data-phase")).toBe("full");
    expect(t.style.transform).toBe("none");
  });

  it("GrowTile small starts at the tile position", () => {
    wrap(<GrowTile phase="small" title="Netflix" sub="x" from={{ x: 96, y: 572, scale: 0.206 }} />);
    expect(screen.getByTestId("tv-grow").style.transform).toBe("translate(96px,572px) scale(0.206)");
  });

  it("PairCode shows the code digits", () => {
    wrap(<PairCode code="4821" visibleDigits={2} />);
    const d = screen.getAllByTestId("tv-digit");
    expect(d.map((n) => n.textContent)).toEqual(["4", "8", "2", "1"]);
    expect(d.map((n) => n.getAttribute("data-on"))).toEqual(["true", "true", "false", "false"]);
  });
});
