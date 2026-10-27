import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "@/components/screen/screen-tv.css";
import "@/components/screen/screen-tv-screens.css";
import "@/components/home/home.css";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/Button";
import { ConversationPanel } from "@/components/home/ConversationPanel";
import { SystemMap } from "@/components/home/SystemMap";
import { TvFrame } from "@/components/screen/tv/TvFrame";
import { Serie } from "@/components/screen/tv/Serie";
import { ChatPill } from "@/components/screen/tv/ChatPill";
import { FitFrames } from "@/components/screen/FitFrames";

type Props = { params: Promise<{ locale: string }> };

const ARTICLE = "/diy/como-esta-hecho-jota";
const GITHUB = "https://github.com/jota-project";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.meta" });
  return { title: t("title"), description: t("description") };
}

/** Section heading with its proof beside it: a link to where the DIY article backs it up. */
function Head({ id, title, lead, proof, href }: { id: string; title: string; lead?: string; proof: string; href: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-end md:gap-10">
      <div className="flex flex-col gap-3">
        <h2 id={id} className="font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-medium leading-[1.08] tracking-[-0.015em] text-balance text-ink">
          {title}
        </h2>
        {lead && <p className="max-w-[60ch] text-lg text-ink">{lead}</p>}
      </div>
      <Link href={href} className="text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-malva-text md:border-l md:border-line md:pl-4 md:no-underline">
        {proof} →
      </Link>
    </div>
  );
}

