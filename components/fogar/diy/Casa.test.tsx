import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import mensajes from "@/messages/diy.es.json";
import { Casa } from "./Casa";

describe("Casa", () => {
  it("la línea sale solo hacia el proveedor elegido y dice qué sale de casa", () => {
    render(<NextIntlClientProvider locale="es" messages={mensajes}><Casa /></NextIntlClientProvider>);
    expect(screen.getByText(/no sale de tu red/)).toBeInTheDocument();
    const boton = screen.getByRole("button", { name: "ElevenLabs" });
    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/ElevenLabs recibe tu audio/)).toBeInTheDocument();
    fireEvent.click(boton);
    expect(screen.getByText(/no sale de tu red/)).toBeInTheDocument();
  });
});
