import { getTranslations } from "next-intl/server";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";

const icons = [
  // 1: house + wave (laundry + blinds)
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11 L12 4 L21 11 V20 H3 Z" />
      <path d="M7 14 q 2.5 -2 5 0 t 5 0" />
    </svg>
  ),
  // 2: shield + check (alarm + lights)
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 L20 6 V12 q 0 6 -8 9 q -8 -3 -8 -9 V6 Z" />
      <path d="M9 12 l 2 2 l 4 -4" />
    </svg>
  ),
  // 3: envelope (inbox)
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 8 l 9 6 l 9 -6" />
    </svg>
  ),
  // 4: chevron + dot (code / commit)
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="12" r="2" fill="currentColor" />
      <circle cx="18" cy="12" r="2" fill="currentColor" />
      <path d="M8 12 h 8" />
    </svg>
  ),
  // 5: circle + return arrow (memory)
  (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12 a 8 8 0 1 1 4 6.93" />
      <path d="M4 18 v -5 h 5" />
    </svg>
  ),
];

export async function WhatItCanDo() {
  const t = await getTranslations("what");
  const cards = [t("card1"), t("card2"), t("card3"), t("card4"), t("card5")];

  return (
    <Section
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      headlineItalic={t("headlineItalic")}
    >
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((text, i) => (
          <Card
            key={i}
            variant={i % 3 === 1 ? "tint-sky" : i % 3 === 2 ? "tint-malva" : "base"}
            className="flex flex-col gap-4"
          >
            <span className="text-malva w-7 h-7 block">{icons[i]}</span>
            <p className="text-base text-ink leading-snug">{text}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 max-w-[60ch] text-sm text-ink-soft italic">
        {t("closing")}
      </p>
    </Section>
  );
}
