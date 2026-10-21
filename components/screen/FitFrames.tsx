/** Before hydration the TV and phone canvases scale from --s / --ps, which their frames only measure once React runs.
 *  WebKit (Safari, all of iOS) gets the CSS fallback (tan(atan2()) with cqw) wrong and showed the TV as a thumbnail
 *  on black, so this inline script, emitted right after the frames' markup, sets them from each frame's width
 *  synchronously, before the first paint. No dependencies; safe to run more than once. */
export const FIT_SCRIPT = `(function(){var d=document;function f(sel,v,w){var l=d.querySelectorAll(sel);for(var i=0;i<l.length;i++){var x=l[i].clientWidth;if(x>0)l[i].style.setProperty(v,String(x/w));}}f(".jscreen .tv-vp","--s",1920);f(".jscreen .ph-vp","--ps",390);})();`;

/** The script as a server-rendered tag (a server component: it never renders on the client). */
export function FitFrames() {
  return <script dangerouslySetInnerHTML={{ __html: FIT_SCRIPT }} />;
}
