import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

export function Section({
  eyebrow,
  headline,
  headlineItalic,
  lead,
  id,
  children,
}: {
  eyebrow: string;
  headline: string;
  headlineItalic?: string;
  lead?: string;
  id?: string;
  children?: ReactNode;
}) {
  return (
    <div id={id} className="flex flex-col gap-6">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.015em] text-ink">
        {headline}
        {headlineItalic && (
          <>
            {" "}
            <em className="italic text-malva">{headlineItalic}</em>
          </>
        )}
      </h2>
      {lead && (
        <p className="max-w-[60ch] text-lg text-ink-soft">{lead}</p>
      )}
      {children}
    </div>
  );
}