import { describe, it, expect, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GlassPanel, type Turn, type TurnState } from "@/components/screen/tv/GlassPanel";
import { ChatPill } from "@/components/screen/tv/ChatPill";
import { createSpringGlass } from "@/components/screen/tv/glass";

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
      <GlassPanel open turns={[turn("1")]} states={states} orb="think" replayLabel="Repetir" />,
    );
    expect(flat(container.querySelector(".tv-u"))).toBe("Pregunta1");
    expect(screen.getByText("Herramienta 1")).toBeInTheDocument();
    expect(screen.getByTestId("tool-spin")).toBeInTheDocument();
    expect(screen.queryByTestId("tool-check")).toBeNull();
    expect(container.querySelector(".tv-j")).toBeNull();
    expect(screen.queryByRole("button", { name: "Repetir" })).toBeNull();
  });

  it("replay button calls onReplay", () => {
    const onReplay = vi.fn();
    const states: TurnState[] = [{ you: true, tool: "done", jota: true }];
    const { container } = render(
      <GlassPanel open turns={[turn("1")]} states={states} orb="idle" onReplay={onReplay} replayLabel="Repetir" />,
    );
    expect(flat(container.querySelector(".tv-j"))).toBe("Respuesta1");
    fireEvent.click(screen.getByRole("button", { name: "Repetir" }));
    expect(onReplay).toHaveBeenCalledTimes(1);
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
        replayLabel="Repetir"
      />,
    );
    expect(flat(container.querySelector(".tv-u"))).toBe("Pregunta1");
    rerender(
      <ChatPill
        open
        turn={turn("2")}
        state={{ you: true, tool: "none", jota: false }}
        orb="listen"
        replayLabel="Repetir"
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
});
