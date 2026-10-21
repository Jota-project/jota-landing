export const CONTACT_EMAIL = "alfonsogarrelopez@gmail.com";

/** mailto link to the founder's inbox with a pre-filled subject (shared by the landing and /jota-screen). */
export function mailtoHref(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
