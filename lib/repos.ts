import { GITHUB_ORG } from "./github";

/*
 * Todos los enlaces a repos de Fogar que enseña la web, en un solo sitio.
 * Revisar antes de publicar: los marcados «sin migrar» dan 404 hasta que se renombren en GitHub
 * (vault: IA y reglas/Migración Fogar/Migración Fogar.md, sección URGENTE). Comprobado el 2026-11-13.
 */
const repo = (nombre: string) => `${GITHUB_ORG}/${nombre}`;

export const REPOS = {
  gateway: repo("fogar-gateway"), // renombrado
  tv: repo("fogar-tv"), // renombrado
  voice: repo("fogar-voice"), // sin migrar (hoy con el nombre antiguo)
  transcriber: repo("fogar-transcriber"), // sin migrar
  speaker: repo("fogar-speaker"), // sin migrar
  wakeTrainer: repo("fogar-wake-trainer"), // sin migrar
} as const;

/** Protocolo del cliente, en el gateway (fijado a un commit para que no se mueva). */
export const PROTOCOLO = `${REPOS.gateway}/blob/62b66ef/docs/client-protocol.md`;

/** Instalación en un paso: Linux con systemd de usuario y OpenClaw 2026.6.11 o posterior. */
export const INSTALL = `curl -fsSL ${REPOS.gateway}/releases/latest/download/install.sh | sh`;
