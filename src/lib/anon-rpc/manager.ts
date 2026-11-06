// Anon-RPC worker lifecycle, fail-closed read transport and an honest request log. Browser-only.
// Nothing here is simulated: a request is logged "anon" only if it actually returned from worker.fetch().
// Request params are never logged (they contain wallet addresses); only the JSON-RPC method name.

import type { AnonRpcWorker as AnonRpcWorkerType } from "@anon-rpc/browser-harness";
import { BOOTSTRAP_RPC, getNetwork, DEFAULT_NETWORK, type AnonNetwork } from "./networks.ts";

export type WorkerStatus = "idle" | "starting" | "ready" | "failed";
export type ReadMode = "anon" | "direct";
export type Transport = "anon" | "direct" | "bootstrap";

export interface LogEntry {
  id: number;
  ts: number;
  method: string;
  transport: Transport;
  ok: boolean;
  ms: number;
  error?: string;
}

export interface AnonState {
  networkId: string;
  kind: AnonNetwork["kind"] | null;
  status: WorkerStatus;
  error: string | null;
  mode: ReadMode;
  anonOk: number;
  anonFailed: number;
  directOk: number;
  directFailed: number;
  bootstrapOk: number;
  lastAnonAt: number | null;
  startedAt: number | null;
  readyAt: number | null;
  /** Number of distinct isolation keys handed to the worker this session (never the keys themselves). */
  isolationKeys: number;
  log: LogEntry[];
}

const LOG_MAX = 200;
const initial = (networkId = DEFAULT_NETWORK): AnonState => ({
  networkId,
  kind: null,
  status: "idle",
  error: null,
  mode: "anon",
  anonOk: 0,
  anonFailed: 0,
  directOk: 0,
  directFailed: 0,
  bootstrapOk: 0,
  lastAnonAt: null,
  startedAt: null,
  readyAt: null,
  isolationKeys: 0,
  log: [],
});

export class PrivacyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivacyError";
  }
}

let state: AnonState = initial();
let worker: AnonRpcWorkerType | null = null;
let seq = 0;
let generation = 0; // guards against a stale startWorker() finishing after a newer one began
const keys = new Set<string>();
const listeners = new Set<() => void>();

function set(patch: Partial<AnonState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function record(e: Omit<LogEntry, "id" | "ts">, patch: Partial<AnonState> = {}) {
  const entry: LogEntry = { id: ++seq, ts: Date.now(), ...e };
  set({ ...patch, log: [entry, ...state.log].slice(0, LOG_MAX) });
}

export const anonStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
};

export function setReadMode(mode: ReadMode) {
  if (mode === state.mode) return;
  record({ method: `mode → ${mode === "anon" ? "Anon-RPC" : "Standard RPC"}`, transport: mode, ok: true, ms: 0 }, { mode });
}

export async function startWorker(networkId: string = state.networkId): Promise<void> {
  stopWorker(false);
  const gen = ++generation;
  const net = getNetwork(networkId);
  const bootstrapUrl = BOOTSTRAP_RPC[net.specifierChainId];
  set({ networkId: net.id, kind: net.kind, status: "starting", error: null, startedAt: Date.now(), readyAt: null });

  try {
    const { AnonRpcWorker } = await import("@anon-rpc/browser-harness");
    const w = new AnonRpcWorker({
      address: net.specifier,
      config: net.config as never,
      preExisting: {
        rpcProvider: {
          request: async ({ method, params }: { method: string; params?: unknown }) => {
            const t0 = performance.now();
            try {
              const res = await fetch(bootstrapUrl, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] }),
              });
              const j = await res.json();
              if (j.error) throw new Error(j.error.message ?? "bootstrap RPC error");
              record({ method: `${method} (specifier bootstrap)`, transport: "bootstrap", ok: true, ms: performance.now() - t0 }, { bootstrapOk: state.bootstrapOk + 1 });
              return j.result;
            } catch (e) {
              record({ method: `${method} (specifier bootstrap)`, transport: "bootstrap", ok: false, ms: performance.now() - t0, error: msg(e) });
              throw e;
            }
          },
        },
      },
    });
    worker = w;
    await w.ready;
    if (gen !== generation) return; // superseded
    set({ status: "ready", readyAt: Date.now(), error: null });
  } catch (e) {
    if (gen !== generation) return;
    try { worker?.close(); } catch { /* ignore */ }
    worker = null;
    set({ status: "failed", error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
    throw e;
  }
}

export function stopWorker(resetStatus = true) {
  generation++;
  try { worker?.close(); } catch { /* ignore */ }
  worker = null;
  if (resetStatus) set({ status: "idle", readyAt: null });
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 200);

/** Test hook: simulate an unavailable worker without touching the network ("kill switch" in the Privacy Center). */
export function killWorker() {
  stopWorker(false);
  set({ status: "failed", error: "Worker stopped manually (fail-closed demo)" });
}

/**
 * The single choke point for chain reads. Returns the JSON-RPC `result`.
 * - anon mode: needs a ready worker on a real anonymizing network; otherwise throws. NEVER falls back to direct.
 * - direct mode: explicit user opt-in; labelled "direct" in the log.
 * `isolationKey` (optional) separates circuits per wallet session.
 */
export async function rpcRead(url: string, method: string, params: unknown[], isolationKey?: string): Promise<unknown> {
  const t0 = performance.now();
  const mode = state.mode;
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  try {
    let res: Response;
    if (mode === "direct") {
      res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
    } else {
      if (!worker || state.status !== "ready") {
        throw new PrivacyError("Anon-RPC worker is not ready — refusing to fall back to direct RPC.");
      }
      if (state.kind !== "network") {
        throw new PrivacyError("Selected worker is a passthrough reference and does not anonymize.");
      }
      if (isolationKey && !keys.has(isolationKey)) {
        keys.add(isolationKey);
        set({ isolationKeys: keys.size });
      }
      res = await worker.fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        ...(isolationKey ? { anonOptions: { isolationKey } } : {}),
      } as RequestInit);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (j.error) throw new Error(j.error.message ?? "RPC error");
    const ms = performance.now() - t0;
    if (mode === "direct") record({ method, transport: "direct", ok: true, ms }, { directOk: state.directOk + 1 });
    else record({ method, transport: "anon", ok: true, ms }, { anonOk: state.anonOk + 1, lastAnonAt: Date.now() });
    return j.result;
  } catch (e) {
    const ms = performance.now() - t0;
    if (mode === "direct") record({ method, transport: "direct", ok: false, ms, error: msg(e) }, { directFailed: state.directFailed + 1 });
    else record({ method, transport: "anon", ok: false, ms, error: msg(e) }, { anonFailed: state.anonFailed + 1 });
    throw e;
  }
}
