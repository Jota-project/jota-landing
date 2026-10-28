// «Cómo está hecho Jota», en español. Markup fijo y propio (no es entrada de usuarios): se pinta con
// dangerouslySetInnerHTML. Los ids, data-state, data-node y data-go son iguales en los dos idiomas:
// el JS y el home dependen de ellos. Los enlaces internos (miga, «qué es Jota», volver a DIY) van como Link en el JSX.
export const articleEs = {
  meta: {
    title: "Cómo está hecho Jota",
    description:
      "Jota une whisper.cpp, OpenClaw y Kokoro detrás de un gateway propio. Cómo viaja una orden de voz, qué piezas son abiertas y qué límites tiene hoy.",
  },
  skip: "Saltar al texto",
  stageLabel: "Diagrama del recorrido de una frase",
  whatIs: ["Para conocer el producto, mira ", "qué es Jota y qué puede hacer", "."],
  back: "Todas las entradas de DIY",
  head: `
<h1>Cómo está hecho Jota: <em>arquitectura</em> de un agente de voz</h1>
<div class="meta">
<div class="meta-row"><b class="kind">Nota técnica</b><i aria-hidden="true">·</i><span class="stamp">estable</span><i aria-hidden="true">·</i>Dificultad&nbsp;<span>media</span><i aria-hidden="true">·</i><span>9 min</span><i aria-hidden="true">·</i><time datetime="2026-10-27">27 oct 2026</time></div>
<details class="tested">
  <summary>Probado con&nbsp;<span>jota-gateway v1.21.0</span>, <span>OpenClaw 2026.10.5</span>&nbsp;y 4 piezas más</summary>
  <ul><li>jota-gateway v1.21.0</li><li>jota-transcriber v1.4.2</li><li>jota-speaker v1.1.6</li><li>jota-voice (main, 2026&#8209;10&#8209;26)</li><li>jota-wake-trainer v1.0.1</li><li>OpenClaw 2026.10.5</li></ul>
</details>
</div>
`,
  col: `
<p class="lede">Jota es un agente personal con voz: le hablas, recuerda lo que le cuentas y hace cosas por ti en casa. Su núcleo está hecho con piezas de código abierto: whisper.cpp para entender lo que dices, OpenClaw como orquestador y Kokoro para la voz. Se instala y funciona en una máquina tuya. Esta entrada explica qué pasa por dentro desde que le hablas hasta que te contesta.</p>

<nav class="strip quiet" id="strip" aria-label="Recorrido de la frase">
  <div class="smap-wrap"><div class="smap"><div class="smap-in" id="smap">
    <button class="sbtn" type="button" data-node="cliente" data-go="paso-1">Cliente</button>
    <i class="ln" aria-hidden="true"></i>
    <button class="sbtn is-hub" type="button" data-node="gateway" data-go="paso-2">Gateway</button>
    <i class="ln" aria-hidden="true"></i>
    <div class="sgroup" role="group" aria-label="Servicios que coordina el gateway">
      <button class="sbtn" type="button" data-node="transcripcion" data-go="paso-3" aria-label="Texto (transcripción)">Texto</button>
      <button class="sbtn" type="button" data-node="orquestador" data-go="paso-4" aria-label="Cerebro (orquestador)">Cerebro</button>
      <button class="sbtn" type="button" data-node="sintesis" data-go="paso-5" aria-label="Voz (síntesis)">Voz</button>
    </div>
    <span class="s-orb" id="sorb" aria-hidden="true"></span>
  </div></div></div>
  <p class="sline"><span id="sk">La frase</span><b id="sv">«Ok Jota, apaga la luz del salón»</b>
    <button class="splay" id="splay" type="button" aria-pressed="false" aria-label="Reproducir el recorrido">
      <svg class="i-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2.2v9.6c0 .5.5.8.9.5l7.4-4.8c.4-.3.4-.8 0-1L4.4 1.7c-.4-.3-.9 0-.9.5Z" fill="currentColor"/></svg>
      <svg class="i-stop" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.6" fill="currentColor"/></svg>
    </button>
  </p>
</nav>

<p class="before"><strong>Antes de empezar:</strong> no hay nada que montar. Ayuda saber qué es un WebSocket (una conexión que se queda abierta para enviar datos en los dos sentidos), pero no hace falta.</p>

<ul class="contents" aria-label="En esta entrada">
  <li><a href="#resumen">Arquitectura de Jota en resumen</a></li>
  <li><a href="#recorrido">Qué pasa cuando le hablas a Jota <span>5 pasos</span></a></li>
  <li><a href="#jota-voice">jota-voice, el cliente de voz</a></li>
  <li><a href="#tele">Otro cliente: la tele con Jota-Screen</a></li>
  <li><a href="#abierto">Qué es de Jota y qué es abierto</a></li>
  <li><a href="#por-que">Por qué está separado así</a></li>
  <li><a href="#casa">Dónde corre Jota y qué sale de casa</a></li>
  <li><a href="#home-assistant">Jota dentro de Home Assistant</a></li>
  <li><a href="#limites">Limitaciones actuales</a></li>
  <li><a href="#siguientes">Siguientes pasos</a></li>
</ul>

<section data-state="resumen" id="resumen">
  <h2>Arquitectura de Jota en resumen</h2>
  <p>Jota separa la voz del cerebro. Una parte escucha y habla. Otra entiende lo que le pides y lo hace. Entre las dos hay una única puerta de entrada, el gateway, que decide quién puede hablar con quién.</p>
  <figure class="m-fig" aria-label="Esquema del recorrido">
    <ol class="flow">
      <li><b>Cliente</b><span>tu voz</span></li>
      <li class="hub"><b>jota-gateway</b><span>valida el cliente</span></li>
      <li class="branch"><b>Transcripción</b><span>voz → texto</span></li>
      <li class="branch"><b>Orquestador</b><span>piensa y actúa</span></li>
      <li class="branch"><b>Síntesis</b><span>texto → voz</span></li>
      <li><b>Cliente</b><span>texto y audio</span></li>
    </ol>
    <figcaption>Todo pasa por el gateway: el cliente nunca habla directamente con las otras piezas.</figcaption>
  </figure>
</section>

<h2 id="recorrido">Qué pasa cuando le hablas a Jota</h2>
<p>Vamos a seguir una frase concreta: «Ok Jota, apaga la luz del salón». Imagina que se la dices a un dispositivo que hace de altavoz en el salón, con jota-voice instalado.</p>

<section data-state="s1" id="paso-1">
  <h3>1. El cliente escucha</h3>
  <p>Un cliente es cualquier aparato con micrófono o altavoz que habla con Jota. Hoy hay tres:</p>
  <ul>
    <li><strong>Jota-Screen</strong>, para la tele. Lo vemos más abajo.</li>
    <li><strong>jota-voice</strong>, un cliente de voz multiplataforma, muy sencillo y de código abierto. También lo vemos más abajo.</li>
    <li><strong>La app de Jota para iPhone</strong>, experimental y en una fase inicial.</li>
  </ul>
  <p>jota-voice viene configurado con la palabra de activación «Ok Nabu». En este ejemplo usamos «Ok Jota», que ya tiene una <a href="https://github.com/jota-project/jota-wake-trainer/tree/main/projects/ok_jota" target="_blank" rel="noopener">primera versión</a> que se puede usar y que seguimos entrenando. Si prefieres otra palabra, puedes entrenarla con <a href="https://github.com/jota-project/jota-wake-trainer" target="_blank" rel="noopener">jota-wake-trainer</a>.</p>
  <p>jota-voice escucha todo el rato, pero no envía audio. Detecta la palabra de activación en el propio aparato con openWakeWord, una librería abierta para eso. Hasta que la oye, el audio no sale del dispositivo.</p>
  <p>Cuando la oye, manda tu voz al gateway en fragmentos, mientras hablas. Usa la conexión WebSocket que tiene abierta desde que arranca. También envía el segundo y medio anterior, para no cortarte el principio.</p>
  <p>¿Cómo sabe que has terminado? Con jota-transcriber, lo decide el cliente. jota-voice da la frase por acabada cuando llevas un segundo y medio en silencio. Un cliente con botón la cierra cuando lo sueltas. Con ElevenLabs, es su servidor el que detecta el final de la frase.</p>
</section>

<section data-state="s2" id="paso-2">
  <h3>2. El gateway decide si puedes pasar</h3>
  <p>jota-gateway es el único punto de entrada. Cada cliente tiene su propia clave, y con ella el gateway comprueba que está dado de alta y activo. Si la clave no vale, la conexión se cierra ahí. Si alguien desactiva el cliente o le cambia la clave, la sesión abierta se corta en unos diez segundos.</p>
  <p>El gateway también decide con qué agente hablas. Un agente es una versión de Jota con su propio carácter, memoria y permisos, y cada persona crea los que quiera en su orquestador. Cada cliente puede pedir un agente al conectarse. Si no pide ninguno, usa el que tenga por defecto. Quien administra el gateway puede limitar a qué agentes llega cada cliente. El altavoz del salón, por ejemplo, puede ir siempre a un agente pensado para la casa.</p>
</section>

<section data-state="s3" id="paso-3">
  <h3>3. Tu voz se convierte en texto</h3>
  <p>El gateway reenvía el audio al servicio de transcripción. Puede ser jota-transcriber, nuestro servidor basado en whisper.cpp. También puede ser ElevenLabs, un proveedor externo. Lo elige quien administra el gateway, y vale para todos sus clientes.</p>
  <p>La transcripción va en directo. Mientras hablas, el cliente recibe el texto que se va reconociendo. Cuando terminas, recibe la transcripción final: «apaga la luz del salón».</p>
  <p>Esa transcripción no pasa directamente al orquestador. Primero vuelve al cliente, que la confirma y la envía. Así un cliente puede enseñarte el texto y dejarte corregirlo, o mandarlo tal cual si hablas con las manos libres.</p>
</section>

<section data-state="s4" id="paso-4">
  <h3>4. El orquestador piensa y actúa</h3>
  <p>El texto llega al orquestador, que hace de cerebro. Hoy usamos OpenClaw, un orquestador de IA de código abierto. Ahí vive lo que permite a Jota recordar y actuar:</p>
  <ul>
    <li><strong>Memoria.</strong> Guarda lo que sabe de ti y de tus preferencias.</li>
    <li><strong>Agentes.</strong> Los que hayas creado, cada uno con su memoria y sus permisos.</li>
    <li><strong>Herramientas.</strong> Consulta, ejecuta acciones y habla con otros sistemas. Con la casa habla a través de Home Assistant, conectado por MCP (un protocolo estándar para darle herramientas a un modelo de IA). En nuestra frase, le pide a Home Assistant que apague la luz del salón.</li>
    <li><strong>Tareas programadas.</strong> Hace cosas más tarde o con una frecuencia, y te avisa cuando terminan.</li>
  </ul>
  <p>Cada cliente tiene su propia conversación con cada agente. Si se desconecta y vuelve a conectar, Jota retoma el contexto.</p>
</section>

<section data-state="s5" id="paso-5">
  <h3>5. La respuesta vuelve en texto y en voz</h3>
  <p>La conexión con el cliente funciona en los dos sentidos y en directo. Según llega la respuesta del orquestador, el gateway la reenvía a la vez al cliente y al sintetizador de voz. jota-speaker, nuestro sintetizador basado en Kokoro (un modelo de voz de código abierto), genera el audio frase a frase, sin esperar al texto completo. Al cliente le llegan el texto y el audio por la misma conexión: «Hecho, he apagado la luz del salón».</p>
  <p>Lo que pasa después lo decide cada cliente. Algunos van mostrando el texto al ritmo del audio, aunque haya llegado entero antes, para que leer y escuchar vayan a la par.</p>
</section>

<section data-state="cortar" id="cortar">
  <h3>Si le interrumpes</h3>
  <p>Cortar a Jota mientras habla también depende del cliente:</p>
  <ul>
    <li><strong>Hablando por encima.</strong> Es lo que se llama <em>barge-in</em>. Si el cliente sigue enviando audio mientras Jota habla y tiene esta opción activada en el gateway, en cuanto el gateway reconoce unas palabras tuyas cancela la respuesta y te escucha.</li>
    <li><strong>Con una frase nueva.</strong> Aunque el <em>barge-in</em> esté desactivado, una frase nueva y completa cancela la respuesta en curso y sigue el camino normal.</li>
    <li><strong>Con un gesto.</strong> El cliente puede cancelar la respuesta cuando quiera. En Jota-Screen, pulsando otra vez el botón de hablar del móvil. En jota-voice, repitiendo la palabra de activación mientras Jota responde.</li>
  </ul>
</section>

<section data-state="voice" id="jota-voice">
  <h2>jota-voice, el cliente de voz</h2>
  <p>jota-voice es el cliente de voz de Jota: escucha la palabra de activación, manda tu voz al gateway y reproduce la respuesta. Es multiplataforma, de código abierto y está en desarrollo activo. Hoy esta es su compatibilidad:</p>
  <div class="table-wrap">
    <table class="compat">
      <thead><tr><th scope="col">Sistema</th><th scope="col">Estado</th></tr></thead>
      <tbody>
        <tr><td>macOS</td><td data-label="Estado"><span class="ok">Compatible</span>, con instalador</td></tr>
        <tr><td>Android</td><td data-label="Estado"><span class="ok">Compatible</span>, con instalador, a través de Termux (una terminal Linux para Android)</td></tr>
        <tr><td>Linux</td><td data-label="Estado"><span class="ok">Compatible</span>; se instala a mano</td></tr>
        <tr><td>Windows</td><td data-label="Estado"><span class="no">Aún no es compatible</span></td></tr>
        <tr><td>ESP32</td><td data-label="Estado"><span class="no">Aún no hay cliente</span> para microcontroladores como el ESP32</td></tr>
      </tbody>
    </table>
  </div>
  <p>Cómo instalarlo en cada sistema está en el <a href="https://github.com/jota-project/jota-voice#readme" target="_blank" rel="noopener">README de jota-voice</a>.</p>
</section>

<section data-state="screen" id="tele">
  <h2>Otro cliente: la tele con Jota-Screen</h2>
  <p>Jota-Screen convierte la tele en un cliente de Jota. Necesitas un mini PC o un portátil viejo conectado a la tele por HDMI, y tu móvil. Por detrás está la misma cadena de antes: gateway, transcripción, orquestador y síntesis.</p>
  <p>Hay dos diferencias con jota-voice:</p>
  <ul>
    <li><strong>No hay palabra de activación.</strong> El móvil hace de mando y de micrófono: pulsas el botón de hablar y hablas. No necesita ninguna app. Abres una web, escribes el código que sale en la tele y queda emparejado.</li>
    <li><strong>Ves en qué está Jota.</strong> La tele enseña lo que has dicho y si Jota está escuchando, pensando, usando una herramienta o hablando.</li>
  </ul>
  <p>Si estás viendo una serie y preguntas «¿dónde se rodó esto?», en pantalla aparece tu pregunta, luego «Buscando el lugar» y después la respuesta. La serie sigue sin pausarse.</p>
</section>

<section data-state="abierto" id="abierto">
  <h2>Qué es de Jota y qué es abierto</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th scope="col">Pieza</th><th scope="col">Qué hace</th><th scope="col">Tecnología</th><th scope="col">Código</th></tr></thead>
      <tbody>
        <tr><td>jota-gateway</td><td data-label="Qué hace">Puerta de entrada: claves, sesiones, agentes y coordinación de la voz</td><td data-label="Tecnología">Python, FastAPI, WebSocket</td><td data-label="Código"><a href="https://github.com/jota-project/jota-gateway" target="_blank" rel="noopener">jota-gateway</a></td></tr>
        <tr><td>jota-transcriber</td><td data-label="Qué hace">Voz a texto en directo</td><td data-label="Tecnología">C++, whisper.cpp, CUDA (opcional)</td><td data-label="Código"><a href="https://github.com/jota-project/jota-transcriber" target="_blank" rel="noopener">jota-transcriber</a></td></tr>
        <tr><td>jota-speaker</td><td data-label="Qué hace">Texto a voz en directo</td><td data-label="Tecnología">Python, Kokoro ONNX</td><td data-label="Código"><a href="https://github.com/jota-project/jota-speaker" target="_blank" rel="noopener">jota-speaker</a></td></tr>
        <tr><td>jota-voice</td><td data-label="Qué hace">Cliente de voz multiplataforma</td><td data-label="Tecnología">Python, openWakeWord</td><td data-label="Código"><a href="https://github.com/jota-project/jota-voice" target="_blank" rel="noopener">jota-voice</a></td></tr>
        <tr><td>jota-wake-trainer</td><td data-label="Qué hace">Entrena palabras de activación</td><td data-label="Tecnología">Python, openWakeWord</td><td data-label="Código"><a href="https://github.com/jota-project/jota-wake-trainer" target="_blank" rel="noopener">jota-wake-trainer</a></td></tr>
        <tr><td>OpenClaw</td><td data-label="Qué hace">Orquestador: razonamiento, memoria, herramientas, agentes</td><td data-label="Tecnología">Node.js, TypeScript</td><td data-label="Código"><a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener">openclaw</a></td></tr>
      </tbody>
    </table>
  </div>
  <p>Todas las piezas de la tabla son de código abierto. Jota-Screen y la app de iPhone son de código cerrado.</p>
  <p>Si quieres construir tu propio cliente, el protocolo del gateway está documentado en <a href="https://github.com/jota-project/jota-gateway/blob/main/docs/client-protocol.md" target="_blank" rel="noopener"><code>docs/client-protocol.md</code></a>. El audio viaja sin comprimir y en mono: sube en PCM Float32 a 16 kHz y baja en PCM16 a 24 kHz.</p>
</section>

<section data-state="hub" id="por-que">
  <h2>Por qué está separado así</h2>
  <p><strong>El gateway protege al resto.</strong> Los clientes solo hablan con el gateway. Si OpenClaw cambia su protocolo, el arreglo se hace en el gateway y los clientes no tienen que cambiar. Lo mismo pasaría si mañana usáramos otro orquestador.</p>
  <p><strong>Cada pieza se puede cambiar.</strong> La transcripción y la síntesis pueden ser nuestras o de un proveedor externo. Cambiar de una a otra no toca nada en el cliente.</p>
  <p><strong>Cada cliente es independiente.</strong> Cada uno tiene su clave y su sesión. Si pierdes un dispositivo, le revocas la clave y el resto sigue igual.</p>
</section>

<section data-state="casa" id="casa">
  <h2>Dónde corre Jota y qué sale de casa</h2>
  <p>Todas las piezas de Jota se instalan y funcionan en una máquina tuya. No hay un servicio de Jota en la nube por el que pase tu voz. Lo que sale de casa depende de los proveedores externos que elijas:</p>
  <figure class="m-fig" aria-label="Qué se queda en tu red y qué puede salir">
    <div class="home"><span>Tu red</span>
      <ul><li>Cliente</li><li>jota-gateway</li><li>jota-transcriber</li><li>OpenClaw</li><li>jota-speaker</li><li>Home Assistant</li></ul>
    </div>
    <div class="out"><p>Fuera, solo si lo eliges</p>
      <ul><li>ElevenLabs</li><li>Modelo en la nube</li><li>Túnel o proxy</li></ul>
    </div>
  </figure>
  <ul>
    <li><strong>La voz.</strong> Con jota-transcriber y jota-speaker, todo se queda en tu red. Si usas ElevenLabs para transcribir, le llega tu audio. Si lo usas para la voz de Jota, le llega el texto de las respuestas.</li>
    <li><strong>El modelo de lenguaje.</strong> OpenClaw puede usar un modelo local o uno en la nube. Si está en la nube, lo que dices le llega a ese proveedor, ya convertido en texto.</li>
    <li><strong>El acceso desde fuera.</strong> Si publicas el gateway con un túnel o un proxy externo para usarlo fuera de casa, el audio pasa por ese servicio.</li>
  </ul>
  <p>Cada proveedor tiene sus propias condiciones sobre qué guarda y durante cuánto tiempo. Conviene leerlas antes de elegirlo.</p>
  <p>Con todo en local, «apaga la luz del salón» no sale de tu red. Con un modelo en la nube, saldría como texto hacia ese proveedor.</p>
</section>

<section data-state="ha" id="home-assistant">
  <h2>Jota dentro de Home Assistant</h2>
  <p>No es el flujo principal, pero las piezas de Jota también se pueden usar desde Home Assistant, en la dirección contraria a la del ejemplo. jota-speaker hace de voz mediante Wyoming, el protocolo de voz de Home Assistant. jota-gateway hace de agente de conversación con su API compatible con OpenAI. Así, el asistente de voz de Home Assistant puede ser Jota.</p>
</section>

<section data-state="limites" id="limites">
  <h2>Limitaciones actuales</h2>
  <ul>
    <li><strong>Una conversación por cliente y agente.</strong> No puedes abrir varias conversaciones separadas desde el mismo cliente.</li>
    <li><strong>Una reconexión no recupera la respuesta en curso.</strong> Si se corta la conexión a mitad de una respuesta, esa respuesta se pierde. El contexto de la conversación se conserva.</li>
    <li><strong>Los avisos necesitan una conexión abierta.</strong> Si Jota quiere avisarte de algo y tu cliente no está conectado, el aviso se pierde. No se guarda para cuando vuelva a conectarse.</li>
    <li><strong>Los avisos no se pueden cortar.</strong> Puedes interrumpir una respuesta a algo que has pedido, pero no un aviso que Jota lanza por su cuenta.</li>
  </ul>
</section>
`,
  next: `
  <h2>Siguientes pasos</h2>
  <ul>
    <li>Para instalarlo, empieza por el <a href="https://github.com/jota-project/jota-gateway#readme" target="_blank" rel="noopener">README de jota-gateway</a> y el de <a href="https://github.com/jota-project/jota-voice#readme" target="_blank" rel="noopener">jota-voice</a>.</li>
    <li>Para escribir tu propio cliente, lee el <a href="https://github.com/jota-project/jota-gateway/blob/main/docs/client-protocol.md" target="_blank" rel="noopener">protocolo del cliente</a>.</li>
    <li>Para tener tu propia palabra de activación, usa <a href="https://github.com/jota-project/jota-wake-trainer" target="_blank" rel="noopener">jota-wake-trainer</a>.</li>
  </ul>
`,
  log: `
  <h3>Registro de cambios</h3>
  <p class="log">27 de octubre de 2026 · Primera versión.</p>
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
  <div class="net" aria-hidden="true"><span>Tu red</span></div>

  <button class="node" type="button" data-node="cliente" data-go="paso-1" aria-describedby="hint" style="--x:0%;--y:38.1%;--w:25%"><b>Cliente</b><small><span class="nb">jota-voice</span></small></button>
  <button class="node" type="button" data-node="gateway" data-go="paso-2" aria-describedby="hint" style="--x:36%;--y:38.1%;--w:26%"><b>Gateway</b><small><span class="nb">jota-gateway</span></small></button>
  <button class="node" type="button" data-node="transcripcion" data-go="paso-3" aria-describedby="hint" style="--x:72%;--y:2.4%;--w:28%"><b>Transcripción</b><small><span class="nb">jota-transcriber</span></small></button>
  <button class="node" type="button" data-node="orquestador" data-go="paso-4" aria-describedby="hint" style="--x:72%;--y:38.1%;--w:28%"><b>Orquestador</b><small>OpenClaw</small></button>
  <button class="node" type="button" data-node="sintesis" data-go="paso-5" aria-describedby="hint" style="--x:72%;--y:73.8%;--w:28%"><b>Síntesis</b><small><span class="nb">jota-speaker</span></small></button>

  <div class="ghost" aria-hidden="true" style="--x:0%;--w:25%">Túnel o proxy</div>
  <div class="ghost" aria-hidden="true" style="--x:36%;--w:26%">ElevenLabs</div>
  <div class="ghost" aria-hidden="true" style="--x:72%;--w:28%">Modelo en la nube</div>

  <div class="d-orb" id="orb" aria-hidden="true"><i></i></div>
</div>
</div>

<div class="ticker" aria-hidden="true"><span class="k" id="tk">La frase</span><span class="v" id="tv">«Ok Jota, apaga la luz del salón»</span></div>
<div class="stage-foot">
<span class="hint" id="hint">Pulsa una pieza para ir a su parte del texto.</span>
<button class="play" id="play" type="button" aria-pressed="false">
  <svg class="i-play" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2.2v9.6c0 .5.5.8.9.5l7.4-4.8c.4-.3.4-.8 0-1L4.4 1.7c-.4-.3-.9 0-.9.5Z" fill="currentColor"/></svg>
  <svg class="i-stop" viewBox="0 0 14 14" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.6" fill="currentColor"/></svg>
  <span id="play-label">Reproducir el recorrido</span>
</button>
</div>
`,
  // cadenas que pinta el JS del diagrama y la tira
  script: {
    quotes: "«»",
    open: "«",
    step: "Paso {n} de 5",
    play: "Reproducir el recorrido",
    stop: "Parar",
    stopAria: "Parar el recorrido",
    def: {
      cliente: ["Cliente", "jota-voice"], gateway: ["Gateway", "jota-gateway"],
      transcripcion: ["Transcripción", "jota-transcriber"], orquestador: ["Orquestador", "OpenClaw"], sintesis: ["Síntesis", "jota-speaker"],
    },
    phrase: "«Ok Jota, apaga la luz del salón»",
    states: {
      resumen: { k: "La frase" },
      s1: { k: "Ahora es", v: "audio en fragmentos, camino del gateway", sub: { cliente: "jota-voice, openWakeWord" } },
      s2: { k: "Ahora es", v: "audio de un cliente con clave válida", sub: { gateway: "clave, agente, sesión" } },
      s3: { k: "Ahora es", type: "«apaga la luz del salón»", sub: { transcripcion: "whisper.cpp" } },
      s4: { k: "Ahora es", v: "una orden para Home Assistant", sub: { orquestador: "OpenClaw → Home Assistant" } },
      s5: { k: "Ahora es", v: "«Hecho, he apagado la luz del salón»", sub: { sintesis: "Kokoro, frase a frase" } },
      cortar: { k: "Si le cortas", v: "la respuesta en curso se cancela" },
      voice: { k: "jota-voice", v: "macOS, Android y Linux", sub: { cliente: "multiplataforma" } },
      screen: { k: "En la tele", v: "pulsas el botón de hablar del móvil", sub: { cliente: "tele y móvil" } },
      abierto: { k: "Código", v: "todas las piezas del diagrama son abiertas", sub: { cliente: "jota-voice", gateway: "código abierto", transcripcion: "código abierto", orquestador: "código abierto", sintesis: "código abierto" } },
      hub: { k: "El centro", v: "los clientes solo hablan con el gateway" },
      casa: { k: "Tu red", v: "fuera solo sale lo que mandes a un proveedor" },
      ha: { k: "Al revés", v: "Home Assistant usa la voz y el agente de Jota", sub: { cliente: "Assist", gateway: "API tipo OpenAI", sintesis: "jota-speaker por Wyoming" } },
      limites: { k: "Límites", v: "la conexión entre el cliente y el gateway" },
      siguientes: { k: "La frase" },
    },
  },
};

export type ArticleContent = typeof articleEs;
