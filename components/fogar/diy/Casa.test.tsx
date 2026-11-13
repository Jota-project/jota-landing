import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import mensajes from "@/messages/diy.es.json";
import { Casa } from "./Casa";

describe("Casa", () => {
  it("la línea sale de la pieza que habla con el proveedor elegido y dice qué recibe", () => {
    const { container } = render(<NextIntlClientProvider locale="es" messages={mensajes}><Casa /></NextIntlClientProvider>);
    // sin proveedor elegido no promete que nada salga de casa
    expect(screen.getByText(/Algo siempre sale de casa/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/no sale de tu red|en local/);

    const boton = screen.getByRole("button", { name: "ElevenLabs" });
    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/ElevenLabs recibe tu audio/)).toBeInTheDocument();
    const origen = [...container.querySelectorAll("li[data-origen]")].map((li) => li.textContent);
    expect(origen).toEqual(["fogar-transcriber", "fogar-speaker"]);

    fireEvent.click(screen.getByRole("button", { name: "Modelo en la nube" }));
    expect(container.querySelectorAll("li[data-origen]")).toHaveLength(3);

    fireEvent.click(boton);
    fireEvent.click(screen.getByRole("button", { name: "Modelo en la nube" }));
    expect(screen.getByText(/Algo siempre sale de casa/)).toBeInTheDocument();
    expect(container.querySelectorAll("li[data-origen]")).toHaveLength(0);
  });
});
