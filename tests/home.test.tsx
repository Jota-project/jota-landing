import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import { HeroTv, schedule } from "@/components/home/HeroTv";
import { VoiceTile } from "@/components/home/VoiceTile";

function wrap(ui: ReactNode) {
  return (
    <NextIntlClientProvider locale="es" messages={es}>
      {ui}
    </NextIntlClientProvider>
  );
}

/** jsdom has no IntersectionObserver: one that reports every target in view at once. */
function inView(on: boolean) {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
      }
      observe() {
        this.cb(
          [{ isIntersecting: on, boundingClientRect: { bottom: 10 }, rootBounds: null } as unknown as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
    },
  );
}

function reducedMotion(on: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: on && q.includes("reduce"),
    addEventListener() {},
    removeEventListener() {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function paths(o: unknown, p = ""): string[] {
  if (Array.isArray(o)) return [`${p}[${o.length}]`];
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => paths(v, `${p}.${k}`));
  return [p];
}

describe("home copy", () => {
  it("home keys match between es and en", () => {
    expect(paths(es.home).sort()).toEqual(paths(en.home).sort());
  });

  it("never sells what does not exist", () => {
    const all = JSON.stringify([es.home, en.home]);
    expect(all).not.toMatch(/Jota Cloud|Windows|ESP32|very soon|muy pronto|Spotify|jazz/i);
  });

  it("starts with what it is, for anyone, and says where it runs", () => {
    expect(es.home.hero.headline).toMatch(/asistente de voz/);
    expect(es.home.hero.sub).toMatch(/máquina tuya/);
    expect(en.home.hero.sub).toMatch(/Home Assistant, OpenClaw/);
  });
});

describe("HeroTv", () => {
  it("shows the whole answer under reduced motion, with no replay", () => {
    reducedMotion(true);
    inView(true);
    const { container } = render(wrap(<HeroTv />));
    expect(container.querySelector(".hm-tv")).toHaveAttribute("data-step", "5");
    expect(container.querySelector(".tv-glass")).toHaveAttribute("data-open", "true");
    expect(screen.getByTestId("tool-check")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: es.home.hero.replay })).toBeNull();
  });

  it("plays the turn once it is in view: you, the tool, Jota, then idle with a replay", () => {
    reducedMotion(false);
    inView(true);
    vi.useFakeTimers();
    const { container } = render(wrap(<HeroTv />));
    const tv = container.querySelector(".hm-tv")!;
    expect(tv).toHaveAttribute("data-step", "0");
    const gaps = schedule(es.screen.chat.series1You.split(" ").length, es.screen.chat.series1Jota.split(" ").length);
    act(() => vi.advanceTimersByTime(gaps[0] + gaps[1] + 10));
    expect(tv).toHaveAttribute("data-step", "2");
    expect(screen.getByTestId("tool-spin")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(gaps[2] + gaps[3] + gaps[4] + 10));
    expect(tv).toHaveAttribute("data-step", "5");
    expect(screen.getByRole("button", { name: es.home.hero.replay })).toBeInTheDocument();
  });

  it("waits until the TV is in view", () => {
    reducedMotion(false);
    inView(false);
    vi.useFakeTimers();
    const { container } = render(wrap(<HeroTv />));
    act(() => vi.advanceTimersByTime(20000));
    expect(container.querySelector(".hm-tv")).toHaveAttribute("data-step", "0");
  });
});

describe("VoiceTile", () => {
  it("ends with the exchange painted whole under reduced motion", () => {
    reducedMotion(true);
    inView(true);
    const { container } = render(wrap(<VoiceTile />));
    expect(container.querySelector(".hm-voice")).toHaveAttribute("data-phase", "done");
    expect(container.querySelectorAll(".hm-voice-jota .tv-w.in").length).toBe(es.screen.chat.series2Jota.split(" ").length);
    expect(container.querySelector(".orbe")).toHaveAttribute("data-state", "idle");
  });

  it("listens, thinks, talks and rests", () => {
    reducedMotion(false);
    inView(true);
    vi.useFakeTimers();
    const { container } = render(wrap(<VoiceTile />));
    const tile = container.querySelector(".hm-voice")!;
    act(() => vi.advanceTimersByTime(610));
    expect(tile).toHaveAttribute("data-phase", "listen");
    expect(container.querySelector(".orbe")).toHaveAttribute("data-state", "listen");
    act(() => vi.advanceTimersByTime(30000));
    expect(tile).toHaveAttribute("data-phase", "done");
  });
});
