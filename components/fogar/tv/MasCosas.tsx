import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { bloque, h2 } from "./comun";

const P = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, width: 24, height: 24 } as const;

// Un icono de trazo por `icon` de s7.items (los de la página antigua).
const ICONOS: Record<string, ReactNode> = {
  stage: <svg {...P}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>,
  spotify: <svg {...P}><rect x="6" y="3" width="12" height="18" rx="3" /><circle cx="12" cy="14" r="3" /><path d="M12 7h.01" /></svg>,
  reposo: <svg {...P}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /><path d="M17 3v4M15 5h4" /></svg>,
  agents: <svg {...P}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="10" cy="18" r="2.5" /><path d="M8.3 7l7.4 .7M7.2 8.2l2 7.3M16.6 10.2L11.6 16" /></svg>,
  cloud: <svg {...P}><path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 8.5 4.8 4.8 0 0 1 17 18H7Z" /></svg>,
};

/** Bloque 7: más cosas que ya hace. */
export async function MasCosas() {
  const t = await getTranslations("tv.s7");
  const items = t.raw("items") as { title: string; body: string; icon: string }[];
  return (
    <section id="s7" aria-labelledby="tv-t-s7" className={bloque}>
      <h2 id="tv-t-s7" className={h2}>{t("title")}</h2>
      <ul className="mt-12 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it) => (
          <li key={it.icon} className="border-t border-[color:var(--veta)] py-6">
            <span className="text-[color:var(--hueso-suave)]">{ICONOS[it.icon]}</span>
            <h3 className="mt-4 text-[17px] font-semibold leading-[1.3]">{it.title}</h3>
            <p className="mt-2 text-[15px] leading-[1.5] text-[color:var(--hueso-suave)]">{it.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
