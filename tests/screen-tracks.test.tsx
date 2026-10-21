import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "../messages/es.json";
import { readFileSync } from "node:fs";
import path from "node:path";
import { TrackA, growAt, sceneProgress } from "@/components/screen/tracks/TrackA";
import { Scene2Tv } from "@/components/screen/tracks/ScenesA";
import { SCENE2, SCENE3 } from "@/components/screen/tracks/scriptsA";
import { Words } from "@/components/screen/tv/Words";
import { KickContext, TurnView, type Turn } from "@/components/screen/tv/GlassPanel";
import { TrackB, digitsAt, phaseOf } from "@/components/screen/tracks/TrackB";
import { TvB } from "@/components/screen/tracks/ScenesB";
import { TrackC } from "@/components/screen/tracks/TrackC";
import { NIGHT_AT, TrackD, perfilAt } from "@/components/screen/tracks/TrackD";
import { MoreList } from "@/components/screen/MoreList";
import { CONTACT_EMAIL, mailtoHref } from "@/lib/contact";
import { MandoPair } from "@/components/screen/phone/MandoPair";
import { MandoRemote } from "@/components/screen/phone/MandoRemote";

const s = es.screen;
const wrap = (ui: ReactNode) => (
  <NextIntlClientProvider locale="es" messages={es}>
    {ui}
  </NextIntlClientProvider>
);
// Words paints each word in its own span (no space nodes)
const flat = (t: string | null | undefined) => (t ?? "").replace(/\s/g, "");

