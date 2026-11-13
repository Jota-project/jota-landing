/* eslint-disable */
// Motor de la línea viva. Copiado de fogar-brand/sistema/project/components/LineaViva/preview.html
// (que a su vez copia linea-viva/index.html, séptima vuelta) con tres cambios: el lienzo, «reducir movimiento»
// y el bucle llegan desde fuera, y el color sale de los tokens CSS. Si cambia el motor en fogar-brand, se vuelve a copiar.
// No se edita a mano salvo esas costuras (marcadas «costura»).

/**
 * @param {HTMLCanvasElement} cv
 * @param {{ reduce?: boolean, paleta?: Record<string,string>, halo?: number, humo?: string|null, giro?: number }} [opts]
 */
export function crearLineaViva(cv, opts = {}) {
/* ===== Motor de linea-viva/index.html (séptima vuelta), copiado sin cambios: modelo y trazo ===== */
/* ================= La palabra: un solo trazo de Bézier sobre Sacramento (base 250, altura x 197) ================= */
const SVGNS="http://www.w3.org/2000/svg";
const SL=Math.tan(7*Math.PI/180);                 // 7°: la misma inclinación para todos los astiles
const nx=c=>x=>+(c+(x-c)*0.92).toFixed(2);       // cuencos de g y a un 8 % más estrechos
const g=nx(272.5), a=nx(349);
const GA=`C ${g(254)} 206 ${g(262)} 197 272 197 C ${g(283)} 197 ${g(291)} 200 ${g(291)} 211 C ${g(291)} 218 ${g(291)} 225 ${g(291)} 232`;
const AA=`C ${a(330)} 206 ${a(338)} 197 350 197 C ${a(361)} 197 ${a(368)} 200 ${a(368)} 211 C ${a(368)} 218 ${a(368)} 225 ${a(368)} 232`;
const OT=`C 177 206 185 197 197 197`;
// La F mayúscula de Sacramento tal cual (versión A del símbolo), calcada sobre el centro del trazo (cuerpo 520, base 470)
const K_F=53/122, FTX=x=>K_F*x+165-618*K_F, FTY=y=>K_F*y+250-470*K_F;   // altura x de la F → la de «ogar»; la punta del travesaño en x 165
const F_MAIN="M 105 268 C 80 250 62 225 66 195 C 72 150 120 122 200 120 C 290 118 400 160 480 175 C 560 190 640 192 680 160 C 700 140 690 108 650 104 C 590 98 540 140 525 190 C 512 235 516 300 510 350 C 500 430 440 472 345 474 C 260 475 190 430 168 368";
const F_BAR="M 372 299 C 450 292 540 288 618 291";
const OGAR=[["link",null],
  ["oBody",`C 209 197 217 207 217 222 C 217 238 208 250 196 250 C 184 250 177 240 177 222`],["oTop2",OT],
  ["og",`C 205 197 210 200 214 204 C 222 213 236 240 246 240 C ${g(251)} 240 ${g(254)} 233 ${g(254)} 222`],
  ["gTop1",GA],["gBody",`C ${g(291)} 243 ${g(283)} 250 272 250 C ${g(262)} 250 ${g(254)} 240 ${g(254)} 222`],["gTop2",GA],
  ["gDesc",`C ${g(291)} 270 ${g(291)} 320 289 342 C 288 356 284 366 276 366 C 266 366 262 356 263 344 C 265 318 282 282 302 262 C 318 248 ${a(330)} 240 ${a(330)} 224`],
  ["aTop1",AA],["aBody",`C ${a(368)} 243 ${a(359)} 250 348 250 C ${a(338)} 250 ${a(330)} 240 ${a(330)} 224`],["aTop2",AA],
  ["r",`C ${a(368)} 242 369 250 376 251 C 382 252 386 246 389 240 C 394 230 400 206 404 184 C 413 166 411 146 397 146 C 383 146 382 163 388 177 C 393 192 404 198 418 198 C 428 198 434 202 434 212 C 434 228 432 238 436 245`],
  ["tail",`C 441 253 455 254 466 245 C 475 237 484 218 491 200`]   // cola afilada que sube hasta la altura x
];
const slant=([x,y])=>[x+SL*(250-y),y];
function svgLen(d){ const p=document.createElementNS(SVGNS,"path"); p.setAttribute("d",d); return p; }
function sampleD(d,tf){ const p=svgLen(d), L=p.getTotalLength(), n=Math.max(2,Math.ceil(L*(tf?K_F:1)/0.5)), out=[];
  for(let i=0;i<=n;i++){ const q=p.getPointAtLength(L*i/n); out.push(tf?[FTX(q.x),FTY(q.y)]:[q.x,q.y]); } return out; }
// Un solo trazo: la F de arriba abajo; vuelve por su propia tinta hasta el travesaño, lo recorre y sale hacia la o.
// Los tramos repasados quedan dentro del trazo: en quieto se ve la F de dos trazos de Sacramento.
function build(n){
  const main=sampleD(F_MAIN,true), bar=sampleD(F_BAR,true);
  let best=[1e9,0,0]; for(let k=0;k<main.length;k++){ const [x,y]=main[k]; if(y<FTY(250)||y>FTY(340)||x<FTX(480)) continue;
    for(let j=0;j<bar.length;j++){ const d=Math.hypot(bar[j][0]-x,bar[j][1]-y); if(d<best[0]) best=[d,k,j]; } }
  const [,kc,jc]=best;   // cruce del asta con el travesaño
  const pieces=[["Fmain",main],["Fback",main.slice(kc).reverse()],["barL",bar.slice(0,jc+1).reverse()],["bar",bar]];
  const YC=FTY(291); let last=[165-SL*(250-YC),YC];
  for(const [k,seg] of OGAR){ const pts=sampleD(seg===null?`M ${last[0]} ${last[1]} C 174 ${YC} 186 197 197 197`:`M ${last[0]} ${last[1]} ${seg}`,false);
    last=pts[pts.length-1]; pieces.push([k,pts.map(slant)]); }
  const all=[], cum=[0], mark={};
  for(const [k,pts] of pieces){ mark[k]=[cum[cum.length-1]]; pts.forEach((q,i)=>{ if(all.length&&i===0) return; if(all.length) cum.push(cum[cum.length-1]+Math.hypot(q[0]-all[all.length-1][0],q[1]-all[all.length-1][1])); all.push(q); }); mark[k].push(cum[cum.length-1]); }
  const L=cum[cum.length-1], out=[]; let j=0;
  for(let i=0;i<n;i++){ const d=L*i/(n-1); while(j<all.length-2&&cum[j+1]<d) j++; const f=(d-cum[j])/((cum[j+1]-cum[j])||1); out.push([all[j][0]+(all[j+1][0]-all[j][0])*f, all[j][1]+(all[j+1][1]-all[j][1])*f]); }
  const idx={}; for(const k in mark) idx[k]=mark[k].map(v=>Math.round(v/L*(n-1)));
  return {pts:out,idx};
}
const N=600, W=1000, H=420, STROKE=4.4, TIP=0.8;
const B=build(N), RAW=B.pts, IDX=B.idx;
const box=pts=>pts.reduce((b,[x,y])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)],[1e9,1e9,-1e9,-1e9]);
const bb=box(RAW), SC=Math.min(800/(bb[2]-bb[0]),372/(bb[3]-bb[1])), CX=500, CY=214;
const fit=([x,y])=>[CX+(x-(bb[0]+bb[2])/2)*SC, CY+(y-(bb[1]+bb[3])/2)*SC];
const WORD=RAW.map(fit), BASE=fit([0,250])[1];
const WB=box(WORD), XMIN=WB[0], XMAX=WB[2];
const LX0=XMIN, LX1=XMAX;                                      // la recta: de la izquierda de la F al final de la cola
const I_FEND=IDX.bar[1];                                       // fin de la F: la punta del travesaño
const I_TIN=Math.round(N*0.02), I_TOUT=Math.round(N*0.05);     // remates: entrada de la F y cola afilada en el último 5 %
const XM=[]; WORD.forEach((p,i)=>XM.push(Math.max(p[0],i?XM[i-1]:-1e9)));   // x monótona a lo largo del trazo (para la brasa)
const O_RANGE=[IDX.oBody[0],IDX.oTop2[1]];
const OC=(()=>{ let x=0,y=0,c=0; for(let i=IDX.oBody[0];i<=IDX.oBody[1];i++){ x+=WORD[i][0]; y+=WORD[i][1]; c++; } return [x/c,y/c]; })();
const TS=IDX.tail[0];                                          // la cola libre de la r: solo ella da el latigazo
const TAILW=WORD.map((p,i)=>smooth(clamp((i-TS)/(N-1-TS))));

