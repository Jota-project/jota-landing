import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "ghost";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  children: ReactNode;
};

const base =
  "inline-flex items-center justify-center rounded-pill px-6 py-3.5 text-sm font-semibold transition-[transform,filter] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-malva";

const variants: Record<Variant, string> = {
  primary:
    "bg-malva text-white hover:-translate-y-px hover:brightness-110",
  ghost:
    "bg-transparent text-ink border-[1.5px] border-line hover:border-malva hover:text-malva",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
