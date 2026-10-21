import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "../messages/es.json";
import { TrackA } from "@/components/screen/tracks/TrackA";
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

type Geo = { inView: boolean; bottom: number };
/** IntersectionObserver that reports a fixed geometry per scene marker (data-scene). */
function mockIO(scenes: Record<string, Geo>) {
  class IO {
    cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      const scene = (el as HTMLElement).dataset.scene;
      const g = (scene && scenes[scene]) || { inView: true, bottom: 800 };
      this.cb(
        [{ target: el, isIntersecting: g.inView, boundingClientRect: { bottom: g.bottom } } as unknown as IntersectionObserverEntry],
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
    // the TV stage is aria-hidden (TvFrame), so the button is looked up with hidden: true
    fireEvent.click(screen.getByRole("button", { name: s.chat.replay, hidden: true }));
    expect(tv.querySelector('.tv-act[data-on="true"]')).toBeNull();
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
      expect(li.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
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
    expect(html).toContain(s.s8.headline);
    reduce();
    mockIO({});
    const { container } = render(wrap(<TrackD />));
    expect(container.querySelector("#s8")).toHaveAttribute("data-sticky", "false");
    expect(container.querySelector(".tv-reposo")).toHaveAttribute("data-perfil", "noche");
  });
});