const reduce=!!opts.reduce; // costura
function clamp(x,a=0,b=1){ return Math.max(a,Math.min(b,x)); }
function smooth(b){ return b*b*b*(b*(b*6-15)+10); }
const ss=b=>b*b*(3-2*b);
const hann=s=>Math.sin(Math.PI*s)**2;
const mk=()=>WORD.map(()=>[0,0]);

/* ================= Estados ================= */
const NAMES={fonly:"Reposo · la F",line:"Recta",rest:"Reposo",listen:"Escucha",think:"Piensa",tool:"Herramienta",speak:"Habla"};
function voice(t){ return clamp(0.45+0.5*Math.sin(t*6.1)*Math.sin(t*1.6+1)+0.18*Math.sin(t*13.7)); }
function syll(t){ const phrase=Math.sin(t*0.75)>-0.45?1:0.15; return phrase*Math.pow(Math.max(0,Math.sin(t*Math.PI*3.4)),2); }
let VS=0.5, SS=0, SD=0;                      // envolventes: ataque 60 ms, caída 180 ms; SD es la de las lenguas laterales (90 ms tarde)
const env=(v,r,dt)=>v+(r-v)*(1-Math.exp(-dt/(r>v?0.04:0.25)));
function smoothVoice(t,dt){ VS=env(VS,voice(t),dt); SS=env(SS,syll(t),dt); SD=env(SD,syll(t-0.09),dt); }
const TW=2*Math.PI*0.35;                     // piensa: 0,35 vueltas/s
// muelle: radio con smoothstep en el 8 % de cada extremo
const TRAMP=WORD.map((p,i)=>{ const s=i/(N-1); return ss(clamp(s/0.08))*ss(clamp((1-s)/0.08)); });
// el avance también sigue la rampa: radio y avance bajan juntos, los lazos se achican hasta la punta y nunca pasan por una cúspide
const TX=(()=>{ const c=[0]; for(let i=1;i<N;i++) c.push(c[i-1]+(TRAMP[i]+TRAMP[i-1])/2); return c.map(v=>v/c[N-1]); })();
function shape(st,t,out){
  for(let i=0;i<N;i++){
    const s=i/(N-1); let x,y;
    if(st==="line"){ x=LX0+(LX1-LX0)*s; y=BASE; }
    else if(st==="rest"){ x=WORD[i][0]; y=WORD[i][1]; }
    else if(st==="fonly"){ // el nombre recogido en el travesaño: lo que sobra se enrolla en él, de la punta hacia el asta
      const jf=i<=I_FEND?i:I_FEND-(I_FEND-IDX.bar[0])*(i-I_FEND)/(N-1-I_FEND), j0=Math.floor(jf), j1=Math.min(N-1,j0+1), f=jf-j0;
      x=WORD[j0][0]+(WORD[j1][0]-WORD[j0][0])*f; y=WORD[j0][1]+(WORD[j1][1]-WORD[j0][1])*f; }
    else if(st==="listen"){ const e=reduce?voice(t):VS; x=40+920*s; const amp=(14+70*e)*hann(s);
      y=CY+amp*(0.62*Math.sin(s*Math.PI*9-t*7)+0.28*Math.sin(s*Math.PI*21+t*5)+0.1*Math.sin(s*Math.PI*43-t*11)); }
    else if(st==="think"){ // el nudo de la cuarta vuelta: desordenado, se mueve sin parar
      const u=s*Math.PI*2; x=CX+230*Math.sin(u*2+t*0.55)+70*Math.sin(u*5-t*0.9)+220*(s-0.5); y=CY+120*Math.sin(u*3+t*0.7+1)+30*Math.cos(u*7+t*1.1); }
    else if(st==="tool"){ const ph=s*Math.PI*2*11-t*Math.PI*2; const r=38*TRAMP[i]; x=70+860*TX[i]+r*Math.cos(ph); y=CY+r*Math.sin(ph); }
    else { // habla: la llama de la cuarta vuelta: lecho plano a los lados y cinco lenguas, la del medio más alta
      const e=reduce?syll(t):SS, base=CY+130;
      if(s<0.3){ x=150+230*(s/0.3); y=base; }
      else if(s>0.7){ x=620+230*((s-0.7)/0.3); y=base; }
      else { const u=(s-0.3)/0.4, j=Math.min(4,Math.floor(u*5)), f=u*5-j;
        const HJ=[0.3,0.62,1.4,0.66,0.34][j]*(0.8+0.2*Math.sin(t*6.3+j*2.1));
        const body=(45+55*e)*Math.pow(Math.sin(Math.PI*u),0.8), tip=Math.pow(1-Math.abs(f*2-1),0.6);
        y=base-body-(70+150*e)*HJ*tip; const lift=(base-y)/260; x=380+240*u+Math.sin(t*3.3+(base-y)*0.022)*22*lift*lift; } }
    out[i][0]=x; out[i][1]=y;
  }
}

