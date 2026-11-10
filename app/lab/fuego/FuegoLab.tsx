"use client";

import dynamic from "next/dynamic";

// El 3D se descarga después del primer pintado; mientras tanto, el póster (la lumbre en CSS).
const FogarScene = dynamic(() => import("@/components/fogar/FogarScene"), { ssr: false });

const label =
  "absolute left-0 top-0 z-10 flex items-center gap-2 text-[13px] font-semibold text-[#ece6dc] opacity-0 transition-opacity duration-500 [text-shadow:0_0_10px_#0b1012]";

export function FuegoLab() {
  return (
    <div id="lab-scroll" className="relative h-[400vh] bg-[#0b1012]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 40% 45% at 50% 62%, #5a1a10 0%, #20332a 45%, #0b1012 80%)" }}
        />
        <FogarScene scrollId="lab-scroll">
          <span data-anchor="-3.3,1.1,1.7" className={label}><i className="block h-px w-8 bg-[#ece6dc]" />Voz</span>
          <span data-anchor="0,0.3,1.0" className={label}><i className="block h-px w-8 bg-[#ece6dc]" />Gateway</span>
          <span data-anchor="3.4,0.8,1.3" className={label}><i className="block h-px w-8 bg-[#ece6dc]" />Skills y MCP</span>
        </FogarScene>
      </div>
    </div>
  );
}