type Geo = { inView: boolean; bottom: number; rootTop?: number };
/** IntersectionObserver that reports a fixed geometry per scene marker (data-scene). */
function mockIO(scenes: Record<string, Geo>) {
  class IO {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      const scene = (el as HTMLElement).dataset.scene ?? "_";
      const g = scenes[scene] || { inView: true, bottom: 800 };
      this.cb(
        [{ target: el, isIntersecting: g.inView, boundingClientRect: { bottom: g.bottom }, rootBounds: g.rootTop === undefined ? null : { top: g.rootTop } } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", IO);
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
}

/** Like mockIO, but the geometry can change later (the reader scrolls to another scene). */
function mockMovableIO(start: Record<string, Geo>) {
  const seen: { el: Element; cb: IntersectionObserverCallback; io: unknown }[] = [];
  let scenes = start;
  const fire = (o: (typeof seen)[number]) => {
    const scene = (o.el as HTMLElement).dataset.scene;
    const g = (scene && scenes[scene]) || { inView: true, bottom: 800 };
    o.cb(
      [{ target: o.el, isIntersecting: g.inView, boundingClientRect: { bottom: g.bottom }, rootBounds: g.rootTop === undefined ? null : { top: g.rootTop } } as unknown as IntersectionObserverEntry],
      o.io as IntersectionObserver,
    );
  };
  class IO {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      const o = { el, cb: this.cb, io: this };
      seen.push(o);
      fire(o);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", IO);
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  return {
    move(next: Record<string, Geo>) {
      scenes = next;
      seen.forEach(fire);
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("scriptsA", () => {
  it("uses the planned event ids in order", () => {
    expect(SCENE2.map((e) => e.id)).toEqual([
      "you1", "tool1", "toolDone1", "jota1", "you2", "tool2", "toolDone2", "jota2", "activity",
    ]);
    expect(SCENE3.map((e) => e.id)).toEqual([
      "you1", "tool1", "music", "toolDone1", "jota1", "you2", "tool2", "grow", "web", "toolDone2", "jota2",
    ]);
    for (const sc of [SCENE2, SCENE3]) {
      const at = sc.map((e) => e.at);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
    }
  });
});

describe("Words onWord", () => {
  it("calls onWord once per word as it appears (the glass kick)", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const onWord = vi.fn();
    const { rerender } = render(<Words text="Hecho, te aviso." play gap={100} onWord={onWord} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onWord).toHaveBeenCalledTimes(3);
    // a new callback identity does not restart the words
    rerender(<Words text="Hecho, te aviso." play gap={100} onWord={() => {}} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onWord).toHaveBeenCalledTimes(3);
  });
});

describe("glass kick", () => {
  it("kicks 1 when a tool starts and when it ends, only on the active turn", () => {
    const kick = vi.fn();
    const turn: Turn = { you: "Pon jazz", tool: { icon: "music", title: "Reproducir" }, jota: "Ahí va." };
    const view = (tool: "none" | "run" | "done", active = true) => (
      <KickContext.Provider value={kick}>
        <TurnView turn={turn} state={{ you: true, tool, jota: false }} active={active} compact={false} />
      </KickContext.Provider>
    );
    const { rerender } = render(view("none"));
    expect(kick).not.toHaveBeenCalled();
    rerender(view("run"));
    expect(kick).toHaveBeenCalledTimes(1);
    expect(kick).toHaveBeenLastCalledWith(1);
    rerender(view("done"));
    expect(kick).toHaveBeenCalledTimes(2);
    expect(kick).toHaveBeenLastCalledWith(1);
    kick.mockClear();
    render(view("done", false));
    expect(kick).not.toHaveBeenCalled();
  });
});

describe("TrackA", () => {
  it("TrackA shows scene 2 final state when mounted past it", () => {
    // scenes 1 and 2 are above the viewport, scene 3 is on screen
    mockIO({ "1": { inView: false, bottom: -2000 }, "2": { inView: false, bottom: -10 }, "3": { inView: true, bottom: 900 } });
    const { container } = render(wrap(<TrackA />));
    const s2 = container.querySelector("section#s2")!;
    const said = flat(s2.textContent);
    for (const line of [s.chat.series1You, s.chat.series1Jota, s.chat.series2You, s.chat.series2Jota]) {
      expect(said).toContain(flat(line));
    }
    expect(said).toContain(flat(`${s.tv.activityLabel} · ${s.tv.activityTime}`));
    // the activity born in scene 2 stays on the TV
    const tv = screen.getByTestId("tv-frame");
    expect(tv.querySelector('.tv-act[data-on="true"]')).not.toBeNull();
    expect(tv.querySelector(".tv-act")).toHaveTextContent(s.tv.activityTime);
  });

  it("plays scene 2 to its final frame inside the TV and offers Repetir", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    mockIO({ "1": { inView: false, bottom: -10 }, "2": { inView: true, bottom: 1200 }, "3": { inView: false, bottom: 3000 } });
    const { container } = render(wrap(<TrackA />));
    const tv = screen.getByTestId("tv-frame");
    expect(tv.querySelector('.tv-act[data-on="true"]')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByTestId("tv-serie")).toBeInTheDocument();
    expect(flat(tv.querySelector(".tv-glass[data-form=pill]")?.textContent)).toContain(flat(s.chat.series2Jota));
    expect(tv.querySelector('.tv-act[data-on="true"]')).not.toBeNull();
    // the second caption entered with the activity
    expect(container.querySelector('section#s2 [data-phase="2"]')).toHaveAttribute("data-on", "true");
    // Repetir is a real button outside the aria-hidden canvas, so assistive tech reaches it
    const replay = screen.getByRole("button", { name: s.chat.replay });
    expect(replay.closest('[aria-hidden="true"]')).toBeNull();
    expect(tv.querySelector(".tv-stage")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(replay);
    expect(tv.querySelector('.tv-act[data-on="true"]')).toBeNull();
  });

  it("leaving the track past scene 3 keeps scene 3 on the TV (does not flip back to scene 1)", () => {
    // the scene markers use a zero-height root across the middle of the viewport (rootBounds.top = innerHeight/2)
    const mid = 450;
    const io = mockMovableIO({
      "1": { inView: false, bottom: -2000, rootTop: mid },
      "2": { inView: false, bottom: -10, rootTop: mid },
      "3": { inView: true, bottom: 900, rootTop: mid },
    });
    const { container } = render(wrap(<TrackA />));
    const ta = container.querySelector(".ta")!;
    expect(ta).toHaveAttribute("data-active", "3");
    // s3 crosses the middle line on its way up: not intersecting, its bottom right at the line
    act(() =>
      io.move({
        "1": { inView: false, bottom: -3000, rootTop: mid },
        "2": { inView: false, bottom: -1000, rootTop: mid },
        "3": { inView: false, bottom: mid, rootTop: mid },
      }),
    );
    expect(ta).toHaveAttribute("data-active", "3");
  });

  it("the activity ring keeps counting down from scene 2 into scene 3", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    const io = mockMovableIO({ "1": { inView: false, bottom: -10 }, "2": { inView: true, bottom: 1200 }, "3": { inView: false, bottom: 3000 } });
    render(wrap(<TrackA />));
    const ring = () => Number(screen.getByTestId("tv-frame").querySelector(".tv-act circle.r")!.getAttribute("style")!.match(/stroke-dashoffset:\s*([\d.]+)/)![1]);
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    // the activity is born at the end of the script; then its ring counts down once a second
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    const inScene2 = ring();
    expect(inScene2).toBeGreaterThan(0);
    act(() => io.move({ "1": { inView: false, bottom: -2000 }, "2": { inView: false, bottom: -10 }, "3": { inView: true, bottom: 900 } }));
    expect(screen.getByTestId("tv-frame").querySelector('.tv-act[data-on="true"]')).not.toBeNull();
    expect(ring()).toBeGreaterThanOrEqual(inScene2);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(ring()).toBeGreaterThan(inScene2);
  });

  it("scene 2: the phone's orb lights up in a corner of the TV while you talk (you talk to the phone)", () => {
    const chip = (done: string[], finished = false) => {
      const { container, unmount } = render(
        wrap(<Scene2Tv done={new Set(done)} finished={finished} animate={false} grow="gone" live={false} ring={1} />),
      );
      const el = container.querySelector('[data-testid="tv-phone-listen"]');
      const on = el?.getAttribute("data-on");
      unmount();
      return on;
    };
    expect(chip([])).toBe("false");
    expect(chip(["you1"])).toBe("true");
    expect(chip(["you1", "tool1"])).toBe("false");
    expect(chip(["you1", "tool1", "toolDone1", "jota1", "you2"])).toBe("true");
    expect(chip(SCENE2.map((e) => e.id), true)).toBe("false");
    // final frame without JS: there, at rest
    const html = renderToString(
      wrap(<Scene2Tv done={new Set(SCENE2.map((e) => e.id))} finished animate={false} grow="gone" live={false} ring={1} />),
    );
    expect(html).toMatch(/data-testid="tv-phone-listen"[^>]*data-on="false"|data-on="false"[^>]*data-testid="tv-phone-listen"/);
  });

  it("scene 3: the activity moves out of the way once the recipe web is open", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    mockIO({ "1": { inView: false, bottom: -2000 }, "2": { inView: false, bottom: -10 }, "3": { inView: true, bottom: 900 } });
    render(wrap(<TrackA />));
    const tv = screen.getByTestId("tv-frame");
    expect(tv.querySelector('.ta-act[data-web="true"]')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByTestId("tv-web")).toBeInTheDocument();
    expect(tv.querySelector('.ta-act[data-web="true"]')).not.toBeNull();
  });

  it("the growing tile has the gradient of «El faro» on Inicio", () => {
    render(wrap(<Scene2Tv done={new Set()} finished={false} animate={false} grow="small" live={false} ring={1} />));
    const tile = screen.getByTestId("tv-tile-0");
    expect(tile).toHaveTextContent(s.tv.showTitle);
    expect(screen.getByTestId("tv-grow").style.background).toBe(tile.style.background);
  });

  it("growAt follows scene 2 on desktop and mobile heights", () => {
    // svh in px, scene heights (svh) and the TV block above the scenes on mobile (px)
    const layouts = [
      { vh: 900, s: [120, 260, 200], above: 0 },
      { vh: 812, s: [90, 200, 150], above: 210 },
      { vh: 667, s: [90, 200, 150], above: 210 },
    ];
    for (const { vh, s: [h1, h2, h3], above } of layouts) {
      const u = vh / 100;
      const geo = { trackH: above + (h1 + h2 + h3) * u, viewH: vh, top: above + h1 * u, height: h2 * u };
      const span = geo.trackH - vh;
      const atScroll = (y: number) => growAt(sceneProgress(y / span, geo));
      // scene 2 becomes active when its top crosses the middle of the viewport
      const active = geo.top - vh / 2;
      expect(atScroll(active - 1)).toBe("hidden");
      expect(atScroll(active + 0.06 * geo.height)).toBe("small");
      expect(atScroll(active + 0.1 * geo.height)).toBe("full");
      expect(atScroll(active + 0.2 * geo.height)).toBe("gone");
    }
    // no layout yet (jsdom, first frame): straight to the series
    expect(growAt(sceneProgress(0, { trackH: 0, viewH: 800, top: 0, height: 0 }))).toBe("gone");
  });

  it("reduced motion: scene 1 on linen, scenes 2 and 3 on dusk", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    mockIO({});
    const { container } = render(wrap(<TrackA />));
    expect(container.querySelector(".ta-still")).not.toBeNull();
    expect(container.querySelector("section#s1")).toHaveAttribute("data-dark", "false");
    expect(container.querySelector("section#s2")).toHaveAttribute("data-dark", "true");
    expect(container.querySelector("section#s3")).toHaveAttribute("data-dark", "true");
  });

  it("TrackA renders static frames without JS-driven state", () => {
    const html = renderToString(wrap(<TrackA />));
    expect(html).toContain(s.s1.headline);
    for (const text of [s.s1.subhead, s.s1.caption, s.s2.caption1, s.s2.caption2, s.s3.caption1, s.s3.caption2]) {
      expect(html).toContain(text);
    }
    expect(html).toContain("21:40");
    for (const id of ["s1", "s2", "s3"]) expect(html).toContain(`id="${id}"`);
    // the server frame is scene 1 (idle screen): no conversation has been said yet
    expect(html).not.toContain(s.chat.series1Jota);
    // no JS: the page starts in lino with ink text (no data-dark, no dusk yet)
    expect(html).not.toContain('data-dark="true"');
  });
});

describe("TrackB", () => {
  it("MandoPair shows typed digits", () => {
    const { container, rerender } = render(wrap(<MandoPair digits={2} code="4821" paired={false} />));
    const slots = [...container.querySelectorAll("[data-slot]")];
    expect(slots).toHaveLength(4);
    // typed digits show, the rest are placeholders (not hidden digits)
    expect(slots.map((el) => el.textContent).join("")).toBe("48··");
    expect(container.textContent).not.toContain(s.s5.paired);
    rerender(wrap(<MandoPair digits={4} code="4821" paired />));
    expect([...container.querySelectorAll("[data-slot]")].map((el) => el.textContent).join("")).toBe("4821");
    expect(container.textContent).toContain(s.s5.paired);
  });

  it("TvB shows the full code on the TV from the start of the pairing", () => {
    const { container } = render(wrap(<TvB phase="pair" playing={false} />));
    expect(container.querySelectorAll('[data-testid="tv-digit"][data-on="true"]')).toHaveLength(4);
  });

  it("TrackB maps progress to phases", () => {
    expect(phaseOf(0)).toBe("trackpad");
    expect(phaseOf(0.2)).toBe("controls");
    expect(phaseOf(0.4)).toBe("type");
    expect(phaseOf(0.5)).toBe("talk");
    expect(phaseOf(0.6)).toBe("pair");
    expect(phaseOf(0.9)).toBe("roles");
    expect(phaseOf(1)).toBe("roles");
    expect(digitsAt(0.5)).toBe(0);
    expect(digitsAt(0.55)).toBe(0);
    expect(digitsAt(0.625)).toBe(1);
    expect(digitsAt(0.7)).toBe(2);
    expect(digitsAt(0.85)).toBe(4);
    expect(digitsAt(0.9)).toBe(4);
    expect(digitsAt(1)).toBe(4);
  });

  it("MandoRemote has the three app shortcuts", () => {
    const { container } = render(wrap(<MandoRemote focus="type" cursor={{ x: 0.5, y: 0.5 }} />));
    const apps = [...container.querySelectorAll("[data-app]")];
    expect(apps.map((a) => a.getAttribute("data-app"))).toEqual(["spotify", "netflix", "youtube"]);
    for (const a of apps) expect(a.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("Spotify");
    expect(container.textContent).toContain("Netflix");
    expect(container.textContent).toContain("YouTube");
    expect(container.textContent).toContain(s.remote.room);
    expect(container.textContent).toContain(s.remote.type);
    expect(container.querySelector('[data-focus="type"]')).not.toBeNull();
    // a visual copy: nothing focusable inside the phone
    expect(container.querySelector("button")).toBeNull();
  });

  it("reduced motion: no sticky, code shown in full, paired and role cards", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));
    mockIO({});
    const { container } = render(wrap(<TrackB />));
    const track = container.querySelector("[data-sticky]");
    expect(track).toHaveAttribute("data-sticky", "false");
    const s5 = container.querySelector("section#s5")!;
    expect([...s5.querySelectorAll('[data-testid="tv-digit"][data-on="true"]')]).toHaveLength(4);
    expect([...s5.querySelectorAll("[data-slot]")].map((el) => el.textContent).join("")).toBe("4821");
    expect(s5.textContent).toContain(s.s5.paired);
    for (const k of ["admin", "member", "guest", "guestExpiry"] as const) expect(s5.textContent).toContain(s.s5[k]);
    expect(container.querySelector("section#s4")).not.toBeNull();
  });

  it("TrackB renders readable text without JS", () => {
    const html = renderToString(wrap(<TrackB />));
    for (const id of ["s4", "s5"]) expect(html).toContain(`id="${id}"`);
    for (const text of [s.s4.caption1, s.s4.caption2, s.s5.caption1, s.s5.caption2, s.s5.admin, s.s5.member, s.s5.guest, s.s5.guestExpiry]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('data-sticky="true"');
  });
});

describe("TrackC / MoreList / TrackD", () => {
  const reduce = () =>
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }));

  it("TrackC marks the installer as coming soon", () => {
    const { container } = render(wrap(<TrackC />));
    expect(screen.getByTestId("soon")).toHaveTextContent(s.s6.soon);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).toHaveAttribute("aria-label", s.s6.alt);
    expect(svg.querySelectorAll("text")).toHaveLength(8);
    for (const k of ["listen", "think", "answer", "gateway"] as const) expect(svg.textContent).toContain(s.s6[k]);
    for (const l of [s.s6.line1, s.s6.line2, s.s6.network]) expect(container.textContent).toContain(l);
  });

  it("TrackC renders readable text and the full drawing without JS", () => {
    const html = renderToString(wrap(<TrackC />));
    expect(html).toContain('id="s6"');
    for (const l of [s.s6.line1, s.s6.line2, s.s6.soon, s.s6.network]) expect(html).toContain(l);
    expect(html).toContain('data-sticky="true"');
  });

  it("TrackC reduced motion: no sticky, drawing finished", () => {
    reduce();
    const { container } = render(wrap(<TrackC />));
    const track = container.querySelector("#s6")!;
    expect(track).toHaveAttribute("data-sticky", "false");
    expect((track as HTMLElement).style.getPropertyValue("--p")).toBe("1");
  });

  it("MoreList renders five items", () => {
    const { container } = render(wrap(<MoreList />));
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(5);
    items.forEach((li, i) => {
      expect(li.textContent).toContain(s.s7.items[i].title);
      expect(li.textContent).toContain(s.s7.items[i].body);
      expect(s.s7.items[i].icon).toBeTruthy();
      expect(li.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("TrackD pauses its TV off screen", () => {
    mockIO({ "8": { inView: false, bottom: 3000 } });
    render(wrap(<TrackD />));
    expect(screen.getByTestId("tv-frame")).toHaveAttribute("data-paused", "true");
  });

  it("TrackB pauses the TV and the phone's ambient orbs off screen", () => {
    mockIO({ _: { inView: false, bottom: 3000 } });
    const { container } = render(wrap(<TrackB />));
    // [data-paused=true] pauses every animation below it (the phone's .mn-orb included)
    const root = container.querySelector(".tbk")!;
    expect(root).toHaveAttribute("data-paused", "true");
    expect(root.querySelector(".mn-orb")).not.toBeNull();
  });

  it("TrackD CTAs use the contact mailto links", () => {
    const { container } = render(wrap(<TrackD />));
    const links = [...container.querySelectorAll("#s8 a")] as HTMLAnchorElement[];
    const byText = (txt: string) => links.find((a) => a.textContent === txt)!;
    expect(byText(s.s8.ctaWaitlist).getAttribute("href")).toBe(mailtoHref(es.contact.waitlistSubject));
    expect(byText(s.s8.ctaTalk).getAttribute("href")).toBe(mailtoHref(es.contact.emailSubject));
    expect(byText(s.s8.ctaWaitlist).getAttribute("href")).toMatch(new RegExp(`^mailto:${CONTACT_EMAIL}\\?subject=`));
    expect(container.querySelector("a button")).toBeNull();
    expect(container.querySelector('a[href="/"]')).toHaveTextContent(s.s8.back);
    expect(container.textContent).toContain(s.s8.headline);
    expect(container.textContent).toContain(s.s8.line);
  });

  it("TrackD turns evening into night by progress", () => {
    expect(perfilAt(0)).toBe("tarde");
    expect(perfilAt(NIGHT_AT - 0.01)).toBe("tarde");
    expect(perfilAt(1)).toBe("noche");
  });

  it("TrackD: server render shows the TV at night; reduced motion has no sticky", () => {
    const html = renderToString(wrap(<TrackD />));
    expect(html).toContain('data-perfil="noche"');
    expect(html).toContain('data-layout="rotate"');
    expect(html).toContain(s.s8.headline);
    reduce();
    mockIO({});
    const { container } = render(wrap(<TrackD />));
    expect(container.querySelector("#s8")).toHaveAttribute("data-sticky", "false");
    expect(container.querySelector(".tv-reposo")).toHaveAttribute("data-perfil", "noche");
    expect(container.querySelector(".tv-reposo")).toHaveAttribute("data-layout", "rotate");
  });
});

describe("no-JS and CSS fallbacks", () => {
  const css = (f: string) => readFileSync(path.resolve(process.cwd(), "components/screen", f), "utf-8");
  const all = () => ["screen-tv.css", "screen-tv-screens.css", "screen-track-a.css", "screen-track-b.css", "screen-end.css"].map(css).join("\n");

  it("TV and phone canvases scale with container units, without JS", () => {
    const tv = css("screen-tv.css");
    expect(tv).toMatch(/\.tv-vp\{[^}]*container-type:inline-size/);
    expect(tv).toMatch(/@supports[^{]*atan2[^{]*\{\s*\.jscreen \.tv-stage\{transform:scale\(tan\(atan2\(100cqw,1920px\)\)\)/);
    const b = css("screen-track-b.css");
    expect(b).toMatch(/\.ph-vp\{[^}]*container-type:inline-size/);
    expect(b).toMatch(/@supports[^{]*atan2[^{]*\{[^@]*\.ph-screen\{[^}]*tan\(atan2\(100cqw,390px\)\)/);
  });

  it("sections keep their heights before hydration (no layout jump)", () => {
    for (const rule of all().matchAll(/:not\(\[data-hydrated\]\)[^{]*\{([^}]*)\}/g)) {
      expect(rule[1], rule[0]).not.toMatch(/min-height:0|height:auto/);
    }
  });

  it("the flying digits only use min() where it exists", () => {
    const b = css("screen-track-b.css");
    expect(b).not.toMatch(/\.tb-fly span\{[^}]*--f:clamp[^}]*opacity:calc\(min/);
    expect(b).toMatch(/@supports \(opacity:min\(1,1\)\)\{[^@]*\.tb-fly span\{opacity:calc\(min/);
  });

  it("screen styles are split per area", () => {
    for (const f of ["screen-tv.css", "screen-tv-screens.css", "screen-track-a.css", "screen-track-b.css", "screen-end.css"]) {
      expect(css(f).split("\n").length, f).toBeLessThan(300);
    }
  });
});