/* ================= La ola de reposo (se suma encima de los muelles) ================= */
const WDY=new Float32Array(N), WMUL=new Float32Array(N).fill(1);
let waveT0=-99, nextWave=1e9, whipT0=-99, whipDone=false, seed=7;
const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };   // determinista, para que las capturas se repitan
const XF=XMIN, XT=WORD[TS][0];
const XBC=WORD[IDX.barL[0]][0], XBT=WORD[I_FEND][0];   // del cruce con el asta a la punta del travesaño
const G55=d=>Math.exp(-d*d/(2*55*55));
// Devuelve la fase: 0 nada, 1 lar, 2 letras. Rellena WDY (desplazamiento vertical) y WMUL (brasa).
function waveFill(tw){
  WDY.fill(0); WMUL.fill(1);
  if(tw<0||tw>2.8) return 0;
  let c, amp;
  if(tw<1){ // cuerda pulsada: el brazo de la F (del asta a la punta) se arquea 10 px y se suelta; la brasa lo recorre
    const u=tw, e=smooth(clamp(u/0.18))*smooth(clamp((1-u)/0.55));
    c=IDX.bar[0]+(I_FEND-IDX.bar[0])*ss(u); amp=e;
    for(let i=IDX.barL[0];i<=I_FEND;i++){ const v=(WORD[i][0]-XBC)/(XBT-XBC); if(v>0&&v<1) WDY[i]=-10*e*Math.sin(Math.PI*v)**2; }
  } else { // y(x) de la f a la r: cresta gaussiana (σ 55 px, 7 px) con valle del 35 % detrás
    const u=(tw-1)/1.8, e=smooth(clamp(u/0.14))*smooth(clamp((1-u)/0.14)), xc=XF+(XMAX-XF)*u;
    for(let i=0;i<N;i++){ const x=WORD[i][0]; WDY[i]=-7*e*(G55(x-xc)-0.35*G55(x-xc+1.8*55)); }
    let lo=0,hi=N-1; while(lo<hi){ const m=(lo+hi)>>1; if(XM[m]<xc) lo=m+1; else hi=m; } c=lo; amp=e;
  }
  const sg=0.03*(N-1); for(let i=Math.max(0,Math.floor(c-3*sg));i<=Math.min(N-1,Math.ceil(c+3*sg));i++) WMUL[i]=1+0.3*amp*Math.exp(-(((i-c)/sg)**2)/2);
  return tw<1?1:2;
}

/* ================= Muelles y transiciones: todo pasa por la recta ================= */
const P=mk(), V=mk(), TN=mk(), SRC=mk(), A1=mk(), A2=mk(), DR=mk();
const K=160, C0=25.3, C1=16;                             // ζ = 1; en el último 7 % de la cola ζ ≈ 0,63: un solo rebote
// la cola blanda solo con la palabra (en los demás estados el blando se retrasa y dobla la línea); el paso de ζ 1 a 0,63 es gradual
const DAMP=WORD.map((p,i)=>C0-(C0-C1)*smooth(clamp((i-TS)/(0.03*(N-1)))));
let LEG=null, cur="line", plan=[], planT0=0, pending=null, pendingAt=null, BREATH=0;
const LINE=(t,out)=>shape("line",t,out);
const xn=x=>(x-XMIN)/(XMAX-XMIN);
function leg(d,f){ return {d,f}; }
const BREATHE=leg(0.22,(u,t,out)=>{ BREATH=Math.sin(Math.PI*u);       // la o respira: escala 3,5 % y grosor ×1,25
  for(let i=0;i<N;i++){ out[i][0]=WORD[i][0]; out[i][1]=WORD[i][1]; }
  for(let i=O_RANGE[0]-8;i<=O_RANGE[1]+8;i++){ const b=ss(clamp((i-O_RANGE[0]+8)/8))*ss(clamp((O_RANGE[1]+8-i)/8)), k=1+0.035*BREATH*b;
    out[i][0]=OC[0]+(WORD[i][0]-OC[0])*k; out[i][1]=OC[1]+(WORD[i][1]-OC[1])*k; } });
