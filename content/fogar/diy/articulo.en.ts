// "How Fogar is built", in English. Same markup as articulo.es.ts: ids and data-estado stay as they are there.
import { PROTOCOLO, REPOS } from "@/lib/repos";
import type { ArticuloContenido } from "./articulo.es";
import { a } from "./html";

export const articuloEn: ArticuloContenido = {
  meta: {
    title: "How Fogar is built",
    description:
      "Fogar puts whisper.cpp, OpenClaw and Kokoro behind a gateway of its own. How a voice command travels, which pieces are open source and where the limits are today.",
  },
  h1: "How Fogar is built: the architecture of a voice agent",
  lede: "Fogar is a personal agent with a voice: you talk to it, it remembers what you tell it and it gets things done around the house. Its core is built from open-source pieces: whisper.cpp to understand what you say, OpenClaw as the orchestrator and Kokoro for the voice. You install it and run it on a machine of your own. This entry explains what happens inside, from the moment you speak until it answers.",
  antes: "<strong>Before you start:</strong> there's nothing to set up. It helps to know what a WebSocket is (a connection that stays open so data can flow both ways), but you don't need to.",
  secciones: [
    {
      id: "resumen",
      toc: "The architecture at a glance",
      html: `
<h2>Fogar's architecture at a glance</h2>
<p>Fogar keeps the voice apart from the brain. One part listens and speaks. Another understands what you ask for and does it. Between the two there is a single front door, the gateway, which decides who can talk to whom.</p>
<!--figura-->`,
    },
    {
      id: "recorrido",
      toc: "What happens when you talk to it",
      html: `
<h2>What happens when you talk to Fogar</h2>
<p>Let's follow one specific sentence: <span class="frase">“OK Fogar, turn off the living room light”</span>. Picture yourself saying it to a device that works as a speaker in the living room, with fogar-voice installed.</p>

<section id="paso-1" data-estado="listen">
  <h3>1. The client listens</h3>
  <p>A client is any device with a microphone or a speaker that talks to Fogar. Today there are two:</p>
  <ul>
    <li><strong>Fogar TV</strong>, for the TV. More on it below.</li>
    <li><strong>fogar-voice</strong>, a very simple, open-source, cross-platform voice client. Also covered below.</li>
  </ul>
  <p>fogar-voice ships with “OK Nabu” as its wake word. In this example we use “OK Fogar”. If you'd rather use a different word, you can train it with ${a(REPOS.wakeTrainer, "fogar-wake-trainer")}.</p>
  <p>fogar-voice listens all the time, but it doesn't send any audio. It spots the wake word on the device itself with openWakeWord, an open library built for exactly that. It only starts sending audio once it hears it.</p>
  <p>Once it hears it, it streams your voice to the gateway in chunks while you're still speaking, over the WebSocket connection it has kept open since it started. It also sends the second and a half before the wake word, so the start of your sentence isn't cut off.</p>
  <p>How does it know you've finished? With fogar-transcriber, the client decides. fogar-voice treats the sentence as done after a second and a half of silence. A client with a button closes it when you let go. With ElevenLabs, its server is the one that detects the end of the sentence.</p>
</section>

<section id="paso-2" data-estado="think">
  <h3>2. The gateway decides whether you get in</h3>
  <p>fogar-gateway is the only way in. Every client has its own key, and the gateway uses it to check that the client is registered and active. If the key isn't valid, the connection is closed right there. If someone disables the client or changes its key, the open session is cut within about ten seconds.</p>
  <p>The gateway also decides which agent you talk to. An agent is a version of Fogar with its own personality, memory and permissions, and each person creates as many as they like in their orchestrator. Each client can ask for an agent when it connects. If it doesn't ask for one, it gets its default. Whoever runs the gateway can limit which agents each client can reach. The living room speaker, for example, can always go to an agent set up for the house.</p>
</section>

<section id="paso-3" data-estado="think">
  <h3>3. Your voice becomes text</h3>
  <p>The gateway forwards the audio to the transcription service. That can be fogar-transcriber, our server built on whisper.cpp. It can also be ElevenLabs, an external provider. Whoever runs the gateway picks one, and it applies to all of its clients.</p>
  <p>Transcription happens live. While you speak, the client receives the text as it's recognised. When you finish, it gets the final transcript: <span class="frase">“turn off the living room light”</span>.</p>
  <p>That transcript doesn't go straight to the orchestrator. It goes back to the client first, which confirms it and sends it on. That way a client can show you the text and let you fix it, or send it as is if you're talking hands-free.</p>
</section>

<section id="paso-4" data-estado="tool">
  <h3>4. The orchestrator thinks and acts</h3>
  <p>The text reaches the orchestrator, which acts as the brain. Today we use OpenClaw, an open-source AI orchestrator. That's where everything that lets Fogar remember and act lives:</p>
  <ul>
    <li><strong>Memory.</strong> It keeps what it knows about you and your preferences.</li>
    <li><strong>Agents.</strong> The ones you've created, each with its own memory and permissions.</li>
    <li><strong>Tools.</strong> It looks things up, carries out actions and talks to other systems over MCP (a standard protocol for giving an AI model tools): Home Assistant for the house, and also Obsidian, Notion or whatever you already use. In our sentence, it asks Home Assistant to turn off the living room light.</li>
    <li><strong>Scheduled tasks.</strong> It does things later or on a schedule, and lets you know when they're done.</li>
  </ul>
  <p>Each client has its own conversation with each agent. If it disconnects and reconnects, Fogar picks the context back up.</p>
</section>

<section id="paso-5" data-estado="speak">
  <h3>5. The answer comes back as text and voice</h3>
  <p>The connection with the client works both ways, live. As the orchestrator's answer arrives, the gateway forwards it to the client and to the speech synthesiser at the same time. fogar-speaker, our synthesiser built on Kokoro (an open-source voice model), generates the audio sentence by sentence, without waiting for the full text. The client gets both text and audio over the same connection: “Done, I've turned off the living room light”.</p>
  <p>What happens next is up to each client. Some reveal the text in time with the audio, even if it all arrived earlier, so reading and listening stay in step.</p>
</section>

<section id="cortar" data-estado="listen">
  <h3>If you interrupt it</h3>
  <p>Cutting Fogar off while it's talking also depends on the client:</p>
  <ul>
    <li><strong>Talking over it.</strong> This is what's known as <em>barge-in</em>. If the client keeps sending audio while Fogar speaks and has this option turned on in the gateway, as soon as the gateway recognises a few of your words it cancels the answer and listens to you.</li>
    <li><strong>With a new sentence.</strong> Even with <em>barge-in</em> turned off, a new, complete sentence cancels the answer in progress and follows the normal path.</li>
    <li><strong>With a gesture.</strong> The client can cancel the answer whenever it wants. In Fogar TV, by pressing the talk button on your phone again. In fogar-voice, by saying the wake word again while Fogar is answering.</li>
  </ul>
</section>`,
    },
    {
      id: "fogar-voice",
      estado: "listen",
      toc: "fogar-voice, the voice client",
      html: `
<h2>fogar-voice, the voice client</h2>
<p>fogar-voice is Fogar's voice client: it listens for the wake word, sends your voice to the gateway and plays back the answer. It's cross-platform, open source and under active development. This is where it runs today:</p>
<div class="tabla">
  <table class="compat">
    <thead><tr><th scope="col">System</th><th scope="col">Status</th></tr></thead>
    <tbody>
      <tr><th scope="row">macOS</th><td><span class="si">Supported</span>, with an installer</td></tr>
      <tr><th scope="row">Android</th><td><span class="si">Supported</span>, with an installer, through Termux (a Linux terminal for Android)</td></tr>
      <tr><th scope="row">Linux</th><td><span class="si">Supported</span>; manual install</td></tr>
      <tr><th scope="row">Windows</th><td><span class="no">Not supported yet</span></td></tr>
      <tr><th scope="row">ESP32</th><td><span class="no">No client yet</span> for microcontrollers like the ESP32</td></tr>
    </tbody>
  </table>
</div>
<p>How to install it on each system is in the ${a(`${REPOS.voice}#readme`, "fogar-voice README")}.</p>`,
    },
    {
      id: "tele",
      estado: "speak",
      toc: "The TV with Fogar TV",
      html: `
<h2>Another client: the TV with Fogar TV</h2>
<p>Fogar TV turns your TV into a Fogar client. You need a mini PC or an old laptop plugged into the TV over HDMI, plus your phone. Behind it sits the same chain as before: gateway, transcription, orchestrator and synthesis.</p>
<p>There are two differences from fogar-voice:</p>
<ul>
  <li><strong>There's no wake word.</strong> Your phone is both remote and microphone: you press the talk button and speak. No app needed. You open a web page, type the code shown on the TV and it's paired.</li>
  <li><strong>You can see what Fogar is doing.</strong> The TV shows what you said and whether Fogar is listening, thinking, using a tool or speaking.</li>
</ul>
<p>If you're watching a series and ask “where was this filmed?”, your question appears on screen, then “Looking up the location”, and then the answer. The series keeps playing.</p>`,
    },
    {
      id: "abierto",
      toc: "What's Fogar's and what's open",
      html: `
<h2>What belongs to Fogar and what is open source</h2>
<div class="tabla">
  <table class="piezas">
    <thead><tr><th scope="col">Piece</th><th scope="col">What it does</th><th scope="col">Technology</th><th scope="col">Code</th></tr></thead>
    <tbody>
      <tr><th scope="row">fogar-gateway</th><td data-label="What it does">Front door: keys, sessions, agents and voice coordination</td><td data-label="Technology">Python, FastAPI, WebSocket</td><td data-label="Code">${a(REPOS.gateway, "fogar-gateway")}</td></tr>
      <tr><th scope="row">fogar-transcriber</th><td data-label="What it does">Live speech to text</td><td data-label="Technology">C++, whisper.cpp, CUDA (optional)</td><td data-label="Code">${a(REPOS.transcriber, "fogar-transcriber")}</td></tr>
      <tr><th scope="row">fogar-speaker</th><td data-label="What it does">Live text to speech</td><td data-label="Technology">Python, Kokoro ONNX</td><td data-label="Code">${a(REPOS.speaker, "fogar-speaker")}</td></tr>
      <tr><th scope="row">fogar-voice</th><td data-label="What it does">Cross-platform voice client</td><td data-label="Technology">Python, openWakeWord</td><td data-label="Code">${a(REPOS.voice, "fogar-voice")}</td></tr>
      <tr><th scope="row">fogar-wake-trainer</th><td data-label="What it does">Trains wake words</td><td data-label="Technology">Python, openWakeWord</td><td data-label="Code">${a(REPOS.wakeTrainer, "fogar-wake-trainer")}</td></tr>
      <tr><th scope="row">OpenClaw</th><td data-label="What it does">Orchestrator: reasoning, memory, tools, agents</td><td data-label="Technology">Node.js, TypeScript</td><td data-label="Code">${a("https://github.com/openclaw/openclaw", "openclaw")}</td></tr>
    </tbody>
  </table>
</div>
<p>Every piece in the table is open source. Fogar TV is closed source.</p>
<p>If you want to build your own client, the gateway protocol is documented in ${a(PROTOCOLO, "<code>docs/client-protocol.md</code>")}. Audio travels uncompressed and in mono: it goes up as PCM Float32 at 16 kHz and comes down as PCM16 at 24 kHz.</p>`,
    },
    {
      id: "por-que",
      toc: "Why it's split up this way",
      html: `
<h2>Why it's split up this way</h2>
<p><strong>The gateway shields everything else.</strong> Clients only ever talk to the gateway. If OpenClaw changes its protocol, the fix goes into the gateway and the clients don't have to change. The same would apply if we switched to another orchestrator tomorrow.</p>
<p><strong>Every piece can be swapped.</strong> Transcription and synthesis can be ours or an external provider's. Switching from one to the other doesn't touch anything in the client.</p>
<p><strong>Every client stands on its own.</strong> Each one has its own key and its own session. If you lose a device, you revoke its key and everything else carries on.</p>`,
    },
    {
      id: "casa",
      toc: "Where it runs, what leaves home",
      html: `
<h2>Where Fogar runs and what leaves your home</h2>
<p>Every piece of Fogar installs and runs on a machine of your own. There's no Fogar cloud service your voice passes through. Something always leaves your home: what leaves, and where it goes, depends on the external providers you choose:</p>
<!--figura-->
<ul>
  <li><strong>Your voice.</strong> With fogar-transcriber and fogar-speaker, your voice is processed on your own machines. If you use ElevenLabs for transcription, it receives your audio. If you use it for Fogar's voice, it receives the text of the answers.</li>
  <li><strong>The language model.</strong> OpenClaw can use a local model or a cloud one. If it's in the cloud, what you say reaches that provider, already turned into text.</li>
  <li><strong>Access from outside.</strong> If you expose the gateway through a tunnel or an external proxy to use it away from home, the audio goes through that service.</li>
</ul>
<p>Each provider has its own terms about what it keeps and for how long. It's worth reading them before you pick one.</p>
<p>With a cloud model, <span class="frase">“turn off the living room light”</span> goes out as text to that provider. You choose where each thing goes, so your data doesn't end up scattered across services you don't know. And because the ecosystem is open, you can swap any piece for a compatible one or plug in your own.</p>`,
    },
    {
      id: "home-assistant",
      estado: "speak",
      toc: "Fogar inside Home Assistant",
      html: `
<h2>Fogar inside Home Assistant</h2>
<p>It isn't the main flow, but Fogar's pieces can also be used from Home Assistant, in the opposite direction to the example. fogar-speaker provides the voice through Wyoming, Home Assistant's voice protocol. fogar-gateway acts as the conversation agent through its OpenAI-compatible API. That way, Home Assistant's voice assistant can be Fogar.</p>`,
    },
    {
      id: "limites",
      toc: "Current limitations",
      html: `
<h2>Current limitations</h2>
<ul>
  <li><strong>One conversation per client and agent.</strong> You can't open several separate conversations from the same client.</li>
  <li><strong>Reconnecting doesn't recover the answer in progress.</strong> If the connection drops halfway through an answer, that answer is lost. The conversation's context is kept.</li>
  <li><strong>Notifications need an open connection.</strong> If Fogar wants to tell you something and your client isn't connected, the notification is lost. It isn't saved for when the client reconnects.</li>
  <li><strong>Notifications can't be interrupted.</strong> You can cut off an answer to something you asked, but not a notification Fogar sends on its own.</li>
</ul>`,
    },
    {
      id: "siguientes",
      toc: "Next steps",
      html: `
<h2>Next steps</h2>
<ul>
  <li>To install it, use the one-step command on the DIY page, or start with the ${a(`${REPOS.gateway}#readme`, "fogar-gateway README")} and the ${a(`${REPOS.voice}#readme`, "fogar-voice")} one.</li>
  <li>To write your own client, read the ${a(PROTOCOLO, "client protocol")}.</li>
  <li>To have your own wake word, use ${a(REPOS.wakeTrainer, "fogar-wake-trainer")}.</li>
</ul>`,
    },
  ],
  registro: [
    ["2026-11-13", "November 13, 2026", "Renamed to Fogar; tested versions updated."],
    ["2026-10-27", "October 27, 2026", "First version."],
  ],
};
