/** Enlace en el markup de los artículos. `texto` es markup propio (puede llevar <code>), no entrada de usuarios. */
export const a = (href: string, texto: string) => `<a href="${href}" rel="noopener">${texto}</a>`;
