import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  const title = isEs
    ? "Jota — Tu agente personal, con voz"
    : "Jota — Your personal agent, with a voice";
  const description = isEs
    ? "No es un asistente de voz más: un agente que recuerda, se personaliza y actúa por ti. Tu casa, tu trabajo, tu día a día. Privado por diseño."
    : "Not just another voice assistant: an agent that remembers, personalizes and acts for you. Your home, your work, your day. Private by design.";
  const ogImage = isEs ? "/og-image.png" : "/og-image-en.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: isEs ? "es_ES" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Nav />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
