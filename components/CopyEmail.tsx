"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/contact";
import { buttonClass } from "./Button";

export function CopyEmail({ label, done }: { label: string; done: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // no clipboard (old browsers, some webviews): the address next to it is selectable
    }
  }
  return (
    <button type="button" onClick={copy} className={buttonClass("ghost", "px-4 py-2")} aria-live="polite">
      {copied ? done : label}
    </button>
  );
}
