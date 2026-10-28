import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/components/screen/screen-tv.css";
import "@/components/screen/screen-tv-screens.css";
import "@/components/screen/screen-track-b.css";
import "@/components/home/home.css";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/Button";
import { HeroTv } from "@/components/home/HeroTv";
import { VoiceTile } from "@/components/home/VoiceTile";
import { FitFrames } from "@/components/screen/FitFrames";
import { NavTone } from "@/components/screen/NavTone";
import { TvFrame } from "@/components/screen/tv/TvFrame";
import { Reposo } from "@/components/screen/tv/Reposo";
import { Orb } from "@/components/screen/tv/Orb";
import { PhoneFrame } from "@/components/screen/phone/PhoneFrame";

type Props = { params: Promise<{ locale: string }> };

const ARTICLE = "/diy/como-esta-hecho-jota";
const GITHUB = "https://github.com/jota-project";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return { title: t("title"), description: t("description") };
}

const h2 = "font-display text-[clamp(2rem,4.2vw,3.1rem)] font-medium leading-[1.04] tracking-[-0.02em] text-balance";

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const rows = t.raw("keep.rows") as { name: string; body: string }[];

  return (
    <main>
      <NavTone />

      {/* what it is, and the TV answering a question anyone has asked while watching a series */}
      <section aria-labelledby="hero" className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-8 md:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] md:gap-14 md:pb-28 md:pt-14">
        <div className="flex flex-col gap-6">
          <h1 id="hero" className="font-display text-[clamp(2.6rem,4.6vw,3.9rem)] font-medium leading-[1.02] tracking-[-0.025em] text-balance text-ink">
            {t("hero.headline")}
          </h1>
          <p className="max-w-[44ch] text-lg leading-[1.5] text-ink">{t("hero.sub")}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/diy" className={buttonClass("primary")}>{t("hero.ctaInstall")}</Link>
            <Link href="/jota-screen" className={buttonClass("ghost")}>{t("hero.ctaScreen")}</Link>
          </div>
        </div>
        <HeroTv />
        <FitFrames />
      </section>

      {/* the house at dusk: the three places you talk to it from, all on one brain */}
      <section aria-labelledby="house" data-tone="dark" className="hm-house bg-dusk text-linen">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:py-28">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
            <h2 id="house" className={h2}>{t("house.title")}</h2>
            <p className="max-w-[48ch] text-lg text-linen/85 md:justify-self-end">{t("house.lead")}</p>
          </div>

          <div className="hm-grid">
            <div className="hm-cell hm-cell-tv">
              <figure role="img" aria-label={t("house.tvLabel")} className="jscreen">
                <TvFrame>
                  <Reposo layout="rotate" perfil="tarde" showMusic={false} />
                </TvFrame>
              </figure>
              <FitFrames />
              <h3 className="hm-h3">{t("house.tvTitle")}</h3>
              <p className="hm-p">{t("house.tvBody")}</p>
              <Link href="/jota-screen" className="hm-link">{t("house.tvCta")}</Link>
            </div>

            <div className="hm-cell hm-cell-voice">
              <VoiceTile />
              <h3 className="hm-h3">{t("house.voiceTitle")}</h3>
              <p className="hm-p">{t("house.voiceBody")}</p>
            </div>

            <div className="hm-cell hm-cell-phone">
              <figure role="img" aria-label={t("house.phoneLabel")} className="jscreen hm-phone">
                <PhoneFrame>
                  <div className="hm-phone-screen">
                    <Orb state="idle" size={96} />
                  </div>
                </PhoneFrame>
              </figure>
              <FitFrames />
              <div>
                <h3 className="hm-h3">{t("house.phoneTitle")}</h3>
                <p className="hm-p">{t("house.phoneBody")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* for whoever already runs Home Assistant and OpenClaw: nothing to throw away */}
      <section aria-labelledby="keep" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:py-28">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
          <h2 id="keep" className={`${h2} text-ink`}>{t("keep.title")}</h2>
          <p className="max-w-[48ch] text-lg text-ink md:justify-self-end">{t("keep.lead")}</p>
        </div>
        <ul className="hm-rows">
          {rows.map((r) => (
            <li key={r.name}>
              <span className="hm-row-name">{r.name}</span>
              <p className="hm-row-body">{r.body}</p>
            </li>
          ))}
        </ul>
        <p className="max-w-[60ch] text-ink-soft">
          {t("keep.protocol")}{" "}
          <a href={`${GITHUB}/jota-gateway/blob/main/docs/client-protocol.md`} className="hm-link-ink">{t("keep.protocolLink")}</a>
        </p>
      </section>

      {/* where it runs, in one calm statement */}
      <section aria-labelledby="local" className="bg-linen-2">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] md:gap-16 md:py-24">
          <div className="flex flex-col gap-5">
            <h2 id="local" className={`${h2} text-ink`}>{t("local.title")}</h2>
            <p className="max-w-[52ch] text-lg leading-[1.5] text-ink">{t("local.body")}</p>
          </div>
          <div className="flex flex-col gap-4 self-end text-ink">
            <p className="max-w-[40ch]">{t("local.open")}</p>
            <p className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href={`${ARTICLE}#casa`} className="hm-link-ink">{t("local.link")}</Link>
              <a href={GITHUB} className="hm-link-ink">{t("local.github")}</a>
            </p>
          </div>
        </div>
      </section>

      {/* three doors */}
      <section aria-labelledby="doors" className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-12 pt-20 md:pb-16 md:pt-28">
        <h2 id="doors" className={`${h2} text-ink`}>{t("doors.title")}</h2>
        <div className="hm-doors">
          <Link href="/diy" className="hm-door hm-door-primary">
            <span className="hm-door-t">{t("doors.install")}</span>
            <span className="hm-door-b">{t("doors.installBody")}</span>
          </Link>
          <Link href="/jota-screen" className="hm-door">
            <span className="hm-door-t">{t("doors.screen")}</span>
            <span className="hm-door-b">{t("doors.screenBody")}</span>
          </Link>
          <Link href={ARTICLE} className="hm-door">
            <span className="hm-door-t">{t("doors.how")}</span>
            <span className="hm-door-b">{t("doors.howBody")}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
