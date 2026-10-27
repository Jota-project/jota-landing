import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import es from "@/messages/es.json";
import en from "@/messages/en.json";
import { SystemMap, leaving } from "@/components/home/SystemMap";
import { ConversationPanel, schedule } from "@/components/home/ConversationPanel";

function wrap(ui: ReactNode) {
  return (
    <NextIntlClientProvider locale="es" messages={es}>
      {ui}
    </NextIntlClientProvider>
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
    const all = JSON.stringify([es.home, en.home, es.screen, en.screen]);
    expect(all).not.toMatch(/Jota Cloud|Wake word propia|very soon|muy pronto/i);
  });
});

describe("SystemMap · what leaves home", () => {
  it("says nothing leaves when everything is local", () => {
    expect(leaving({ stt: false, llm: false, tts: false, tun: false })).toEqual(["allLocal"]);
  });

  it("keeps transcription (audio) and voice (answer text) apart", () => {
    expect(leaving({ stt: true, llm: false, tts: true, tun: false })).toEqual(["lStt", "lTts"]);
  });

  it("rewrites the caption and moves the provider outside when a switch is on", () => {
    reducedMotion(false);
    render(wrap(<SystemMap mode="border" />));
    expect(screen.getByText(es.home.map.allLocal)).toBeInTheDocument();
    expect(screen.getByText(es.home.map.nothingOut)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(es.home.map.cLlm));
    expect(screen.getByText(es.home.map.lLlm)).toBeInTheDocument();
    expect(screen.getByText(es.home.map.oLlm)).toBeInTheDocument();
    expect(screen.getByText(es.home.map.llmExt)).toBeInTheDocument();
    expect(screen.queryByText(es.home.map.nothingOut)).toBeNull();
  });

  it("shows a piece's step when it is pressed", () => {
    reducedMotion(false);
    render(wrap(<SystemMap mode="route" />));
    fireEvent.click(screen.getByRole("button", { name: /OpenClaw/ }));
    expect(screen.getByText(es.home.map.s4)).toBeInTheDocument();
  });
});

describe("ConversationPanel", () => {
  it("shows the whole example under reduced motion, with no replay", () => {
    reducedMotion(true);
    const { container } = render(wrap(<ConversationPanel />));
    expect(screen.getByText(`«${es.home.talk.said}»`)).toHaveClass("sr-only");
    expect(screen.getByText(es.home.talk.answer)).toHaveClass("sr-only");
    expect(container.querySelector(".hm-tool")).toHaveAttribute("data-state", "done");
    expect(container.querySelector(".hm-panel")).toHaveAttribute("data-lamp", "off");
    expect(screen.queryByRole("button", { name: es.home.talk.again })).toBeNull();
  });

  it("plays from idle to done and turns the light off on the way", () => {
    reducedMotion(false);
    vi.useFakeTimers();
    const { container } = render(wrap(<ConversationPanel />));
    const panel = container.querySelector(".hm-panel")!;
    act(() => vi.advanceTimersByTime(900 + 250));
    expect(panel).toHaveAttribute("data-step", "0");
    expect(panel).toHaveAttribute("data-lamp", "on");
    const total = schedule(es.home.talk.said.split(" ").length, es.home.talk.answer.split(" ").length).reduce((a, b) => a + b);
    act(() => vi.advanceTimersByTime(total + 5000));
    expect(panel).toHaveAttribute("data-step", "5");
    expect(panel).toHaveAttribute("data-lamp", "off");
  });

  it("waits the 1.5 s silence after what you say", () => {
    expect(schedule(6, 7)[1]).toBe(6 * 240 + 1500);
  });
});
