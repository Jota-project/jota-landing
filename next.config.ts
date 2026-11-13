import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/diy/como-esta-hecho-jota", destination: "/diy/como-esta-hecho-fogar", permanent: true },
      { source: "/jota-screen", destination: "/fogar-tv", permanent: true },
      { source: "/en/jota-screen", destination: "/en/fogar-tv", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
