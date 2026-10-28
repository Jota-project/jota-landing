// "How Jota is built", in English. Same markup as article.es.ts: ids, data-state, data-node and data-go
// stay in Spanish because the JS and the home page link to them. Only the visible text changes.
import type { ArticleContent } from "./article.es";

export const articleEn: ArticleContent = {
  meta: {
    title: "How Jota is built",
    description:
      "Jota puts whisper.cpp, OpenClaw and Kokoro behind a gateway of its own. How a voice command travels, which pieces are open source and where the limits are today.",
  },
  skip: "Skip to the text",
  stageLabel: "Diagram of the path a sentence takes",
  whatIs: ["To get to know the product, see ", "what Jota is and what it can do", "."],
  back: "All DIY entries",
  head: `
<h1>How Jota is built: the <em>architecture</em> of a voice agent</h1>
<div class="meta">
<div class="meta-row"><b class="kind">Technical note</b><i aria-hidden="true">·</i><span class="stamp">stable</span><i aria-hidden="true">·</i>Difficulty&nbsp;<span>medium</span><i aria-hidden="true">·</i><span>9 min</span><i aria-hidden="true">·</i><time datetime="2026-10-27">Oct 27, 2026</time></div>
<details class="tested">
  <summary>Tested with&nbsp;<span>jota-gateway v1.21.0</span>, <span>OpenClaw 2026.10.5</span>&nbsp;and 4 more pieces</summary>
  <ul><li>jota-gateway v1.21.0</li><li>jota-transcriber v1.4.2</li><li>jota-speaker v1.1.6</li><li>jota-voice (main, 2026&#8209;10&#8209;26)</li><li>jota-wake-trainer v1.0.1</li><li>OpenClaw 2026.10.5</li></ul>
</details>
</div>
`,
  col: `
<p class="lede">Jota is a personal agent with a voice: you talk to it, it remembers what you tell it and it gets things done around the house. Its core is built from open-source pieces: whisper.cpp to understand what you say, OpenClaw as the orchestrator and Kokoro for the voice. You install it and run it on a machine of your own. This entry explains what happens inside, from the moment you speak until it answers.</p>

<nav class="strip quiet" id="strip" aria-label="The path of the sentence">
  <div class="smap-wrap"><div class="smap"><div class="smap-in" id="smap">
    <button class="sbtn" type="button" data-node="cliente" data-go="paso-1">Client</button>
    <i class="ln" aria-hidden="true"></i>
    <button class="sbtn is-hub" type="button" data-node="gateway" data-go="paso-2">Gateway</button>
    <i class="ln" aria-hidden="true"></i>
    <div class="sgroup" role="group" aria-label="Services the gateway coordinates">
      <button class="sbtn" type="button" data-node="transcripcion" data-go="paso-3" aria-label="Text (transcription)">Text</button>
      <button class="sbtn" type="button" data-node="orquestador" data-go="paso-4" aria-label="Brain (orchestrator)">Brain</button>
      <button class="sbtn" type="button" data-node="sintesis" data-go="paso-5" aria-label="Voice (synthesis)">Voice</button>
    </div>
    <span class="s-orb" id="sorb" aria-hidden="true"></span>
  </div></div></div>
  <p class="sline"><span id="sk">The sentence</span><b id="sv">“OK Jota, turn off the living room light”</b>
    <button class="splay" id="splay" type="button" aria-pressed="false" aria-label="Play the walkthrough">
      <svg class="i-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2.2v9.6c0 .5.5.8.9.5l7.4-4.8c.4-.3.4-.8 0-1L4.4 1.7c-.4-.3-.9 0-.9.5Z" fill="currentColor"/></svg>
      <svg class="i-stop" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.6" fill="currentColor"/></svg>
    </button>
  </p>
</nav>

<p class="before"><strong>Before you start:</strong> there's nothing to set up. It helps to know what a WebSocket is (a connection that stays open so data can flow both ways), but you don't need to.</p>

<ul class="contents" aria-label="In this entry">
  <li><a href="#resumen">Jota's architecture at a glance</a></li>
  <li><a href="#recorrido">What happens when you talk to Jota <span>5 steps</span></a></li>
  <li><a href="#jota-voice">jota-voice, the voice client</a></li>
  <li><a href="#tele">Another client: the TV with Jota-Screen</a></li>
  <li><a href="#abierto">What belongs to Jota and what is open source</a></li>
  <li><a href="#por-que">Why it's split up this way</a></li>
  <li><a href="#casa">Where Jota runs and what leaves your home</a></li>
  <li><a href="#home-assistant">Jota inside Home Assistant</a></li>
  <li><a href="#limites">Current limitations</a></li>
  <li><a href="#siguientes">Next steps</a></li>
</ul>

<section data-state="resumen" id="resumen">
  <h2>Jota's architecture at a glance</h2>
  <p>Jota keeps the voice apart from the brain. One part listens and speaks. Another understands what you ask for and does it. Between the two there is a single front door, the gateway, which decides who can talk to whom.</p>
  <figure class="m-fig" aria-label="Diagram of the path">
    <ol class="flow">
      <li><b>Client</b><span>your voice</span></li>
      <li class="hub"><b>jota-gateway</b><span>checks the client</span></li>
      <li class="branch"><b>Transcription</b><span>voice → text</span></li>
      <li class="branch"><b>Orchestrator</b><span>thinks and acts</span></li>
      <li class="branch"><b>Synthesis</b><span>text → voice</span></li>
      <li><b>Client</b><span>text and audio</span></li>
    </ol>
    <figcaption>Everything goes through the gateway: the client never talks to the other pieces directly.</figcaption>
  </figure>
</section>

<h2 id="recorrido">What happens when you talk to Jota</h2>
<p>Let's follow one specific sentence: “OK Jota, turn off the living room light”. Picture yourself saying it to a device that works as a speaker in the living room, with jota-voice installed.</p>

<section data-state="s1" id="paso-1">
  <h3>1. The client listens</h3>
  <p>A client is any device with a microphone or a speaker that talks to Jota. Today there are three:</p>
  <ul>
    <li><strong>Jota-Screen</strong>, for the TV. More on it below.</li>
    <li><strong>jota-voice</strong>, a very simple, open-source, cross-platform voice client. Also covered below.</li>
    <li><strong>The Jota app for iPhone</strong>, experimental and at an early stage.</li>
  </ul>
  <p>jota-voice ships with “OK Nabu” as its wake word. In this example we use “OK Jota”, which already has a usable <a href="https://github.com/jota-project/jota-wake-trainer/tree/main/projects/ok_jota" target="_blank" rel="noopener">first version</a> that we keep training. If you'd rather use a different word, you can train it with <a href="https://github.com/jota-project/jota-wake-trainer" target="_blank" rel="noopener">jota-wake-trainer</a>.</p>
  <p>jota-voice listens all the time, but it doesn't send any audio. It spots the wake word on the device itself with openWakeWord, an open library built for exactly that. Until it hears it, no audio leaves the device.</p>
  <p>Once it hears it, it streams your voice to the gateway in chunks while you're still speaking, over the WebSocket connection it has kept open since it started. It also sends the second and a half before the wake word, so the start of your sentence isn't cut off.</p>
  <p>How does it know you've finished? With jota-transcriber, the client decides. jota-voice treats the sentence as done after a second and a half of silence. A client with a button closes it when you let go. With ElevenLabs, its server is the one that detects the end of the sentence.</p>
</section>

<section data-state="s2" id="paso-2">
  <h3>2. The gateway decides whether you get in</h3>
  <p>jota-gateway is the only way in. Every client has its own key, and the gateway uses it to check that the client is registered and active. If the key isn't valid, the connection is closed right there. If someone disables the client or changes its key, the open session is cut within about ten seconds.</p>
  <p>The gateway also decides which agent you talk to. An agent is a version of Jota with its own personality, memory and permissions, and each person creates as many as they like in their orchestrator. Each client can ask for an agent when it connects. If it doesn't ask for one, it gets its default. Whoever runs the gateway can limit which agents each client can reach. The living room speaker, for example, can always go to an agent set up for the house.</p>
</section>

<section data-state="s3" id="paso-3">
  <h3>3. Your voice becomes text</h3>
  <p>The gateway forwards the audio to the transcription service. That can be jota-transcriber, our server built on whisper.cpp. It can also be ElevenLabs, an external provider. Whoever runs the gateway picks one, and it applies to all of its clients.</p>
  <p>Transcription happens live. While you speak, the client receives the text as it's recognised. When you finish, it gets the final transcript: “turn off the living room light”.</p>
  <p>That transcript doesn't go straight to the orchestrator. It goes back to the client first, which confirms it and sends it on. That way a client can show you the text and let you fix it, or send it as is if you're talking hands-free.</p>
</section>

<section data-state="s4" id="paso-4">
  <h3>4. The orchestrator thinks and acts</h3>
  <p>The text reaches the orchestrator, which acts as the brain. Today we use OpenClaw, an open-source AI orchestrator. That's where everything that lets Jota remember and act lives:</p>
  <ul>
    <li><strong>Memory.</strong> It keeps what it knows about you and your preferences.</li>
    <li><strong>Agents.</strong> The ones you've created, each with its own memory and permissions.</li>
    <li><strong>Tools.</strong> It looks things up, carries out actions and talks to other systems. It talks to the house through Home Assistant, connected over MCP (a standard protocol for giving an AI model tools). In our sentence, it asks Home Assistant to turn off the living room light.</li>
    <li><strong>Scheduled tasks.</strong> It does things later or on a schedule, and lets you know when they're done.</li>
  </ul>
  <p>Each client has its own conversation with each agent. If it disconnects and reconnects, Jota picks the context back up.</p>
</section>

<section data-state="s5" id="paso-5">
  <h3>5. The answer comes back as text and voice</h3>
  <p>The connection with the client works both ways, live. As the orchestrator's answer arrives, the gateway forwards it to the client and to the speech synthesiser at the same time. jota-speaker, our synthesiser built on Kokoro (an open-source voice model), generates the audio sentence by sentence, without waiting for the full text. The client gets both text and audio over the same connection: “Done, I've turned off the living room light”.</p>
  <p>What happens next is up to each client. Some reveal the text in time with the audio, even if it all arrived earlier, so reading and listening stay in step.</p>
</section>

<section data-state="cortar" id="cortar">
  <h3>If you interrupt it</h3>
  <p>Cutting Jota off while it's talking also depends on the client:</p>
  <ul>
    <li><strong>Talking over it.</strong> This is what's known as <em>barge-in</em>. If the client keeps sending audio while Jota speaks and has this option turned on in the gateway, as soon as the gateway recognises a few of your words it cancels the answer and listens to you.</li>
    <li><strong>With a new sentence.</strong> Even with <em>barge-in</em> turned off, a new, complete sentence cancels the answer in progress and follows the normal path.</li>
    <li><strong>With a gesture.</strong> The client can cancel the answer whenever it wants. In Jota-Screen, by pressing the talk button on your phone again. In jota-voice, by saying the wake word again while Jota is answering.</li>
  </ul>
</section>

<section data-state="voice" id="jota-voice">
  <h2>jota-voice, the voice client</h2>
  <p>jota-voice is Jota's voice client: it listens for the wake word, sends your voice to the gateway and plays back the answer. It's cross-platform, open source and under active development. This is where it runs today:</p>
  <div class="table-wrap">
    <table class="compat">
      <thead><tr><th scope="col">System</th><th scope="col">Status</th></tr></thead>
      <tbody>
        <tr><td>macOS</td><td data-label="Status"><span class="ok">Supported</span>, with an installer</td></tr>
        <tr><td>Android</td><td data-label="Status"><span class="ok">Supported</span>, with an installer, through Termux (a Linux terminal for Android)</td></tr>
        <tr><td>Linux</td><td data-label="Status"><span class="ok">Supported</span>; manual install</td></tr>
        <tr><td>Windows</td><td data-label="Status"><span class="no">Not supported yet</span></td></tr>
        <tr><td>ESP32</td><td data-label="Status"><span class="no">No client yet</span> for microcontrollers like the ESP32</td></tr>
      </tbody>
    </table>
  </div>
  <p>How to install it on each system is in the <a href="https://github.com/jota-project/jota-voice#readme" target="_blank" rel="noopener">jota-voice README</a>.</p>
</section>

<section data-state="screen" id="tele">
  <h2>Another client: the TV with Jota-Screen</h2>
  <p>Jota-Screen turns your TV into a Jota client. You need a mini PC or an old laptop plugged into the TV over HDMI, plus your phone. Behind it sits the same chain as before: gateway, transcription, orchestrator and synthesis.</p>
  <p>There are two differences from jota-voice:</p>
  <ul>
    <li><strong>There's no wake word.</strong> Your phone is both remote and microphone: you press the talk button and speak. No app needed. You open a web page, type the code shown on the TV and it's paired.</li>
    <li><strong>You can see what Jota is doing.</strong> The TV shows what you said and whether Jota is listening, thinking, using a tool or speaking.</li>
  </ul>
  <p>If you're watching a series and ask “where was this filmed?”, your question appears on screen, then “Looking up the location”, and then the answer. The series keeps playing.</p>
</section>

<section data-state="abierto" id="abierto">
  <h2>What belongs to Jota and what is open source</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th scope="col">Piece</th><th scope="col">What it does</th><th scope="col">Technology</th><th scope="col">Code</th></tr></thead>
      <tbody>
        <tr><td>jota-gateway</td><td data-label="What it does">Front door: keys, sessions, agents and voice coordination</td><td data-label="Technology">Python, FastAPI, WebSocket</td><td data-label="Code"><a href="https://github.com/jota-project/jota-gateway" target="_blank" rel="noopener">jota-gateway</a></td></tr>
        <tr><td>jota-transcriber</td><td data-label="What it does">Live speech to text</td><td data-label="Technology">C++, whisper.cpp, CUDA (optional)</td><td data-label="Code"><a href="https://github.com/jota-project/jota-transcriber" target="_blank" rel="noopener">jota-transcriber</a></td></tr>
        <tr><td>jota-speaker</td><td data-label="What it does">Live text to speech</td><td data-label="Technology">Python, Kokoro ONNX</td><td data-label="Code"><a href="https://github.com/jota-project/jota-speaker" target="_blank" rel="noopener">jota-speaker</a></td></tr>
        <tr><td>jota-voice</td><td data-label="What it does">Cross-platform voice client</td><td data-label="Technology">Python, openWakeWord</td><td data-label="Code"><a href="https://github.com/jota-project/jota-voice" target="_blank" rel="noopener">jota-voice</a></td></tr>
        <tr><td>jota-wake-trainer</td><td data-label="What it does">Trains wake words</td><td data-label="Technology">Python, openWakeWord</td><td data-label="Code"><a href="https://github.com/jota-project/jota-wake-trainer" target="_blank" rel="noopener">jota-wake-trainer</a></td></tr>
        <tr><td>OpenClaw</td><td data-label="What it does">Orchestrator: reasoning, memory, tools, agents</td><td data-label="Technology">Node.js, TypeScript</td><td data-label="Code"><a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener">openclaw</a></td></tr>
      </tbody>
    </table>
  </div>
  <p>Every piece in the table is open source. Jota-Screen and the iPhone app are closed source.</p>
  <p>If you want to build your own client, the gateway protocol is documented in <a href="https://github.com/jota-project/jota-gateway/blob/main/docs/client-protocol.md" target="_blank" rel="noopener"><code>docs/client-protocol.md</code></a>. Audio travels uncompressed and in mono: it goes up as PCM Float32 at 16 kHz and comes down as PCM16 at 24 kHz.</p>
</section>

<section data-state="hub" id="por-que">
  <h2>Why it's split up this way</h2>
  <p><strong>The gateway shields everything else.</strong> Clients only ever talk to the gateway. If OpenClaw changes its protocol, the fix goes into the gateway and the clients don't have to change. The same would apply if we switched to another orchestrator tomorrow.</p>
  <p><strong>Every piece can be swapped.</strong> Transcription and synthesis can be ours or an external provider's. Switching from one to the other doesn't touch anything in the client.</p>
  <p><strong>Every client stands on its own.</strong> Each one has its own key and its own session. If you lose a device, you revoke its key and everything else carries on.</p>
</section>

<section data-state="casa" id="casa">
  <h2>Where Jota runs and what leaves your home</h2>
  <p>Every piece of Jota installs and runs on a machine of your own. There's no Jota cloud service your voice passes through. What leaves your home depends on the external providers you choose:</p>
  <figure class="m-fig" aria-label="What stays on your network and what can leave it">
    <div class="home"><span>Your network</span>
      <ul><li>Client</li><li>jota-gateway</li><li>jota-transcriber</li><li>OpenClaw</li><li>jota-speaker</li><li>Home Assistant</li></ul>
    </div>
    <div class="out"><p>Outside, only if you choose it</p>
      <ul><li>ElevenLabs</li><li>Cloud model</li><li>Tunnel or proxy</li></ul>
    </div>
  </figure>
  <ul>
    <li><strong>Your voice.</strong> With jota-transcriber and jota-speaker, everything stays on your network. If you use ElevenLabs for transcription, it receives your audio. If you use it for Jota's voice, it receives the text of the answers.</li>
    <li><strong>The language model.</strong> OpenClaw can use a local model or a cloud one. If it's in the cloud, what you say reaches that provider, already turned into text.</li>
    <li><strong>Access from outside.</strong> If you expose the gateway through a tunnel or an external proxy to use it away from home, the audio goes through that service.</li>
  </ul>
  <p>Each provider has its own terms about what it keeps and for how long. It's worth reading them before you pick one.</p>
  <p>With everything local, “turn off the living room light” never leaves your network. With a cloud model, it would go out as text to that provider.</p>
</section>

<section data-state="ha" id="home-assistant">
  <h2>Jota inside Home Assistant</h2>
  <p>It isn't the main flow, but Jota's pieces can also be used from Home Assistant, in the opposite direction to the example. jota-speaker provides the voice through Wyoming, Home Assistant's voice protocol. jota-gateway acts as the conversation agent through its OpenAI-compatible API. That way, Home Assistant's voice assistant can be Jota.</p>
</section>

<section data-state="limites" id="limites">
  <h2>Current limitations</h2>
  <ul>
    <li><strong>One conversation per client and agent.</strong> You can't open several separate conversations from the same client.</li>
    <li><strong>Reconnecting doesn't recover the answer in progress.</strong> If the connection drops halfway through an answer, that answer is lost. The conversation's context is kept.</li>
    <li><strong>Notifications need an open connection.</strong> If Jota wants to tell you something and your client isn't connected, the notification is lost. It isn't saved for when the client reconnects.</li>
    <li><strong>Notifications can't be interrupted.</strong> You can cut off an answer to something you asked, but not a notification Jota sends on its own.</li>
  </ul>
</section>
`,
  next: `
<h2>Next steps</h2>
<ul>
  <li>To install it, start with the <a href="https://github.com/jota-project/jota-gateway#readme" target="_blank" rel="noopener">jota-gateway README</a> and the <a href="https://github.com/jota-project/jota-voice#readme" target="_blank" rel="noopener">jota-voice</a> one.</li>
  <li>To write your own client, read the <a href="https://github.com/jota-project/jota-gateway/blob/main/docs/client-protocol.md" target="_blank" rel="noopener">client protocol</a>.</li>
  <li>To get your own wake word, use <a href="https://github.com/jota-project/jota-wake-trainer" target="_blank" rel="noopener">jota-wake-trainer</a>.</li>
</ul>
`,
  log: `
<h3>Changelog</h3>
<p class="log">October 27, 2026 · First version.</p>
`,
  stage: `
<div class="stage-mid">
  <div class="dia" id="dia" data-state="resumen">
    <svg class="wires" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true">
      <path class="base" data-base="cg" d="M150 207.5 H216"/>
      <path class="base" data-base="gt" d="M372 192.5 C402 192.5 402 57.5 432 57.5"/>
      <path class="base" data-base="go" d="M372 207.5 H432"/>
      <path class="base" data-base="gs" d="M372 222.5 C402 222.5 402 357.5 432 357.5"/>
      <path class="lit" data-wire="cg" pathLength="1" d="M150 207.5 H216"/>
      <path class="lit" data-wire="gt" pathLength="1" d="M372 192.5 C402 192.5 402 57.5 432 57.5"/>
      <path class="lit" data-wire="go" pathLength="1" d="M372 207.5 H432"/>
      <path class="lit" data-wire="gs" pathLength="1" d="M372 222.5 C402 222.5 402 357.5 432 357.5"/>
      <path class="ext" d="M75 470 V255"/>
      <path class="ext" d="M294 470 V255"/>
      <path class="ext" d="M470 470 C410 452 402 262 432 236"/>
    </svg>
    <div class="net" aria-hidden="true"><span>Your network</span></div>

    <button class="node" type="button" data-node="cliente" data-go="paso-1" aria-describedby="hint" style="--x:0%;--y:38.1%;--w:25%"><b>Client</b><small><span class="nb">jota-voice</span></small></button>
    <button class="node" type="button" data-node="gateway" data-go="paso-2" aria-describedby="hint" style="--x:36%;--y:38.1%;--w:26%"><b>Gateway</b><small><span class="nb">jota-gateway</span></small></button>
    <button class="node" type="button" data-node="transcripcion" data-go="paso-3" aria-describedby="hint" style="--x:72%;--y:2.4%;--w:28%"><b>Transcription</b><small><span class="nb">jota-transcriber</span></small></button>
    <button class="node" type="button" data-node="orquestador" data-go="paso-4" aria-describedby="hint" style="--x:72%;--y:38.1%;--w:28%"><b>Orchestrator</b><small>OpenClaw</small></button>
    <button class="node" type="button" data-node="sintesis" data-go="paso-5" aria-describedby="hint" style="--x:72%;--y:73.8%;--w:28%"><b>Synthesis</b><small><span class="nb">jota-speaker</span></small></button>

    <div class="ghost" aria-hidden="true" style="--x:0%;--w:25%">Tunnel or proxy</div>
    <div class="ghost" aria-hidden="true" style="--x:36%;--w:26%">ElevenLabs</div>
    <div class="ghost" aria-hidden="true" style="--x:72%;--w:28%">Cloud model</div>

    <div class="d-orb" id="orb" aria-hidden="true"><i></i></div>
  </div>
</div>

<div class="ticker" aria-hidden="true"><span class="k" id="tk">The sentence</span><span class="v" id="tv">“OK Jota, turn off the living room light”</span></div>
<div class="stage-foot">
  <span class="hint" id="hint">Tap a piece to jump to its part of the text.</span>
  <button class="play" id="play" type="button" aria-pressed="false">
    <svg class="i-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2.2v9.6c0 .5.5.8.9.5l7.4-4.8c.4-.3.4-.8 0-1L4.4 1.7c-.4-.3-.9 0-.9.5Z" fill="currentColor"/></svg>
    <svg class="i-stop" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.6" fill="currentColor"/></svg>
    <span id="play-label">Play the walkthrough</span>
  </button>
</div>
`,
  script: {
    quotes: "“”",
    open: "“",
    step: "Step {n} of 5",
    play: "Play the walkthrough",
    stop: "Stop",
    stopAria: "Stop the walkthrough",
    def: {
      cliente: ["Client", "jota-voice"], gateway: ["Gateway", "jota-gateway"],
      transcripcion: ["Transcription", "jota-transcriber"], orquestador: ["Orchestrator", "OpenClaw"], sintesis: ["Synthesis", "jota-speaker"],
    },
    phrase: "“OK Jota, turn off the living room light”",
    states: {
      resumen: { k: "The sentence" },
      s1: { k: "Right now", v: "audio in chunks, on its way to the gateway", sub: { cliente: "jota-voice, openWakeWord" } },
      s2: { k: "Right now", v: "audio from a client with a valid key", sub: { gateway: "key, agent, session" } },
      s3: { k: "Right now", type: "“turn off the living room light”", sub: { transcripcion: "whisper.cpp" } },
      s4: { k: "Right now", v: "a command for Home Assistant", sub: { orquestador: "OpenClaw → Home Assistant" } },
      s5: { k: "Right now", v: "“Done, I've turned off the living room light”", sub: { sintesis: "Kokoro, sentence by sentence" } },
      cortar: { k: "If you cut in", v: "the answer in progress is cancelled" },
      voice: { k: "jota-voice", v: "macOS, Android and Linux", sub: { cliente: "cross-platform" } },
      screen: { k: "On the TV", v: "you press the talk button on your phone", sub: { cliente: "TV and phone" } },
      abierto: { k: "Code", v: "every piece in the diagram is open source", sub: { cliente: "jota-voice", gateway: "open source", transcripcion: "open source", orquestador: "open source", sintesis: "open source" } },
      hub: { k: "The hub", v: "clients only ever talk to the gateway" },
      casa: { k: "Your network", v: "only what you send to a provider goes out" },
      ha: { k: "The other way round", v: "Home Assistant uses Jota's voice and agent", sub: { cliente: "Assist", gateway: "OpenAI-style API", sintesis: "jota-speaker over Wyoming" } },
      limites: { k: "Limits", v: "the connection between client and gateway" },
      siguientes: { k: "The sentence" },
    },
  },
};
