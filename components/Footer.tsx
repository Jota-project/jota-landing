import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONTACT_EMAIL } from "@/lib/contact";
import { GITHUB_ORG, GITHUB_REPOS, repoUrl } from "@/lib/github";
import { CopyEmail } from "./CopyEmail";

export async function Footer() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const year = new Date().getFullYear();
  return (
    <footer id="contact" className="mt-12 border-t border-line bg-linen-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1fr_auto_auto]">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-2xl font-medium text-ink">{t("ask")}</h2>
          <p className="max-w-[46ch] text-ink">{t("askBody")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${CONTACT_EMAIL}`} className="select-all font-medium text-malva-text underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            <CopyEmail label={t("copy")} done={t("copied")} />
          </div>
        </div>
        <ul className="flex gap-6 text-sm text-ink-soft md:flex-col md:gap-2">
          <li><Link href="/" className="hover:text-malva">{nav("home")}</Link></li>
          <li><Link href="/jota-screen" className="hover:text-malva">{nav("screen")}</Link></li>
          <li><Link href="/diy" className="hover:text-malva">{nav("diy")}</Link></li>
        </ul>
        <div className="text-sm text-ink-soft">
          <h2 className="mb-2 font-medium text-ink">
            <a href={GITHUB_ORG} target="_blank" rel="noopener" className="hover:text-malva">{t("code")} ↗</a>
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-1">
            {GITHUB_REPOS.map((repo) => (
              <li key={repo}>
                <a href={repoUrl(repo)} target="_blank" rel="noopener" className="hover:text-malva">{repo}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1 border-t border-line pt-6 text-xs text-ink-soft md:col-span-3">
          <p>{t("team")}</p>
          <p>© {year} Jota. {t("rights")}</p>
        </div>
      </div>
    </footer>
  );
}
