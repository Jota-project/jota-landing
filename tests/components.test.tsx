import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Eyebrow } from "@/components/Eyebrow";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Hablemos</Button>);
    expect(screen.getByRole("button", { name: "Hablemos" })).toBeInTheDocument();
  });

  it("applies the primary variant by default", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-malva");
  });

  it("applies the ghost variant when requested", () => {
    render(<Button variant="ghost">Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-line");
    expect(screen.getByRole("button")).not.toHaveClass("bg-malva");
  });
});

describe("Card", () => {
  it("renders base variant by default", () => {
    render(<Card>content</Card>);
    expect(screen.getByText("content")).toHaveClass("bg-white");
  });

  it("renders tint-malva variant", () => {
    render(<Card variant="tint-malva">content</Card>);
    expect(screen.getByText("content")).toHaveClass("bg-malva-tint");
  });

  it("renders tint-sky variant", () => {
    render(<Card variant="tint-sky">content</Card>);
    expect(screen.getByText("content")).toHaveClass("bg-sky-tint");
  });
});

describe("Eyebrow", () => {
  it("renders uppercase text in malva", () => {
    render(<Eyebrow>Work in progress</Eyebrow>);
    const el = screen.getByText("Work in progress");
    expect(el).toHaveClass("text-malva");
    expect(el).toHaveClass("uppercase");
  });
});
