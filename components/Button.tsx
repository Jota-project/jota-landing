import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "ghost" | "link";

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
  link:
    "bg-transparent text-malva px-0 py-0 rounded-none underline-offset-4 hover:underline focus-visible:outline-malva",
};

/** Class string of a button, for real <a> elements that must look like one. */
export function buttonClass(variant: Variant = "primary", className = ""): string {
  return `${base} ${variants[variant]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClass(variant, className)}
      {...rest}
    >
      {children}
    </button>
  );
}
