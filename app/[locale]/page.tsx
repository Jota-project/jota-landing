import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Solution } from "@/components/sections/Solution";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WhatItCanDo } from "@/components/sections/WhatItCanDo";
import { WhyNow } from "@/components/sections/WhyNow";
import { CloudVsLocal } from "@/components/sections/CloudVsLocal";
import { Team } from "@/components/sections/Team";
import { Engineering } from "@/components/sections/Engineering";
import { Contact } from "@/components/sections/Contact";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="mx-auto w-full max-w-5xl px-6">
        <section id="hero" className="py-16 md:py-24">
          <Hero />
        </section>
        <section id="problem" className="py-16 md:py-24">
          <Problem />
        </section>
        <section id="solution" className="py-16 md:py-24">
          <Solution />
        </section>
        <section id="how" className="py-16 md:py-24">
          <HowItWorks />
        </section>
        <section id="what" className="py-16 md:py-24">
          <WhatItCanDo />
        </section>
        <section id="why" className="py-16 md:py-24">
          <WhyNow />
        </section>
        <section id="model" className="py-16 md:py-24">
          <CloudVsLocal />
        </section>
        <section id="team" className="py-16 md:py-24">
          <Team />
        </section>
        <section id="engineering" className="py-16 md:py-24">
          <Engineering />
        </section>
        <section id="contact" className="py-16 md:py-24">
          <Contact />
        </section>
      </main>
    </>
  );
}
