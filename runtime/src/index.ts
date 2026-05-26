/**
 * Runtime unifié — un seul service Render héberge les 3 jobs.
 *
 * Spawn 3 sous-processus tsx, redirige stdio vers le parent, propage
 * SIGINT/SIGTERM. Si l'un meurt, on tue les autres et on laisse Render
 * redémarrer l'instance.
 *
 * Chaque service peut être désactivé via flag env :
 *   RUNTIME_RUN_WORKER=false    → skip worker SSE
 *   RUNTIME_RUN_ANALYZER=false  → skip extracteur de propositions
 *   RUNTIME_RUN_PATTERNS=false  → skip pattern matcher + publisher
 *
 * Pourquoi spawn (subprocess) plutôt que import (in-process) :
 *  - Aucun refactor des entry points existants
 *  - Isolation des handlers SIGINT/SIGTERM (chaque job a déjà les siens)
 *  - Si un job a une fuite mémoire ou un bug fatal, les autres
 *    continuent jusqu'au prochain restart Render
 *  - Coût mémoire ≈ 50-100MB par sous-process → ~250MB total, dans
 *    le budget du plan Render starter (512MB)
 */

import { spawn, type ChildProcess } from "node:child_process";

type ServiceName = "worker" | "analyzer" | "patterns";

interface ServiceSpec {
  name: ServiceName;
  envFlag: string;
  script: string;
}

const SERVICES: ServiceSpec[] = [
  { name: "worker", envFlag: "RUNTIME_RUN_WORKER", script: "worker/src/ingest.ts" },
  { name: "analyzer", envFlag: "RUNTIME_RUN_ANALYZER", script: "analyzer/src/index.ts" },
  { name: "patterns", envFlag: "RUNTIME_RUN_PATTERNS", script: "patterns/src/index.ts" },
];

const children = new Map<ServiceName, ChildProcess>();
let shuttingDown = false;

function shouldRun(spec: ServiceSpec): boolean {
  return process.env[spec.envFlag] !== "false";
}

function spawnService(spec: ServiceSpec): void {
  console.log(`[runtime] starting ${spec.name} (tsx ${spec.script})`);
  const child = spawn("npx", ["tsx", spec.script], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  children.set(spec.name, child);

  child.on("exit", (code, signal) => {
    children.delete(spec.name);
    if (shuttingDown) {
      console.log(`[runtime] ${spec.name} exited during shutdown (code=${code}, signal=${signal})`);
      return;
    }
    console.error(
      `[runtime] ❌ ${spec.name} exited unexpectedly (code=${code}, signal=${signal}). ` +
        `Killing siblings and letting Render restart the instance.`,
    );
    shutdown(1);
  });

  child.on("error", (err) => {
    console.error(`[runtime] failed to start ${spec.name}:`, err);
    shutdown(1);
  });
}

function shutdown(exitCode: number): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[runtime] shutting down ${children.size} active children`);
  for (const [name, child] of children) {
    try {
      child.kill("SIGTERM");
      console.log(`[runtime] sent SIGTERM to ${name}`);
    } catch (err) {
      console.warn(`[runtime] could not signal ${name}:`, err);
    }
  }
  // Donne 10s aux children pour se terminer proprement, puis exit force.
  setTimeout(() => {
    for (const [name, child] of children) {
      try {
        child.kill("SIGKILL");
        console.warn(`[runtime] force-killed ${name}`);
      } catch {
        // ignore
      }
    }
    process.exit(exitCode);
  }, 10_000).unref();
}

process.on("SIGINT", () => {
  console.log("[runtime] SIGINT received");
  shutdown(0);
});
process.on("SIGTERM", () => {
  console.log("[runtime] SIGTERM received");
  shutdown(0);
});

const enabled = SERVICES.filter(shouldRun);
if (enabled.length === 0) {
  console.error("[runtime] no service enabled (all RUNTIME_RUN_* are false). Exiting.");
  process.exit(1);
}

console.log(
  `[runtime] starting ${enabled.length} service(s): ${enabled.map((s) => s.name).join(", ")}`,
);
for (const spec of enabled) {
  spawnService(spec);
}
