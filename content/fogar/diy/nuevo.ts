const DIAS = 14;

/**
 * ¿La entrada tiene menos de 14 días? `iso` es AAAA-MM-DD. Se llama desde componentes de servidor.
 * shortcut: se evalúa al renderizar en el servidor; si la página se sirve como estática, el rótulo no caduca hasta el
 * siguiente build/revalidación. Subir a un cálculo en cliente solo si hace falta, cuidando la hidratación.
 */
export function esNueva(iso: string, ahora: Date = new Date()): boolean {
  const dias = (ahora.getTime() - Date.parse(`${iso}T00:00:00Z`)) / 864e5;
  return dias >= 0 && dias < DIAS;
}
