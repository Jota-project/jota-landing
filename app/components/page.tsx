import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Orb } from "@/components/Orb";

const palette: Array<{ name: string; token: string; hex: string; bg: string }> = [
  { name: "Linen",      token: "linen",      hex: "#F6F3F0", bg: "bg-linen" },
  { name: "Linen 2",    token: "linen-2",    hex: "#EFE9E4", bg: "bg-linen-2" },
  { name: "Malva",      token: "malva",      hex: "#7C6AAE", bg: "bg-malva" },
  { name: "Malva soft", token: "malva-soft", hex: "#A99AD1", bg: "bg-malva-soft" },
  { name: "Malva tint", token: "malva-tint", hex: "#E9E3F2", bg: "bg-malva-tint" },
  { name: "Sky",        token: "sky",        hex: "#6E8CC4", bg: "bg-sky" },
  { name: "Sky tint",   token: "sky-tint",   hex: "#E1E8F3", bg: "bg-sky-tint" },
  { name: "Ink",        token: "ink",        hex: "#2A2433", bg: "bg-ink" },
];

export default function ComponentsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-20 px-7 py-16">
      <header>
        <Eyebrow>Jota · Design System "Dusk"</Eyebrow>
        <h1 className="mt-4 font-display text-[clamp(2.6rem,7vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-ink">
          A warm <em className="italic text-malva">companion</em> at home.
        </h1>
        <p className="mt-5 max-w-[34ch] text-lg text-ink-soft">
          Living preview of the Dusk tokens and components.
        </p>
      </header>

      <section>
        <h2 className="mb-2 font-display text-[1.9rem] font-medium tracking-[-0.01em] text-ink">
          Palette
        </h2>
        <p className="mb-7 text-sm text-ink-soft">
          Warm neutral base, malva accent, sky support, ink charcoal.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5">
          {palette.map((c) => (
            <div
              key={c.token}
              className="overflow-hidden rounded-[18px] border border-line bg-white"
            >
              <div className={`h-[88px] ${c.bg}`} />
              <div className="p-2.5">
                <p className="text-[0.82rem] font-semibold text-ink">{c.name}</p>
                <p className="font-sans text-[0.74rem] tracking-[0.02em] text-ink-soft">
                  {c.hex}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-[1.9rem] font-medium tracking-[-0.01em] text-ink">
          Typography
        </h2>
        <p className="mb-7 text-sm text-ink-soft">
          Fraunces (display, warm serif) · Inter (body, clean sans).
        </p>
        <div className="divide-y divide-line">
          {[
            { tag: "Display XL", className: "font-display text-[3rem] font-medium tracking-[-0.02em] leading-none", text: "Ok Jota" },
            { tag: "Display L",  className: "font-display text-[2rem] font-medium tracking-[-0.01em] leading-none", text: "Your home, your voice, in private." },
            { tag: "Body L",     className: "text-[1.15rem] leading-snug text-ink", text: "Jota understands what you say and acts instantly, without sending your voice to the cloud." },
            { tag: "Body M",     className: "text-base text-ink", text: "Full or partial control of your home, exactly how you want to configure it." },
            { tag: "Caption",    className: "text-xs font-semibold uppercase tracking-[0.16em] text-malva", text: "100% local · Real time" },
          ].map((row) => (
            <div key={row.tag} className="flex flex-wrap items-baseline gap-5 py-5">
              <span className="w-[110px] shrink-0 text-xs text-ink-soft">{row.tag}</span>
              <span className={row.className}>{row.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-[1.9rem] font-medium tracking-[-0.01em] text-ink">
          Components
        </h2>
        <p className="mb-7 text-sm text-ink-soft">
          Very rounded corners, soft surfaces, pill-shaped buttons.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="mb-2 font-display text-[1.3rem] font-medium text-ink">Base surface</h3>
            <p className="text-[0.95rem] text-ink-soft">
              Neutral card on linen. The content breathes; color is reserved for what matters.
            </p>
          </Card>
          <Card variant="tint-malva">
            <h3 className="mb-2 font-display text-[1.3rem] font-medium text-ink">Malva accent</h3>
            <p className="text-[0.95rem] text-ink-soft">
              Pale lavender background to highlight without shouting. Jota's warm signature.
            </p>
          </Card>
          <Card variant="tint-sky">
            <h3 className="mb-2 font-display text-[1.3rem] font-medium text-ink">Sky support</h3>
            <p className="text-[0.95rem] text-ink-soft">
              Sky accompanies malva in gradients and states. Neighbors on the color wheel.
            </p>
          </Card>
          <Card>
            <h3 className="mb-2 font-display text-[1.3rem] font-medium text-ink">Actions</h3>
            <p className="mb-[18px] text-[0.95rem] text-ink-soft">
              Pill buttons, clear hierarchy between primary and secondary.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="ghost">Secondary</Button>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-display text-[1.9rem] font-medium tracking-[-0.01em] text-ink">
          Signature element
        </h2>
        <p className="mb-7 text-sm text-ink-soft">
          The "voice orb": malva→sky gradient that pulses while speaking. Jota's face.
        </p>
        <div className="flex flex-wrap items-center gap-7 rounded-[28px] bg-ink p-10">
          <Orb />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-malva-soft">
              Listening
            </p>
            <p className="mt-1.5 max-w-[36ch] text-[0.92rem] text-[#B8B0C4]">
              A single memorable element. On ink background, the orb concentrates the warmth and life of the assistant.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
