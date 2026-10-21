"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { ActivityPill } from "../tv/ActivityPill";
import { ChatPill } from "../tv/ChatPill";
import { GlassPanel, type Turn } from "../tv/GlassPanel";
import { GrowTile, type GrowPhase } from "../tv/GrowTile";
import { GRAD, Inicio } from "../tv/Inicio";
import { MusicaFull } from "../tv/MusicaFull";
import { PhoneListen } from "../tv/PhoneListen";
import { Reposo } from "../tv/Reposo";
import { Serie } from "../tv/Serie";
import { WebReceta } from "../tv/WebReceta";
import { SCENE2, SCENE3, orbState, turnState } from "./scriptsA";

export type SceneScript = {
  done: Set<string>;
  finished: boolean;
  /** Words appear one by one only while the script really plays. */
  animate: boolean;
  /** How much of the activity ring is left (1 = full); TrackA owns it so it keeps counting across scenes. */
  ring: number;
};

// «El faro» is the focused first tile of «Seguir viendo» (left 96, top 572, 396×223, focus scale 1.06)
const FROM_HOME = { x: 84, y: 555, scale: 0.2186 };
const FARO_BG = `linear-gradient(135deg,${GRAD[0][0]},${GRAD[0][1]})`;
// the recipe tile grows from the free area left of the glass panel
const FROM_PANEL = { x: 420, y: 420, scale: 0.2 };

/** Live activity «Cena · 20:00». `aside`: beside the top pill (top right corner); `web`: below the web bar. */
function LiveActivity({
  on,
  ring,
  shifted,
  aside,
  web = false,
}: {
  on: boolean;
  ring: number;
  shifted: boolean;
  aside: boolean;
  web?: boolean;
}) {
  const t = useTranslations("screen.tv");
  return (
    <div className="ta-act" data-aside={aside ? "true" : "false"} data-web={web ? "true" : "false"}>
      <ActivityPill on={on} label={t("activityLabel")} time={t("activityTime")} progress={on ? ring : 1} shifted={shifted} />
    </div>
  );
}

/** Scene 1 · the idle screen, widgets rearranging. */
export const Scene1Tv = memo(function Scene1Tv() {
  return <Reposo layout="rotate" perfil="tarde" />;
});

/** Scene 2 · Inicio → the tile grows → the series, the pill above it and the activity. */
export const Scene2Tv = memo(function Scene2Tv({
  done,
  finished,
  animate,
  ring,
  grow,
  live,
}: SceneScript & { grow: GrowPhase; live: boolean }) {
  const t = useTranslations("screen");
  const turns: Turn[] = [
    { you: t("chat.series1You"), tool: { icon: "where", title: t("chat.toolWhere") }, jota: t("chat.series1Jota") },
    { you: t("chat.series2You"), tool: { icon: "timer", title: t("chat.toolTimer") }, jota: t("chat.series2Jota") },
  ];
  const second = done.has("you2");
  const home = grow === "hidden" || grow === "small" || grow === "full";
  const series = grow === "full" || grow === "gone";
  const pillOpen = done.has("you1");
  const orb = orbState(SCENE2, done, finished);
  return (
    <>
      {series && <Serie playing={live} progress={0.32} />}
      {series && <PhoneListen on={orb === "listen"} />}
      {home && <Inicio focus={0} />}
      <GrowTile phase={grow} title={t("tv.showTitle")} sub={t("tv.showMeta")} from={FROM_HOME} bg={FARO_BG} />
      <LiveActivity on={done.has("activity")} ring={ring} shifted={false} aside={pillOpen} />
      <ChatPill
        open={pillOpen}
        turn={turns[second ? 1 : 0]}
        state={turnState(done, second ? 2 : 1)}
        orb={orb}
        replayLabel={t("chat.replay")}
        animate={animate}
      />
    </>
  );
});

/** Scene 3 · back to idle with the glass panel: music, then the recipe web. */
export const Scene3Tv = memo(function Scene3Tv({
  done,
  finished,
  animate,
  ring,
  activity,
}: SceneScript & { activity: boolean }) {
  const t = useTranslations("screen");
  const turns: Turn[] = [
    {
      you: t("chat.jazzYou"),
      tool: { icon: "music", title: t("chat.toolMusic"), sub: t("chat.toolMusicSub") },
      jota: t("chat.jazzJota"),
    },
    {
      you: t("chat.recipeYou"),
      tool: { icon: "web", title: t("chat.toolWeb"), sub: t("chat.toolWebSub") },
      jota: t("chat.recipeJota"),
    },
  ];
  const open = done.has("you1");
  const grow: GrowPhase = done.has("web") ? "gone" : done.has("grow") ? "full" : "hidden";
  return (
    <>
      {done.has("music") ? <MusicaFull compact /> : <Reposo layout={open ? "talk" : "rotate"} perfil="tarde" />}
      {done.has("web") && <WebReceta loading={!done.has("toolDone2")} />}
      <GrowTile phase={grow} title={t("tv.recipeTitle")} sub={t("tv.recipeSite")} from={FROM_PANEL} />
      <LiveActivity on={activity} ring={ring} shifted={open} aside={false} web={done.has("web")} />
      <GlassPanel
        open={open}
        turns={turns}
        states={[turnState(done, 1), turnState(done, 2)]}
        orb={orbState(SCENE3, done, finished)}
        replayLabel={t("chat.replay")}
        animate={animate}
      />
    </>
  );
});