// alisado gaussiano a lo largo del arco (tres medias móviles): los bucles se encogen desde dentro y se cierran como un iris,
// y cuando desaparecen lo hacen a un tamaño menor que el grosor del trazo, así que nunca se ve un pico
const SMW=new Float32Array(N), GA1=mk(), GA2=mk(), CS=new Float64Array(N+1), CSX=new Float64Array(N+200);
function gauss(src,out,sig){ if(sig<0.3){ for(let i=0;i<N;i++){ out[i][0]=src[i][0]; out[i][1]=src[i][1]; } return out; }
  const r=Math.max(1,Math.round(Math.sqrt(sig*sig+1)));     // tres pasadas de ancho 2r+1 ≈ gaussiana de σ ≈ r
  for(let k=0;k<2;k++){ let a=src, b=GA1;
    for(let pass=0;pass<3;pass++){ const L=N+2*r; let acc=0; CS[0]=0;   // extremos reflejados en punta: la recta sigue recta y los puntos no se amontonan
      for(let j=0;j<L;j++){ const i=j-r, v=i<0?2*a[0][k]-a[Math.min(N-1,-i)][k]:i>=N?2*a[N-1][k]-a[Math.max(0,2*N-2-i)][k]:a[i][k]; acc+=v; CSX[j+1]=acc; }
      for(let i=0;i<N;i++) b[i][k]=(CSX[i+2*r+1]-CSX[i])/(2*r+1);
      a=b; b=(b===GA1?GA2:GA1); }
    for(let i=0;i<N;i++) out[i][k]=a[i][k]; }
  return out; }
const GW=mk();
function irisSmooth(out){ let any=false; for(let i=0;i<N;i++) if(SMW[i]>0.01){ any=true; break; } if(!any) return;
  gauss(out,GW,20); for(let i=1;i<N-1;i++){ const w=SMW[i]; out[i][0]+=(GW[i][0]-out[i][0])*w; out[i][1]+=(GW[i][1]-out[i][1])*w; } }
const FLATTEN=leg(0.35,(u,t,out)=>{ for(let i=0;i<N;i++){ const e=smooth(clamp((u-0.5*xn(WORD[i][0]))/0.5)); SMW[i]=ss(clamp(e/0.8)); out[i][0]=WORD[i][0]; out[i][1]=WORD[i][1]+(BASE-WORD[i][1])*e; } irisSmooth(out); });
const SLIDE_OUT=leg(0.25,(u,t,out)=>{ const e=smooth(u); for(let i=0;i<N;i++){ const lx=LX0+(LX1-LX0)*i/(N-1); out[i][0]=WORD[i][0]+(lx-WORD[i][0])*e; out[i][1]=BASE; } });
const SLIDE_IN=leg(0.25,(u,t,out)=>{ const e=smooth(u); for(let i=0;i<N;i++){ const lx=LX0+(LX1-LX0)*i/(N-1); out[i][0]=lx+(WORD[i][0]-lx)*e; out[i][1]=BASE; } });
const RISE=leg(0.55,(u,t,out)=>{ for(let i=0;i<N;i++){ const e=smooth(clamp((u-0.45*xn(WORD[i][0]))/0.55)); SMW[i]=ss(clamp((1-e)/0.8)); out[i][0]=WORD[i][0]; out[i][1]=BASE+(WORD[i][1]-BASE)*e; } irisSmooth(out); });
// estado ↔ recta: la forma se alisa (los lazos se cierran como un iris) y a la vez se tiende entera sobre la recta; a la vuelta, al revés.
// Sin frente por el arco: con frente, el extremo aún sin tender se dobla en gancho
const GS=mk();
function toLine(src,d=0.55){ return leg(d,(u,t,out)=>{ src(t,A1); gauss(A1,GS,30*ss(clamp(u/0.7))); LINE(t,A2);
  for(let i=0;i<N;i++){ const e=smooth(clamp((u-0.3)/0.7)); out[i][0]=GS[i][0]+(A2[i][0]-GS[i][0])*e; out[i][1]=GS[i][1]+(A2[i][1]-GS[i][1])*e; } }); }
function fromLine(dst,d=0.55){ return leg(d,(u,t,out)=>{ const v=1-u; dst(t,A1); gauss(A1,GS,30*ss(clamp(v/0.7))); LINE(t,A2);
  for(let i=0;i<N;i++){ const e=smooth(clamp((v-0.3)/0.7)); out[i][0]=GS[i][0]+(A2[i][0]-GS[i][0])*e; out[i][1]=GS[i][1]+(A2[i][1]-GS[i][1])*e; } }); }
const live=st=>(t,out)=>shape(st,t,out);
const frozen=(t,out)=>{ for(let i=0;i<N;i++){ out[i][0]=SRC[i][0]; out[i][1]=SRC[i][1]; } };
// transición de la cuarta vuelta: un frente ancho y suave lleva la forma vieja a la nueva de un extremo al otro,
// y mientras tanto una onda larga recorre la línea en perpendicular
let prev="line", tChange=-10, sweepDir=1, FAST=1, ERR=0, NERV=false, IDLE=0; const TOLD=mk(), TNEW=mk(), SNAP=mk(), EB=new Float32Array(N);
// retrasos irregulares a lo largo de la línea (ruido suavizado, ±0,3 s) para el cambio nervioso
const JIT=(()=>{ const r=[]; for(let i=0;i<N;i++) r.push(rnd()-0.5); const o=new Float32Array(N); let m=0;
  for(let i=0;i<N;i++){ let s=0,c=0; for(let k=-20;k<=20;k++){ const j=i+k; if(j>=0&&j<N){ s+=r[j]; c++; } } o[i]=s/c; m=Math.max(m,Math.abs(o[i])); }
  for(let i=0;i<N;i++) o[i]*=0.3/m; return o; })();
