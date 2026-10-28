export const CONTACT_EMAIL = "contacto@jota-project.com";

/** mailto link to the contact inbox with a pre-filled subject (shared by the landing and /jota-screen). */
export function mailtoHref(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
