import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassPanel, type Turn, type TurnState } from "@/components/screen/tv/GlassPanel";
import { ChatPill } from "@/components/screen/tv/ChatPill";
import { createSpringGlass } from "@/components/screen/tv/glass";
import { TvFrame } from "@/components/screen/tv/TvFrame";

afterEach(() => {
  vi.unstubAllGlobals();
});

// Words paints each word in its own span with margin (no space nodes)
const flat = (el: Element | null) => (el?.textContent ?? "").replace(/\s/g, "");

const turn = (n: string): Turn => ({
  you: `Pregunta ${n}`,
  tool: { icon: "timer", title: `Herramienta ${n}`, sub: "10 min" },
  jota: `Respuesta ${n}`,
});

describe("GlassPanel", () => {
  it("shows only the said parts", () => {
    const states: TurnState[] = [{ you: true, tool: "run", jota: false }];
    const { container } = render(
      <GlassPanel open turns={[turn("1")]} states={states} orb="think" />,
    );
    expect(flat(container.querySelector(".tv-u"))).toBe("Pregunta1");
    expect(screen.getByText("Herramienta 1")).toBeInTheDocument();
    expect(screen.getByTestId("tool-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-check")).toBeNull();
    expect(container.querySelector(".tv-j")).toBeNull();
    expect(screen.queryByRole("button", { name: "Repetir" })).toBeNull();
  });

  it("the finished panel has no Repetir button (scrolling back up replays it)", () => {
    const states: TurnState[] = [{ you: true, tool: "done", jota: true }];
    const { container } = render(<GlassPanel open turns={[turn("1")]} states={states} orb="idle" />);
    expect(flat(container.querySelector(".tv-j"))).toBe("Respuesta1");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("ChatPill", () => {
  it("keeps only the last turn", () => {
    const { container, rerender } = render(
      <ChatPill
        open
        turn={turn("1")}
        state={{ you: true, tool: "done", jota: true }}
        orb="idle"
      />,
    );
    expect(flat(container.querySelector(".tv-u"))).toBe("Pregunta1");
    rerender(
      <ChatPill
        open
        turn={turn("2")}
        state={{ you: true, tool: "none", jota: false }}
        orb="listen"
      />,
    );
    expect(container.querySelectorAll(".tv-tn")).toHaveLength(1);
    expect(flat(container.querySelector(".tv-u"))).toBe("Pregunta2");
    expect(flat(container)).not.toContain("Pregunta1");
    expect(container.querySelector(".tv-glass")).toHaveAttribute("data-form", "pill");
  });
});

describe("createSpringGlass", () => {
  it("stops its loop", () => {
    let id = 0;
    const raf = vi.fn<(cb: FrameRequestCallback) => number>(() => ++id);
    const caf = vi.fn();
    vi.stubGlobal("requestAnimationFrame", raf);
    vi.stubGlobal("cancelAnimationFrame", caf);
    const [sheet, body, halo] = [0, 1, 2].map(() => document.createElement("div"));
    const g = createSpringGlass(sheet, body, halo, { calm: false });
    expect(raf).toHaveBeenCalledTimes(1);
    raf.mock.calls[0][0](16);
    expect(raf).toHaveBeenCalledTimes(2);
    expect(body.style.width).not.toBe("");
    g.stop();
    expect(caf).toHaveBeenCalled();
    const before = raf.mock.calls.length;
    raf.mock.calls[1][0](32); // a frame already queued must not reschedule
    expect(raf.mock.calls.length).toBe(before);
  });

  /** rAF fake that queues callbacks; flush() runs what is queued (one frame). */
  function frames() {
    let id = 0;
    let q = new Map<number, FrameRequestCallback>();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      q.set(++id, cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (n: number) => void q.delete(n));
    return {
      size: () => q.size,
      flush(now = 16) {
        const run = q;
        q = new Map();
        run.forEach((cb) => cb(now));
      },
    };
  }

  it("pause() stops scheduling frames and resume() picks up where it was", () => {
    const f = frames();
    const [sheet, body, halo] = [0, 1, 2].map(() => document.createElement("div"));
    const g = createSpringGlass(sheet, body, halo, { calm: false });
    f.flush(16);
    expect(f.size()).toBe(1);
    const w = body.style.width;
    g.pause();
    expect(f.size()).toBe(0);
    g.resume();
    expect(f.size()).toBe(1);
    f.flush(32);
    expect(body.style.width).not.toBe("");
    expect(w).not.toBe("");
    g.stop();
  });

  it("calm snaps to the sheet once and stops (no endless loop under reduced motion)", () => {
    const f = frames();
    const [sheet, body, halo] = [0, 1, 2].map(() => document.createElement("div"));
    Object.defineProperties(sheet, {
      offsetLeft: { value: 100 },
      offsetTop: { value: 50 },
      offsetWidth: { value: 640 },
      offsetHeight: { value: 400 },
    });
    const g = createSpringGlass(sheet, body, halo, { calm: true });
    f.flush(16);
    expect(body.style.width).toBe("640px");
    expect(body.style.height).toBe("400px");
    expect(body.style.left).toBe("100px");
    expect(f.size()).toBe(0);
    g.stop();
  });

  it("a glass inside a paused TV schedules no frames; un-pausing starts them", () => {
    const f = frames();
    const states: TurnState[] = [{ you: true, tool: "done", jota: true }];
    const ui = (paused: boolean) => (
      <TvFrame paused={paused}>
        <GlassPanel open turns={[turn("1")]} states={states} orb="idle" />
      </TvFrame>
    );
    const { rerender } = render(ui(true));
    f.flush();
    expect(f.size()).toBe(0);
    rerender(ui(false));
    expect(f.size()).toBe(1);
    f.flush();
    expect(f.size()).toBe(1);
    rerender(ui(true));
    expect(f.size()).toBe(0);
  });
});
