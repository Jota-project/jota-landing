import type { ReactNode } from "react";

type Variant = "base" | "tint-malva" | "tint-sky" | "tint-linen-2";

const variants: Record<Variant, string> = {
  base: "bg-white border border-line",
  "tint-malva": "bg-malva-tint border border-transparent",
  "tint-sky": "bg-sky-tint border border-transparent",
  "tint-linen-2": "bg-linen-2 border border-line",
};

export function Card({
  variant = "base",
  className = "",
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-card p-7 ${variants[variant]} ${className}`.trim()}>
      {children}
    </div>
  );
}
