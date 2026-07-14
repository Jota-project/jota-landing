import type { ReactNode } from "react";

type Variant = "base" | "tint-malva" | "tint-sky";

const variants: Record<Variant, string> = {
  base: "bg-white border border-line",
  "tint-malva": "bg-malva-tint border border-transparent",
  "tint-sky": "bg-sky-tint border border-transparent",
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