function go(to,t){
  if(to===cur) return;
  if(cur==="rest"){ waveFill(t-waveT0); for(let i=0;i<N;i++) P[i][1]+=WDY[i]; }   // la ola en curso pasa a los muelles: sin salto
  waveT0=-99; whipT0=-99; pending=null; pendingAt=null;
  if(t-tChange<2.0*FAST){ for(let i=0;i<N;i++){ SNAP[i][0]=P[i][0]; SNAP[i][1]=P[i][1]; } prev="snap"; } else prev=cur;   // interrumpida: parte de donde está, sin tirón
  ERR=NERV&&(to==="tool"||to==="speak")?1:0;           // cambio nervioso: el doble de rápido, con el frente a trompicones
  FAST=ERR?0.38:to==="listen"?0.5:to==="fonly"?0.6:0.65;   // Sito: transiciones más rápidas (1,3 s; escucha 1 s)   // escuchar responde ya: la ola corre más deprisa
  if(to==="rest"&&prev!=="fonly") IDLE=0;
  cur=to; tChange=t; sweepDir=to==="rest"?1:to==="fonly"?-1:(rnd()<0.5?1:-1);   // hacia el nombre se escribe (izquierda a derecha); hacia la F se recoge
  if(to==="rest"){ nextWave=t+4.5; whipT0=t+2.0*FAST; }     // al terminar de escribirse, el latigazo de la cola

  paint();
}
function target(t,out){
  const since=(t-tChange)/FAST;
  if(pending && pendingAt===null && since>1.6) pendingAt=t+pending.hold;
  shape(cur,t,TNEW); if(prev==="snap") for(let i=0;i<N;i++){ TOLD[i][0]=SNAP[i][0]; TOLD[i][1]=SNAP[i][1]; } else shape(prev,t,TOLD);
  if(since>=2.0+0.3*ERR){ for(let i=0;i<N;i++){ out[i][0]=TNEW[i][0]; out[i][1]=TNEW[i][1]; } }
  else {
    for(let i=0;i<N;i++){ const s=sweepDir>0?i/(N-1):1-i/(N-1), e=smooth(clamp((since-0.9*s-ERR*(JIT[i]+0.3))/1.1)); EB[i]=e;
      out[i][0]=TOLD[i][0]+(TNEW[i][0]-TOLD[i][0])*e; out[i][1]=TOLD[i][1]+(TNEW[i][1]-TOLD[i][1])*e; }
    // el frente se alisa (sin picos donde se cruzan la forma vieja y la nueva) y lleva encima la onda: lo ya llegado queda quieto
    gauss(out,GW,8); const A=cur==="rest"?10:cur==="fonly"?8:16;
    for(let i=0;i<N;i++){ const w=4*EB[i]*(1-EB[i]); GS[i][0]=out[i][0]+(GW[i][0]-out[i][0])*w; GS[i][1]=out[i][1]+(GW[i][1]-out[i][1])*w; }
    for(let i=0;i<N;i++){ const a=GS[Math.max(0,i-3)], c2=GS[Math.min(N-1,i+3)], dx=c2[0]-a[0], dy=c2[1]-a[1], l=Math.hypot(dx,dy)||1;
      const w=4*EB[i]*(1-EB[i]), d=w*(A*Math.sin(Math.PI*2*2.2*(i/(N-1))-since*5.5)+ERR*9*Math.sin(Math.PI*2*7*(i/(N-1))+since*17)); out[i][0]=GS[i][0]-dy/l*d; out[i][1]=GS[i][1]+dx/l*d; }
    return; }
  if(cur==="rest"){ const tw=t-whipT0; if(tw>=0&&tw<0.3) for(let i=TS;i<N;i++) out[i][1]-=9*Math.sin(Math.PI*tw/0.3)*TAILW[i]; }
}
function step(t,dt){
  smoothVoice(t,dt); target(t,TN);
  if(pending && pendingAt!==null && t>=pendingAt){ const p=pending.st; pending=null; pendingAt=null; go(p,t); }
  if(cur==="rest" && !plan.length){
    if(t>=nextWave && !reduce){ IDLE++;
      if(IDLE%3===2){ go("fonly",t); pending={st:"rest",hold:1.2}; return; }   // cada tercera vez el nombre se recoge en la F y vuelve a brotar
      waveT0=t; whipDone=false; nextWave=t+7+3*(rnd()-0.5); }   // si no, la ola: cada 7 s ± 1,5 s
    const tw=t-waveT0; if(!whipDone && tw>1 && tw<2.8 && XF+(XMAX-XF)*(tw-1)/1.8>=XT){ whipT0=t; whipDone=true; }   // látigo al llegar a la cola
  }
  const soft=cur==="rest"&&(!LEG||LEG===RISE); for(let i=0;i<N;i++){ const c=soft?DAMP[i]:C0; V[i][0]+=(K*(TN[i][0]-P[i][0])-c*V[i][0])*dt; V[i][1]+=(K*(TN[i][1]-P[i][1])-c*V[i][1])*dt; }
  for(let pass=0;pass<2;pass++) for(let i=1;i<N-1;i++){ V[i][0]=0.5*V[i][0]+0.25*(V[i-1][0]+V[i+1][0]); V[i][1]=0.5*V[i][1]+0.25*(V[i-1][1]+V[i+1][1]); }
  for(let i=0;i<N;i++){ P[i][0]+=V[i][0]*dt; P[i][1]+=V[i][1]*dt; }
}
// lo que se pinta: los muelles más la ola de reposo
function drawn(t){ const on=cur==="rest"&&!plan.length&&!reduce; const ph=on?waveFill(t-waveT0):(WDY.fill(0),WMUL.fill(1),0);
  for(let i=0;i<N;i++){ DR[i][0]=P[i][0]; DR[i][1]=P[i][1]+WDY[i]; }
  if(BREATH>0) for(let i=O_RANGE[0]-8;i<=O_RANGE[1]+8;i++){ const b=ss(clamp((i-O_RANGE[0]+8)/8))*ss(clamp((O_RANGE[1]+8-i)/8)); WMUL[i]*=1+0.25*BREATH*b; }
  return ph; }