function Band({ children, tone = "linen", labelledBy }: { children: ReactNode; tone?: "linen" | "linen-2"; labelledBy: string }) {
  return (
    <section aria-labelledby={labelledBy} className={tone === "linen-2" ? "bg-linen-2" : ""}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 md:py-28">{children}</div>
    </section>
  );
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const chat = await getTranslations("screen.chat");
  const rows = t.raw("keep.rows") as { use: string; jota: string; how: string; open: string }[];
  const limits = t.raw("notyet.items") as string[];
  const voice = ["Mac", "Android", "Linux", "Win", "Esp"] as const;

  return (
    <main>
      {/* hero */}
      <section aria-labelledby="hero" className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] md:pb-28 md:pt-16">
        <div className="flex flex-col gap-6">
          <h1 id="hero" className="font-display text-[clamp(2.5rem,6vw,4.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-balance text-ink">
            {t("hero.headline")}
          </h1>
          <p className="max-w-[46ch] text-lg text-ink">{t("hero.sub")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/diy" className={buttonClass("primary")}>{t("hero.ctaInstall")}</Link>
            <Link href={ARTICLE} className={buttonClass("ghost")}>{t("hero.ctaHow")}</Link>
          </div>
          <dl className="grid max-w-[48ch] grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-line pt-4 text-sm tabular-nums">
            <dt className="text-ink-soft">{t("hero.stateK")}</dt><dd>{t("hero.stateV")}</dd>
            <dt className="text-ink-soft">{t("hero.testedK")}</dt><dd>{t("hero.testedV")}</dd>
            <dt className="text-ink-soft">{t("hero.reviewedK")}</dt><dd>{t("hero.reviewedV")}</dd>
          </dl>
        </div>
        <ConversationPanel />
      </section>

      {/* 1 · the same sentence, from the inside */}
      <Band labelledBy="route" tone="linen-2">
        <Head id="route" title={t("map.routeTitle")} lead={t("map.routeLead")} proof={t("map.proofRoute")} href={`${ARTICLE}#recorrido`} />
        <SystemMap mode="route" />
      </Band>

      {/* 2 · what leaves home */}
      <Band labelledBy="border">
        <Head id="border" title={t("map.borderTitle")} lead={t("map.borderLead")} proof={t("map.proofBorder")} href={`${ARTICLE}#casa`} />
        <SystemMap mode="border" />
      </Band>

      {/* 3 · what you already have stays */}
      <Band labelledBy="keep" tone="linen-2">
        <Head id="keep" title={t("keep.title")} lead={t("keep.lead")} proof={t("keep.proof")} href={`${ARTICLE}#abierto`} />
        <div className="overflow-x-auto rounded-[22px] border border-line bg-linen">
          <table className="w-full min-w-[720px] border-collapse text-left text-[0.95rem]">
            <thead>
              <tr className="text-xs uppercase tracking-[0.08em] text-ink-soft">
                {(["hUse", "hJota", "hHow", "hOpen"] as const).map((h) => (
                  <th key={h} scope="col" className="border-b border-line px-5 py-3 font-semibold">{t(`keep.${h}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.use} className="align-top [&:not(:last-child)>*]:border-b [&>*]:border-line">
                  <th scope="row" className="px-5 py-4 font-display text-lg font-medium">{r.use}</th>
                  <td className="px-5 py-4">{r.jota}</td>
                  <td className="px-5 py-4 text-ink-soft">{r.how}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm">{r.open}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Band>

      {/* 4 · where you talk to it */}
      <Band labelledBy="where">
        <h2 id="where" className="font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-medium leading-[1.08] tracking-[-0.015em] text-ink">
          {t("where.title")}
        </h2>
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
          <div className="jscreen">
            <TvFrame>
              <Serie playing={false} progress={0.37} />
              <ChatPill
                open
                turn={{ you: chat("series1You"), tool: { icon: "where", title: chat("toolWhere") }, jota: chat("series1Jota") }}
                state={{ you: true, tool: "done", jota: true }}
                orb="idle"
                animate={false}
              />
            </TvFrame>
            <FitFrames />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-2xl font-medium">{t("where.screenTitle")}</h3>
            <p className="text-ink">{t("where.screenBody")}</p>
            <p className="text-sm text-ink-soft">{t("where.screenNeeds")}</p>
            <Link href="/jota-screen" className={buttonClass("ghost", "self-start")}>{t("where.screenCta")}</Link>
          </div>
        </div>
        <div className="grid gap-10 border-t border-line pt-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
          <div className="flex flex-col gap-4">
            <h3 className="font-display text-2xl font-medium">{t("where.voiceTitle")}</h3>
            <p className="max-w-[52ch]">{t("where.voiceBody")}</p>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              {voice.map((v) => (
                <div key={v} className="contents">
                  <dt className="font-medium">{t(`where.v${v}`)}</dt>
                  <dd className="text-ink-soft">{t(`where.v${v}S`)}</dd>
                </div>
              ))}
            </dl>
            <a href={`${GITHUB}/jota-voice#readme`} className="text-sm text-malva-text underline underline-offset-4">jota-voice README</a>
          </div>
          <div className="flex flex-col gap-2 md:border-l md:border-line md:pl-10">
            <h3 className="font-display text-2xl font-medium">{t("where.iosTitle")}</h3>
            <p className="text-ink-soft">{t("where.iosBody")}</p>
          </div>
        </div>
      </Band>

      {/* 5 · what it doesn't do yet */}
      <Band labelledBy="notyet" tone="linen-2">
        <Head id="notyet" title={t("notyet.title")} proof={t("notyet.proof")} href={`${ARTICLE}#limites`} />
        <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          {limits.map((l) => (
            <li key={l} className="border-t border-line pt-4 text-ink">{l}</li>
          ))}
        </ul>
      </Band>

      {/* 6 · dry close */}
      <Band labelledBy="close">
        <div className="flex flex-col items-start gap-5">
          <h2 id="close" className="font-display text-[clamp(1.8rem,3.6vw,2.6rem)] font-medium text-ink">{t("close.title")}</h2>
          <p className="max-w-[52ch] text-lg">{t("close.body")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/diy" className={buttonClass("primary")}>{t("close.install")}</Link>
            <a href={`${GITHUB}/jota-gateway/blob/main/docs/client-protocol.md`} className={buttonClass("ghost")}>{t("close.client")}</a>
          </div>
        </div>
      </Band>
    </main>
  );
}
