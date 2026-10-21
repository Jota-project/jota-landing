"use client";

import { useTranslations } from "next-intl";

const ROLES = [
  { k: "admin", c: "var(--accent)" },
  { k: "member", c: "var(--cielo)" },
  { k: "guest", c: "var(--warn)" },
] as const;

/** Three small phones, one per role: you (admin), your family (member), a friend (guest, expires in 24 h). */
export function RoleCards() {
  const t = useTranslations("screen.s5");
  return (
    <ul className="rc">
      {ROLES.map((r) => (
        <li key={r.k} className="rc-i" data-role={r.k}>
          <span className="rc-ph" aria-hidden="true">
            <i className="rc-orb" style={{ background: r.c }} />
            <i className="rc-ln" />
            <i className="rc-ln rc-s" />
          </span>
          <span className="rc-n">{t(r.k)}</span>
          {r.k === "guest" && <span className="rc-x">{t("guestExpiry")}</span>}
        </li>
      ))}
    </ul>
  );
}