/* ================= Pintado: una pasada de trazo + cintas solo donde cambia el grosor ================= */
function strokeRange(c,pts,a,b){ c.beginPath(); c.moveTo(pts[a][0],pts[a][1]);
  for(let i=a+1;i<b;i++) c.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);
  c.lineTo(pts[b][0],pts[b][1]); c.stroke(); }
function ribbon(c,pts,a,b,wf){ // contorno de grosor variable; mismo sentido en toda la cinta, así el relleno nonzero une los cruces
  const n=pts.length, L=[], R=[]; let nx0=0, ny0=-1;
  for(let i=a;i<=b;i++){ const p=pts[Math.max(0,i-1)], q=pts[Math.min(n-1,i+1)]; let dx=q[0]-p[0], dy=q[1]-p[1]; const l=Math.hypot(dx,dy);
    if(l>1e-6){ nx0=-dy/l; ny0=dx/l; } const h=wf(i)/2; L.push([pts[i][0]+nx0*h,pts[i][1]+ny0*h]); R.push([pts[i][0]-nx0*h,pts[i][1]-ny0*h]); }
  const E=[...L,...R.reverse()];
  c.beginPath(); c.moveTo(E[0][0],E[0][1]);
  for(let k=1;k<E.length-1;k++){ if(k===L.length-1||k===L.length){ c.lineTo(E[k][0],E[k][1]); continue; } c.quadraticCurveTo(E[k][0],E[k][1],(E[k][0]+E[k+1][0])/2,(E[k][1]+E[k+1][1])/2); }
  c.lineTo(E[E.length-1][0],E[E.length-1][1]); c.closePath(); c.fill("nonzero");
  for(const i of [a,b]){ c.beginPath(); c.arc(pts[i][0],pts[i][1],wf(i)/2,0,7); c.fill(); } }
// pts con n puntos; tin/tout: largo de los remates; tip: grosor de la punta del lar; mul: brasa y respiración (o null)
function drawLine(c,pts,w,tin,tout,tip,mul){
  const n=pts.length, taper=i=> i<tin ? tip+(1-tip)*smooth(i/tin) : i>n-1-tout ? 0.14+0.86*smooth((n-1-i)/tout) : 1;
  const wf=i=>w*taper(i)*(mul?mul[i]:1);
  c.lineCap="round"; c.lineJoin="round"; c.lineWidth=w; strokeRange(c,pts,tin,n-1-tout);
  ribbon(c,pts,0,tin,wf); ribbon(c,pts,n-1-tout,n-1,wf);
  if(mul){ let i=0; while(i<n){ while(i<n&&mul[i]<=1.002) i++; let s0=i; while(i<n&&!(mul[i]<=1.002)) i++; if(i>s0+1) ribbon(c,pts,Math.max(0,s0-1),Math.min(n-1,i),wf); } }
}

/* costura: modelo. Sin lienzo ni bucle propio: devuelve los muelles y las formas para pintarlos fuera
   (la capa WebGL de la landing y la tele de Fogar TV). El consumidor llama a go/step/drawn y lee DR y WMUL. */
if(opts.modelo){ for(let i=0;i<N;i++){ P[i][0]=LX0+(LX1-LX0)*i/(N-1); P[i][1]=BASE; }
  return {go,step,drawn,shape,drawLine,DR,WMUL,N,W,H,BASE,XMIN,XMAX,I_TIN,I_TOUT,TIP,STROKE,reduce,
    set sweep(v){ sweepDir=v; },get cur(){ return cur; },get VS(){ return VS; },get SS(){ return SS; }}; }

/* ===== Pintado con los tokens del sistema: el color sale de tokens.css, así que un cambio de token la recolorea ===== */
const css=getComputedStyle(document.documentElement);
const tok=n=>css.getPropertyValue("--"+n).trim();
const h2r=h=>{ h=h.replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join(""); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)); };
const mixc=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const PAL={}; for(const k of ["hueso","ascua","llama","chispa","contra","noche"]) PAL[k]=(opts.paleta&&opts.paleta[k])||tok(k)||"#888888"; // costura: paleta por opción
const HALO=opts.halo??1, HUMO=opts.humo||null, GIRO=opts.giro||0; // costura: halo, color del humo (null = sin humo) y giro (volumen de cinta, 0–1)
// propuesto: el color de cada estado (paso 3 de la fase 6)
const STP={rest:{f:.55,v:.05,cols:["ascua","llama","chispa","llama"],b:.5},
  listen:{f:1.1,v:.28,cols:["llama","chispa","contra","chispa"],b:.55},
  think:{f:1.6,v:.38,cols:["contra","llama","ascua","contra","chispa"],b:.45},
  tool:{f:3.4,v:1.05,cols:["contra","chispa","ascua","llama"],b:.4},
  speak:{f:.9,v:.5,cols:["ascua","llama","chispa","llama"],b:.85}};
