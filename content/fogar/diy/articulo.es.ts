// «Cómo está hecho Fogar», en español. Markup fijo y propio (no es entrada de usuarios): se pinta con
// dangerouslySetInnerHTML. Los ids y data-estado son iguales en los dos idiomas: la landing enlaza a #casa y el
// índice lateral pone la línea viva en el estado de la parte que se lee. <!--figura--> marca dónde va el diagrama.
import { PROTOCOLO, REPOS } from "@/lib/repos";
import { a } from "./html";

export const articuloEs = {
  meta: {
    title: "Cómo está hecho Fogar",
    description:
      "Fogar une whisper.cpp, OpenClaw y Kokoro detrás de un gateway propio. Cómo viaja una orden de voz, qué piezas son abiertas y qué límites tiene hoy.",
  },
  h1: "Cómo está hecho Fogar: arquitectura de un agente de voz",
  lede: "Fogar es un agente personal con voz: le hablas, recuerda lo que le cuentas y hace cosas por ti en casa. Su núcleo está hecho con piezas de código abierto: whisper.cpp para entender lo que dices, OpenClaw como orquestador y Kokoro para la voz. Se instala y funciona en una máquina tuya. Esta entrada explica qué pasa por dentro desde que le hablas hasta que te contesta.",
  antes: "<strong>Antes de empezar:</strong> no hay nada que montar. Ayuda saber qué es un WebSocket (una conexión que se queda abierta para enviar datos en los dos sentidos), pero no hace falta.",
  secciones: [
    {
      id: "resumen",
      toc: "La arquitectura en resumen",
      html: `
<h2>Arquitectura de Fogar en resumen</h2>
<p>Fogar separa la voz del cerebro. Una parte escucha y habla. Otra entiende lo que le pides y lo hace. Entre las dos hay una única puerta de entrada, el gateway, que decide quién puede hablar con quién.</p>
<!--figura-->`,
    },
    {
      id: "recorrido",
      toc: "Qué pasa cuando le hablas",
      html: `
<h2>Qué pasa cuando le hablas a Fogar</h2>
<p>Vamos a seguir una frase concreta: «Ok Fogar, apaga la luz del salón». Imagina que se la dices a un dispositivo que hace de altavoz en el salón, con fogar-voice instalado.</p>

<section id="paso-1" data-estado="listen">
  <h3>1. El cliente escucha</h3>
  <p>Un cliente es cualquier aparato con micrófono o altavoz que habla con Fogar. Hoy hay dos:</p>
  <ul>
    <li><strong>Fogar TV</strong>, para la tele. La vemos más abajo.</li>
    <li><strong>fogar-voice</strong>, un cliente de voz multiplataforma, muy sencillo y de código abierto. También lo vemos más abajo.</li>
  </ul>
  <p>fogar-voice viene configurado con la palabra de activación «Ok Nabu». En este ejemplo usamos «Ok Fogar». Si prefieres otra palabra, puedes entrenarla con ${a(REPOS.wakeTrainer, "fogar-wake-trainer")}.</p>
  <p>fogar-voice escucha todo el rato, pero no envía audio. Detecta la palabra de activación en el propio aparato con openWakeWord, una librería abierta para eso. Hasta que la oye, el audio no sale del dispositivo.</p>
  <p>Cuando la oye, manda tu voz al gateway en fragmentos, mientras hablas. Usa la conexión WebSocket que tiene abierta desde que arranca. También envía el segundo y medio anterior, para no cortarte el principio.</p>
  <p>¿Cómo sabe que has terminado? Con fogar-transcriber, lo decide el cliente. fogar-voice da la frase por acabada cuando llevas un segundo y medio en silencio. Un cliente con botón la cierra cuando lo sueltas. Con ElevenLabs, es su servidor el que detecta el final de la frase.</p>
</section>

<section id="paso-2" data-estado="think">
  <h3>2. El gateway decide si puedes pasar</h3>
  <p>fogar-gateway es el único punto de entrada. Cada cliente tiene su propia clave, y con ella el gateway comprueba que está dado de alta y activo. Si la clave no vale, la conexión se cierra ahí. Si alguien desactiva el cliente o le cambia la clave, la sesión abierta se corta en unos diez segundos.</p>
  <p>El gateway también decide con qué agente hablas. Un agente es una versión de Fogar con su propio carácter, memoria y permisos, y cada persona crea los que quiera en su orquestador. Cada cliente puede pedir un agente al conectarse. Si no pide ninguno, usa el que tenga por defecto. Quien administra el gateway puede limitar a qué agentes llega cada cliente. El altavoz del salón, por ejemplo, puede ir siempre a un agente pensado para la casa.</p>
</section>

<section id="paso-3" data-estado="think">
  <h3>3. Tu voz se convierte en texto</h3>
  <p>El gateway reenvía el audio al servicio de transcripción. Puede ser fogar-transcriber, nuestro servidor basado en whisper.cpp. También puede ser ElevenLabs, un proveedor externo. Lo elige quien administra el gateway, y vale para todos sus clientes.</p>
  <p>La transcripción va en directo. Mientras hablas, el cliente recibe el texto que se va reconociendo. Cuando terminas, recibe la transcripción final: «apaga la luz del salón».</p>
  <p>Esa transcripción no pasa directamente al orquestador. Primero vuelve al cliente, que la confirma y la envía. Así un cliente puede enseñarte el texto y dejarte corregirlo, o mandarlo tal cual si hablas con las manos libres.</p>
</section>

<section id="paso-4" data-estado="tool">
  <h3>4. El orquestador piensa y actúa</h3>
  <p>El texto llega al orquestador, que hace de cerebro. Hoy usamos OpenClaw, un orquestador de IA de código abierto. Ahí vive lo que permite a Fogar recordar y actuar:</p>
  <ul>
    <li><strong>Memoria.</strong> Guarda lo que sabe de ti y de tus preferencias.</li>
    <li><strong>Agentes.</strong> Los que hayas creado, cada uno con su memoria y sus permisos.</li>
    <li><strong>Herramientas.</strong> Consulta, ejecuta acciones y habla con otros sistemas a través de MCP (un protocolo estándar para darle herramientas a un modelo de IA): Home Assistant para la casa, y también Obsidian, Notion o lo que ya uses. En nuestra frase, le pide a Home Assistant que apague la luz del salón.</li>
    <li><strong>Tareas programadas.</strong> Hace cosas más tarde o con una frecuencia, y te avisa cuando terminan.</li>
  </ul>
  <p>Cada cliente tiene su propia conversación con cada agente. Si se desconecta y vuelve a conectar, Fogar retoma el contexto.</p>
</section>

<section id="paso-5" data-estado="speak">
  <h3>5. La respuesta vuelve en texto y en voz</h3>
  <p>La conexión con el cliente funciona en los dos sentidos y en directo. Según llega la respuesta del orquestador, el gateway la reenvía a la vez al cliente y al sintetizador de voz. fogar-speaker, nuestro sintetizador basado en Kokoro (un modelo de voz de código abierto), genera el audio frase a frase, sin esperar al texto completo. Al cliente le llegan el texto y el audio por la misma conexión: «Hecho, he apagado la luz del salón».</p>
  <p>Lo que pasa después lo decide cada cliente. Algunos van mostrando el texto al ritmo del audio, aunque haya llegado entero antes, para que leer y escuchar vayan a la par.</p>
</section>

<section id="cortar" data-estado="listen">
  <h3>Si le interrumpes</h3>
  <p>Cortar a Fogar mientras habla también depende del cliente:</p>
  <ul>
    <li><strong>Hablando por encima.</strong> Es lo que se llama <em>barge-in</em>. Si el cliente sigue enviando audio mientras Fogar habla y tiene esta opción activada en el gateway, en cuanto el gateway reconoce unas palabras tuyas cancela la respuesta y te escucha.</li>
    <li><strong>Con una frase nueva.</strong> Aunque el <em>barge-in</em> esté desactivado, una frase nueva y completa cancela la respuesta en curso y sigue el camino normal.</li>
    <li><strong>Con un gesto.</strong> El cliente puede cancelar la respuesta cuando quiera. En Fogar TV, pulsando otra vez el botón de hablar del móvil. En fogar-voice, repitiendo la palabra de activación mientras Fogar responde.</li>
  </ul>
</section>`,
    },
    {
      id: "fogar-voice",
      estado: "listen",
      toc: "fogar-voice, el cliente de voz",
      html: `
<h2>fogar-voice, el cliente de voz</h2>
<p>fogar-voice es el cliente de voz de Fogar: escucha la palabra de activación, manda tu voz al gateway y reproduce la respuesta. Es multiplataforma, de código abierto y está en desarrollo activo. Hoy esta es su compatibilidad:</p>
<div class="tabla">
  <table class="compat">
    <thead><tr><th scope="col">Sistema</th><th scope="col">Estado</th></tr></thead>
    <tbody>
      <tr><th scope="row">macOS</th><td><span class="si">Compatible</span>, con instalador</td></tr>
      <tr><th scope="row">Android</th><td><span class="si">Compatible</span>, con instalador, a través de Termux (una terminal Linux para Android)</td></tr>
      <tr><th scope="row">Linux</th><td><span class="si">Compatible</span>; se instala a mano</td></tr>
      <tr><th scope="row">Windows</th><td><span class="no">Aún no es compatible</span></td></tr>
      <tr><th scope="row">ESP32</th><td><span class="no">Aún no hay cliente</span> para microcontroladores como el ESP32</td></tr>
    </tbody>
  </table>
</div>
<p>Cómo instalarlo en cada sistema está en el ${a(`${REPOS.voice}#readme`, "README de fogar-voice")}.</p>`,
    },
    {
      id: "tele",
      estado: "speak",
      toc: "La tele con Fogar TV",
      html: `
<h2>Otro cliente: la tele con Fogar TV</h2>
<p>Fogar TV convierte la tele en un cliente de Fogar. Necesitas un mini PC o un portátil viejo conectado a la tele por HDMI, y tu móvil. Por detrás está la misma cadena de antes: gateway, transcripción, orquestador y síntesis.</p>
<p>Hay dos diferencias con fogar-voice:</p>
<ul>
  <li><strong>No hay palabra de activación.</strong> El móvil hace de mando y de micrófono: pulsas el botón de hablar y hablas. No necesita ninguna app. Abres una web, escribes el código que sale en la tele y queda emparejado.</li>
  <li><strong>Ves en qué está Fogar.</strong> La tele enseña lo que has dicho y si Fogar está escuchando, pensando, usando una herramienta o hablando.</li>
</ul>
<p>Si estás viendo una serie y preguntas «¿dónde se rodó esto?», en pantalla aparece tu pregunta, luego «Buscando el lugar» y después la respuesta. La serie sigue sin pausarse.</p>`,
    },
    {
      id: "abierto",
      toc: "Qué es de Fogar y qué es abierto",
      html: `
<h2>Qué es de Fogar y qué es abierto</h2>
<div class="tabla">
  <table class="piezas">
    <thead><tr><th scope="col">Pieza</th><th scope="col">Qué hace</th><th scope="col">Tecnología</th><th scope="col">Código</th></tr></thead>
    <tbody>
      <tr><th scope="row">fogar-gateway</th><td data-label="Qué hace">Puerta de entrada: claves, sesiones, agentes y coordinación de la voz</td><td data-label="Tecnología">Python, FastAPI, WebSocket</td><td data-label="Código">${a(REPOS.gateway, "fogar-gateway")}</td></tr>
      <tr><th scope="row">fogar-transcriber</th><td data-label="Qué hace">Voz a texto en directo</td><td data-label="Tecnología">C++, whisper.cpp, CUDA (opcional)</td><td data-label="Código">${a(REPOS.transcriber, "fogar-transcriber")}</td></tr>
      <tr><th scope="row">fogar-speaker</th><td data-label="Qué hace">Texto a voz en directo</td><td data-label="Tecnología">Python, Kokoro ONNX</td><td data-label="Código">${a(REPOS.speaker, "fogar-speaker")}</td></tr>
      <tr><th scope="row">fogar-voice</th><td data-label="Qué hace">Cliente de voz multiplataforma</td><td data-label="Tecnología">Python, openWakeWord</td><td data-label="Código">${a(REPOS.voice, "fogar-voice")}</td></tr>
      <tr><th scope="row">fogar-wake-trainer</th><td data-label="Qué hace">Entrena palabras de activación</td><td data-label="Tecnología">Python, openWakeWord</td><td data-label="Código">${a(REPOS.wakeTrainer, "fogar-wake-trainer")}</td></tr>
      <tr><th scope="row">OpenClaw</th><td data-label="Qué hace">Orquestador: razonamiento, memoria, herramientas, agentes</td><td data-label="Tecnología">Node.js, TypeScript</td><td data-label="Código">${a("https://github.com/openclaw/openclaw", "openclaw")}</td></tr>
    </tbody>
  </table>
</div>
<p>Todas las piezas de la tabla son de código abierto. Fogar TV es de código cerrado.</p>
<p>Si quieres construir tu propio cliente, el protocolo del gateway está documentado en ${a(PROTOCOLO, "<code>docs/client-protocol.md</code>")}. El audio viaja sin comprimir y en mono: sube en PCM Float32 a 16 kHz y baja en PCM16 a 24 kHz.</p>`,
    },
    {
      id: "por-que",
      toc: "Por qué está separado así",
      html: `
<h2>Por qué está separado así</h2>
<p><strong>El gateway protege al resto.</strong> Los clientes solo hablan con el gateway. Si OpenClaw cambia su protocolo, el arreglo se hace en el gateway y los clientes no tienen que cambiar. Lo mismo pasaría si mañana usáramos otro orquestador.</p>
<p><strong>Cada pieza se puede cambiar.</strong> La transcripción y la síntesis pueden ser nuestras o de un proveedor externo. Cambiar de una a otra no toca nada en el cliente.</p>
<p><strong>Cada cliente es independiente.</strong> Cada uno tiene su clave y su sesión. Si pierdes un dispositivo, le revocas la clave y el resto sigue igual.</p>`,
    },
    {
      id: "casa",
      toc: "Dónde corre y qué sale de casa",
      html: `
<h2>Dónde corre Fogar y qué sale de casa</h2>
<p>Todas las piezas de Fogar se instalan y funcionan en una máquina tuya. No hay un servicio de Fogar en la nube por el que pase tu voz. Lo que sale de casa depende de los proveedores externos que elijas:</p>
<!--figura-->
<ul>
  <li><strong>La voz.</strong> Con fogar-transcriber y fogar-speaker, todo se queda en tu red. Si usas ElevenLabs para transcribir, le llega tu audio. Si lo usas para la voz de Fogar, le llega el texto de las respuestas.</li>
  <li><strong>El modelo de lenguaje.</strong> OpenClaw puede usar un modelo local o uno en la nube. Si está en la nube, lo que dices le llega a ese proveedor, ya convertido en texto.</li>
  <li><strong>El acceso desde fuera.</strong> Si publicas el gateway con un túnel o un proxy externo para usarlo fuera de casa, el audio pasa por ese servicio.</li>
</ul>
<p>Cada proveedor tiene sus propias condiciones sobre qué guarda y durante cuánto tiempo. Conviene leerlas antes de elegirlo.</p>
<p>Con todo en local, «apaga la luz del salón» no sale de tu red. Con un modelo en la nube, saldría como texto hacia ese proveedor.</p>`,
    },
    {
      id: "home-assistant",
      estado: "speak",
      toc: "Fogar dentro de Home Assistant",
      html: `
<h2>Fogar dentro de Home Assistant</h2>
<p>No es el flujo principal, pero las piezas de Fogar también se pueden usar desde Home Assistant, en la dirección contraria a la del ejemplo. fogar-speaker hace de voz mediante Wyoming, el protocolo de voz de Home Assistant. fogar-gateway hace de agente de conversación con su API compatible con OpenAI. Así, el asistente de voz de Home Assistant puede ser Fogar.</p>`,
    },
    {
      id: "limites",
      toc: "Limitaciones actuales",
      html: `
<h2>Limitaciones actuales</h2>
<ul>
  <li><strong>Una conversación por cliente y agente.</strong> No puedes abrir varias conversaciones separadas desde el mismo cliente.</li>
  <li><strong>Una reconexión no recupera la respuesta en curso.</strong> Si se corta la conexión a mitad de una respuesta, esa respuesta se pierde. El contexto de la conversación se conserva.</li>
  <li><strong>Los avisos necesitan una conexión abierta.</strong> Si Fogar quiere avisarte de algo y tu cliente no está conectado, el aviso se pierde. No se guarda para cuando vuelva a conectarse.</li>
  <li><strong>Los avisos no se pueden cortar.</strong> Puedes interrumpir una respuesta a algo que has pedido, pero no un aviso que Fogar lanza por su cuenta.</li>
</ul>`,
    },
    {
      id: "siguientes",
      toc: "Siguientes pasos",
      html: `
<h2>Siguientes pasos</h2>
<ul>
  <li>Para instalarlo, usa el comando de un paso de la portada de DIY o empieza por el ${a(`${REPOS.gateway}#readme`, "README de fogar-gateway")} y el de ${a(`${REPOS.voice}#readme`, "fogar-voice")}.</li>
  <li>Para escribir tu propio cliente, lee el ${a(PROTOCOLO, "protocolo del cliente")}.</li>
  <li>Para tener tu propia palabra de activación, usa ${a(REPOS.wakeTrainer, "fogar-wake-trainer")}.</li>
</ul>`,
    },
  ],
  registro: [
    ["2026-11-13", "13 de noviembre de 2026", "Pasa a llamarse Fogar y se actualizan las versiones probadas."],
    ["2026-10-27", "27 de octubre de 2026", "Primera versión."],
  ],
};

export type ArticuloContenido = typeof articuloEs;
