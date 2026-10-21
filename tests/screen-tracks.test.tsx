import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "../messages/es.json";
import { TrackA } from "@/components/screen/tracks/TrackA";
import { SCENE2, SCENE3 } from "@/components/screen/tracks/scriptsA";
import { Words } from "@/components/screen/tv/Words";

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
  });
});