function sampleCyc(cols,u){ const n=cols.length, x=((u%1)+1)%1*n, k=Math.floor(x), f=x-k; return mixc(cols[k%n],cols[(k+1)%n],f*f*(3-2*f)); }
function stopCol(w,x,t){ let acc=[0,0,0], tot=0;
  for(const st in w){ const wt=w[st]; if(wt<0.01) continue; const p=STP[st], u=x*p.f-t*p.v+0.18*Math.sin(2*Math.PI*(x*0.6+t*p.v*0.4));
    let col=sampleCyc(p.cols.map(k=>h2r(PAL[k])),u); if(st==="listen") col=mixc(col,h2r(PAL.chispa),0.4*VS);
    acc=acc.map((v,i)=>v+col[i]*wt); tot+=wt; }
  return tot?acc.map(v=>v/tot):h2r(PAL.llama); }
function lineGrad(c,w,t){ const g=c.createLinearGradient(XMIN-30,0,XMAX+30,0); for(let k=0;k<=20;k++){ g.addColorStop(k/20,`rgb(${stopCol(w,k/20,t).map(Math.round).join(",")})`); } return g; }
function flameGrad(c,t){ const g=c.createLinearGradient(0,BASE+30,0,30); g.addColorStop(0,PAL.ascua); g.addColorStop(0.2+0.05*Math.sin(t*7.3),PAL.llama); g.addColorStop(0.5+0.08*Math.sin(t*11.1+1),PAL.chispa); g.addColorStop(1,PAL.chispa); return g; }
const bl=document.createElement("canvas");
/* costura: halo y humo no siguen a STK (anchura en espacio 1000, como en fogar-brand); con el blur mínimo de 4 px (el escalado ×4)
   bajan de intensidad en lienzos pequeños en vez de crecer. */
function bloom(c,pts,style,amt){ const w=c.canvas.width, h=c.canvas.height, bw=Math.max(1,Math.round(w/4)), bh=Math.max(1,Math.round(h/4)); if(bl.width!==bw||bl.height!==bh){ bl.width=bw; bl.height=bh; }
  const x=bl.getContext("2d"); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,bw,bh); x.setTransform(bw/W,0,0,bw/W,0,0); x.lineCap=x.lineJoin="round"; x.strokeStyle=style(x); x.lineWidth=STROKE*3.2; strokeRange(x,pts,0,pts.length-1);
  c.save(); c.setTransform(1,0,0,1,0,0); c.globalCompositeOperation="lighter"; c.globalAlpha=Math.min(1,amt); c.imageSmoothingQuality="high"; const br=w/110*HALO, bk=Math.min(1,br/4); c.globalAlpha=Math.min(1,amt)*bk; c.filter=`blur(${Math.max(4,Math.round(br))}px)`; c.drawImage(bl,0,0,w,h); c.filter="none"; c.globalAlpha=Math.min(1,amt*.5)*bk; c.drawImage(bl,0,0,w,h); c.restore(); }
const ctx=cv.getContext("2d"); // costura
function fitCv(){ const dpr=Math.max(1,window.devicePixelRatio||1), w=Math.round((cv.clientWidth||600)*dpr); if(w>0&&cv.width!==w){ cv.width=w; cv.height=Math.round(w*0.42); }
  STK=Math.max(STROKE,TRAZO_MIN*W/(cv.clientWidth||600)); }
/* costura: grosor mínimo. Por debajo de 1,09 px CSS el trazo se rompe; 1,09 px es lo que mide fogar-palabra.svg en su tamaño
   mínimo de marca (3,26 / 288,27 × 96 px de alto). En grande, el STROKE de siempre: no engorda. */
const TRAZO_MIN=3.26/288.27*96; let STK=STROKE;
/* costura: humo. Un historial corto del trazo (una copia cada 3 fotogramas) pintado a ¼ de resolución (blur ≥ 4 px, el escalado, para que no salga a bloques): cada copia sube,
   engorda y se apaga con la edad. Sin realimentación, así que no deja poso. */
const hb=document.createElement("canvas"), HIST=[], HMAX=14; let hn=0;
function smoke(pts,t){ const w=cv.width, h=cv.height, bw=Math.max(1,Math.round(w/4)), bh=Math.max(1,Math.round(h/4));
  if(hb.width!==bw||hb.height!==bh){ hb.width=bw; hb.height=bh; }
  if(hn++%3===0){ HIST.unshift(pts.map(p=>[p[0],p[1]])); if(HIST.length>HMAX) HIST.pop(); }
  const x=hb.getContext("2d"); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,bw,bh); x.lineCap=x.lineJoin="round"; x.strokeStyle=HUMO;
  for(let k=HIST.length-1;k>=0;k--){ const a=(k+1)/(HMAX+1), q=HIST[k];
    x.setTransform(bw/W,0,0,bw/W,Math.sin(t*0.9+k*0.6)*a*3,-a*a*bh*0.32); x.globalAlpha=0.2*(1-a)*(1-a); x.lineWidth=STROKE*(1.4+a*7); strokeRange(x,q,0,q.length-1); }
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=Math.min(1,w/180/4); ctx.imageSmoothingQuality="high"; ctx.filter=`blur(${Math.max(4,Math.round(w/180))}px)`; ctx.drawImage(hb,0,0,w,h); ctx.filter="none"; ctx.restore(); }
function paintLine(pts,mul,w,t,f){ const s=cv.width/W; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
  let amt=0; for(const st in w) amt+=w[st]*STP[st].b*(st==="listen"?0.6+0.8*VS:1);
  amt*=HALO; if(HUMO) smoke(pts,t);
  if(amt>0.01) bloom(ctx,pts,x=>f>0.5?flameGrad(x,t):lineGrad(x,w,t),amt);
  ctx.setTransform(s,0,0,s,0,0); ctx.fillStyle=ctx.strokeStyle=lineGrad(ctx,w,t); trazo(pts,mul,t);
  if(f>0.01){ ctx.globalAlpha=f; ctx.fillStyle=ctx.strokeStyle=flameGrad(ctx,t); trazo(pts,mul,t); ctx.globalAlpha=1; }
  if(GIRO) brillo(pts,t); }
/* costura: giro. La línea como una cinta que gira sobre sí misma: el grosor sigue una onda que viaja por el trazo
   (cara y canto) y un filo de luz encima, desplazado hacia arriba, le da cuerpo de tubo. Sin giro, el trazo de siempre. */
function anchoGiro(i,n,t){ return 1-GIRO*0.55+GIRO*1.1*(0.5+0.5*Math.sin(6.2832*(i/n)*1.4-t*1.8)); }
function trazo(pts,mul,t){ if(!GIRO){ drawLine(ctx,pts,STK,I_TIN,I_TOUT,TIP/STROKE,mul); return; }
  const n=pts.length, tp=TIP/STROKE, taper=i=> i<I_TIN ? tp+(1-tp)*smooth(i/I_TIN) : i>n-1-I_TOUT ? 0.14+0.86*smooth((n-1-i)/I_TOUT) : 1;
  ribbon(ctx,pts,0,n-1,i=>STK*1.25*taper(i)*anchoGiro(i,n,t)*(mul?mul[i]:1)); }
function brillo(pts,t){ const n=pts.length; ctx.save(); ctx.lineCap="round"; ctx.strokeStyle="rgba(255,252,246,0.8)";
  for(let a=0;a<n-1;a+=6){ const k=anchoGiro(a,n,t); if(k<1.05) continue; ctx.globalAlpha=Math.min(1,(k-1.05)*1.6)*GIRO; ctx.lineWidth=STK*0.26*k;
    ctx.beginPath(); ctx.moveTo(pts[a][0],pts[a][1]-STK*0.3*k); const b=Math.min(n-1,a+6); ctx.lineTo(pts[b][0],pts[b][1]-STK*0.3*anchoGiro(b,n,t)); ctx.stroke(); }
  ctx.restore(); }

/* ===== costura: bucle propio, sin controles; el consumidor elige el estado y el nivel de voz ===== */
const SW={rest:1,listen:0,think:0,tool:0,speak:0}; let flameF=0, lastT=performance.now(), accT=0, raf=0, alive=true;
const now=()=>performance.now()/1000;
function paint(){}
function frame(){ if(!alive) return; const nw=performance.now(), d=Math.min(0.25,(nw-lastT)/1000); lastT=nw; accT+=d;
  const t0=nw/1000-accT; let k=0; while(accT>=1/120){ step(t0+k/120,1/120); accT-=1/120; k++; }
  const cs=cur==="fonly"||cur==="line"?"rest":cur; for(const st in SW) SW[st]+=((st===cs?1:0)-SW[st])*Math.min(1,d*3); flameF+=((cs==="speak"?1:0)-flameF)*Math.min(1,d*3);
  drawn(nw/1000); fitCv(); paintLine(DR,WMUL,SW,nw/1000,flameF); raf=requestAnimationFrame(frame); }
/* costura: pausa. Fuera de pantalla o con la pestaña oculta no se pinta; al volver sigue donde estaba. */
let visto=true;
function corre(){ const on=alive&&visto&&!document.hidden;
  if(on&&!raf){ lastT=performance.now(); accT=0; raf=requestAnimationFrame(frame); }
  else if(!on&&raf){ cancelAnimationFrame(raf); raf=0; } }
const io=reduce||typeof IntersectionObserver==="undefined"?null:new IntersectionObserver(([e])=>{ visto=e.isIntersecting; corre(); });
io?.observe(cv); if(!reduce) document.addEventListener("visibilitychange",corre);
function drawStatic(){ const cs=cur==="line"||cur==="fonly"?"rest":cur, out=mk(); shape(cs,1.3,out); fitCv(); cv.style.transition="opacity .16s ease-out"; cv.style.opacity="0";
  setTimeout(()=>{ if(!alive) return; paintLine(out,null,{[cs]:1},0,cs==="speak"?1:0); cv.style.opacity="1"; },160); }
// costura: repintado sin fundido para resize (el ResizeObserver dispara al observar y mientras se arrastra)
function pintaYa(){ const cs=cur==="line"||cur==="fonly"?"rest":cur, out=mk(); shape(cs,1.3,out); fitCv(); paintLine(out,null,{[cs]:1},0,cs==="speak"?1:0); }
let boot=0; // costura: el arranque a reposo; un set() antes de los 400 ms lo cancela para no pisar el estado pedido
if(reduce){ cur="rest"; drawStatic(); }
else { for(let i=0;i<N;i++){ P[i][0]=LX0+(LX1-LX0)*i/(N-1); P[i][1]=BASE; } cur="line"; boot=setTimeout(()=>alive&&go("rest",now()),400); corre(); }
return {
  /** @param {"rest"|"listen"|"think"|"tool"|"speak"|"line"} st */
  set(st){ clearTimeout(boot); if(st===cur) return; if(reduce){ cur=st; drawStatic(); return; } go(st,now()); },
  /** Repinta tras cambiar de tamaño (solo hace falta con «reducir movimiento»). */
  resize(){ if(reduce) pintaYa(); },
  destroy(){ alive=false; clearTimeout(boot); cancelAnimationFrame(raf); raf=0; io?.disconnect(); document.removeEventListener("visibilitychange",corre); },
};
}
