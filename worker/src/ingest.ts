import EventSource from "eventsource";
import {
  FETCH_DIFF_CONTENT,
  STREAM_URL,
  USER_AGENT,
  WORKER_DRY_RUN,
} from "./config";
import { loadIndex } from "./index-loader";
import { loadState, persistState } from "./state";
import {
  bytesDiff,
  buildIndexKey,
  preFilter,
  sanitizeComment,
} from "./filters";
import { isRevertComment } from "./revert";
import { fetchDiff, diffUrl, revisionUrl } from "./wiki-diff";
import { startHealthServer, updateHealthSnapshot } from "./health-server";
import { supabase } from "./supabase";
// NOTE 2026-05-27 — auto-publish IA boucle retirée (cf. docs/v2/CORRECTIVE_AUDIT_2026-05-27.md
// §3.1). Le worker ne fait plus QUE de la collecte : revision_traces +
// trace_private_content + checkpoint. L'analyse IA est déplacée dans le service
// analyzer/ séparé au Jalon B. Ne pas réimporter runAutomatedAIAnalysis ici.
import type {
  MonitoredArticle,
  PrivateContentInsert,
  RevisionTraceInsert,
  WikimediaRecentChange,
} from "./types";

const WATCHDOG_INTERVAL_MS = 10_000;
const WATCHDOG_TIMEOUT_MS = 60_000;
const STATE_PERSIST_INTERVAL_MS = 30_000;
const STATS_INTERVAL_MS = 5 * 60_000;
const STABLE_CONNECTION_MS = 60_000;
const MAX_BACKOFF_MS = 30_000;
const INSERT_BATCH_SIZE = 25;
const INSERT_FLUSH_MS = 1000;
const INSERT_RETRY_MS = 5000;

interface Stats {
  matched: number;
  filtered: number;
  errors: number;
  reverts: number;
  reconnects: number;
  inserted: number;
  batches: number;
  privateDiffs: number;
}

function newStats(): Stats {
  return {
    matched: 0,
    filtered: 0,
    errors: 0,
    reverts: 0,
    reconnects: 0,
    inserted: 0,
    batches: 0,
    privateDiffs: 0,
  };
}

interface TraceQueueItem {
  eventId: string;
  receivedAt: Date;
  trace: RevisionTraceInsert | null;
  privateDiff: Omit<PrivateContentInsert, "trace_id"> | null;
  articleTitle?: string;
  languageCode?: string;
  articleType?: string;
}

class WikiMatchWorker {
  private articleIndex = new Map<string, MonitoredArticle>();
  private es: EventSource | null = null;
  private lastEventId: string | null = null;
  private lastEventReceivedAt = Date.now();
  private connectedAt = 0;
  private backoffMs = 1000;
  private stats: Stats = newStats();
  private windowStartAt = Date.now();
  private dirtyState = false;
  private shuttingDown = false;
  private queue: TraceQueueItem[] = [];
  private processingQueue = false;
  private retryTimer: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    this.validateUserAgent();
    startHealthServer();

    const { byKey } = await loadIndex();
    this.articleIndex = byKey;
    if (this.articleIndex.size === 0) {
      console.warn("[boot] index is empty - seed wiki_articles before enabling the worker");
    }

    const state = await loadState();
    this.lastEventId = state.lastEventId;
    console.log(
      this.lastEventId
        ? `[boot] resuming from lastEventId (length=${this.lastEventId.length})`
        : "[boot] no prior lastEventId, starting at live tail",
    );
    if (WORKER_DRY_RUN) {
      console.warn("[boot] WORKER_DRY_RUN=true - no database writes or checkpoint updates");
    }

    process.on("SIGINT", () => void this.shutdown("SIGINT"));
    process.on("SIGTERM", () => void this.shutdown("SIGTERM"));

    setInterval(() => this.watchdog(), WATCHDOG_INTERVAL_MS).unref();
    setInterval(() => void this.flushState(), STATE_PERSIST_INTERVAL_MS).unref();
    setInterval(() => this.flushStats(), STATS_INTERVAL_MS).unref();
    setInterval(() => void this.processQueue(), INSERT_FLUSH_MS).unref();
    this.updateHealth();

    this.connect();
  }

  private validateUserAgent(): void {
    if (!USER_AGENT.includes("(") || USER_AGENT.includes("example")) {
      console.warn(
        "[boot] WIKIMEDIA_USER_AGENT should include a real contact, e.g. WikiMatch/2.0 (email@example.com) Node",
      );
    }
  }

  private connect(): void {
    if (this.shuttingDown) return;
    this.es?.close();
    this.es = null;

    const headers: Record<string, string> = { "User-Agent": USER_AGENT };
    if (this.lastEventId) headers["Last-Event-ID"] = this.lastEventId;

    console.log(`[stream] connecting (lastEventId: ${this.lastEventId ? "set" : "none"})`);
    this.es = new EventSource(STREAM_URL, { headers });
    this.connectedAt = Date.now();

    this.es.onopen = () => {
      console.log(`[stream] connected (lastEventId: ${this.lastEventId ?? "none"})`);
      this.updateHealth();
    };

    this.es.onmessage = (event: MessageEvent) => void this.onMessage(event);

    this.es.onerror = (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[stream] error: ${msg}`);
      this.stats.errors += 1;
      this.scheduleReconnect();
    };
  }

  private async onMessage(event: MessageEvent): Promise<void> {
    this.lastEventReceivedAt = Date.now();

    const eventId = event.lastEventId || null;
    if (Date.now() - this.connectedAt > STABLE_CONNECTION_MS && this.backoffMs !== 1000) {
      this.backoffMs = 1000;
    }

    let data: WikimediaRecentChange;
    try {
      data = JSON.parse(event.data as string);
    } catch {
      this.stats.errors += 1;
      if (eventId) this.enqueue({ eventId, receivedAt: new Date(), trace: null, privateDiff: null });
      return;
    }

    const trace = await this.buildTrace(data);
    if (!eventId) {
      this.stats.errors += 1;
      return;
    }

    if (!trace) {
      this.stats.filtered += 1;
      this.enqueue({ eventId, receivedAt: new Date(), trace: null, privateDiff: null });
      return;
    }

    this.stats.matched += 1;
    this.enqueue({ eventId, receivedAt: new Date(), ...trace });
  }

  private async buildTrace(
    data: WikimediaRecentChange,
  ): Promise<Omit<TraceQueueItem, "eventId" | "receivedAt"> | null> {
    const pre = preFilter(data);
    if (!pre.kept || !data.wiki || !data.title) return null;

    const article = this.articleIndex.get(buildIndexKey(data.wiki, data.title));
    if (!article) return null;

    const wmEventId = data.meta?.id;
    const revNew = data.revision?.new ?? null;
    const revOld = data.revision?.old ?? null;
    const sourceRevisionUrl = revisionUrl(data.wiki, revNew);
    if (!wmEventId || !sourceRevisionUrl) return null;

    const revert = isRevertComment(data.comment);
    if (revert) this.stats.reverts += 1;

    const revisionTimestamp = new Date((data.timestamp ?? Date.now() / 1000) * 1000);
    const trace: RevisionTraceInsert = {
      article_id: article.articleId,
      wikimedia_event_id: wmEventId,
      revision_id: revNew,
      previous_revision_id: revOld,
      observed_at: new Date().toISOString(),
      revision_timestamp: revisionTimestamp.toISOString(),
      source_revision_url: sourceRevisionUrl,
      source_diff_url: diffUrl(data.wiki, revOld, revNew),
      section_label: null,
      size_delta: bytesDiff(data),
      revision_comment_sanitized: sanitizeComment(data.comment),
      change_kind: revert ? "revert_observed" : null,
      public_status: "private_raw",
      ingest_status: "observed",
    };

    let privateDiff: Omit<PrivateContentInsert, "trace_id"> | null = null;
    if (FETCH_DIFF_CONTENT) {
      const diff = await fetchDiff(data.wiki, revOld, revNew);
      if (diff) {
        privateDiff = {
          raw_added_text: diff.added || null,
          raw_removed_text: diff.removed || null,
          moderation_status: "unreviewed",
        };
      }
    }

    const diffStr = trace.size_delta !== null && trace.size_delta >= 0
      ? `+${trace.size_delta}`
      : `${trace.size_delta ?? "?"}`;
    console.log(
      `[ingest] matched ${article.wikiCode} ${article.pageTitle} ${diffStr} chars${revert ? " [revert]" : ""}`,
    );

    return {
      trace,
      privateDiff,
      articleTitle: article.pageTitle,
      languageCode: article.languageCode,
      articleType: article.articleType,
    };
  }

  private enqueue(item: TraceQueueItem): void {
    this.queue.push(item);
    this.updateHealth();
    if (this.queue.length >= INSERT_BATCH_SIZE) void this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || (this.shuttingDown && this.queue.length === 0)) return;
    if (!this.queue.length) return;

    this.processingQueue = true;
    const batch = this.queue.splice(0, INSERT_BATCH_SIZE);
    try {
      const traces = batch
        .map((item) => item.trace)
        .filter((trace): trace is RevisionTraceInsert => trace !== null);

      if (!WORKER_DRY_RUN && traces.length) {
        const { data, error } = await supabase
          .from("revision_traces")
          .upsert(traces, { onConflict: "wikimedia_event_id" })
          .select("id, wikimedia_event_id");
        if (error) throw error;

        const traceIdsByEvent = new Map(
          (data ?? []).map((row) => [row.wikimedia_event_id as string, row.id as string]),
        );
        const privateRows = batch
          .filter((item) => item.trace && item.privateDiff)
          .map((item) => ({
            trace_id: traceIdsByEvent.get(item.trace!.wikimedia_event_id),
            ...item.privateDiff!,
          }))
          .filter((row): row is PrivateContentInsert => Boolean(row.trace_id));

        if (privateRows.length) {
          const { error: privateError } = await supabase
            .from("trace_private_content")
            .upsert(privateRows, { onConflict: "trace_id" });
          if (privateError) throw privateError;
          this.stats.privateDiffs += privateRows.length;
        }

        this.stats.inserted += traces.length;

        // 2026-05-27 — Auto-publish IA boucle retirée ici. L'analyse passe
        // désormais par le service analyzer/ séparé, qui lit revision_traces
        // où ingest_status='observed' et produit des trace_propositions
        // normalisées. La publication finale est strictement contrôlée par
        // le pattern matcher + templates + safety filters (Jalons B/C).
      }

      const last = batch.at(-1);
      if (last && !WORKER_DRY_RUN) {
        this.lastEventId = last.eventId;
        this.lastEventReceivedAt = last.receivedAt.getTime();
        this.dirtyState = true;
      }
      this.stats.batches += 1;
      this.updateHealth();
    } catch (error) {
      this.queue.unshift(...batch);
      this.stats.errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[insert] batch failed, retrying in ${INSERT_RETRY_MS}ms: ${message}`);
      if (!this.retryTimer) {
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          void this.processQueue();
        }, INSERT_RETRY_MS);
        this.retryTimer.unref();
      }
    } finally {
      this.processingQueue = false;
    }
  }

  private scheduleReconnect(): void {
    if (this.shuttingDown) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
    this.stats.reconnects += 1;
    console.log(`[stream] reconnecting in ${delay}ms`);
    setTimeout(() => this.connect(), delay).unref();
  }

  private watchdog(): void {
    const silentMs = Date.now() - this.lastEventReceivedAt;
    if (silentMs > WATCHDOG_TIMEOUT_MS) {
      console.warn(`[watchdog] no events for ${Math.round(silentMs / 1000)}s, forcing reconnect`);
      this.scheduleReconnect();
      this.lastEventReceivedAt = Date.now();
    }
  }

  private async flushState(): Promise<void> {
    if (!this.dirtyState || !this.lastEventId || WORKER_DRY_RUN) return;
    const idToWrite = this.lastEventId;
    this.dirtyState = false;
    await persistState(idToWrite, new Date(this.lastEventReceivedAt));
  }

  private flushStats(): void {
    const windowMin = Math.round((Date.now() - this.windowStartAt) / 60_000);
    const s = this.stats;
    console.log(
      `[stats] window=${windowMin}min matched=${s.matched} filtered=${s.filtered} inserted=${s.inserted} privateDiffs=${s.privateDiffs} batches=${s.batches} errors=${s.errors} reverts=${s.reverts} reconnects=${s.reconnects} queue=${this.queue.length}`,
    );
    this.stats = newStats();
    this.windowStartAt = Date.now();
    this.updateHealth();
  }

  private updateHealth(): void {
    updateHealthSnapshot({
      connected: Boolean(this.es),
      dry_run: WORKER_DRY_RUN,
      indexed_articles: this.articleIndex.size,
      last_event_id_set: Boolean(this.lastEventId),
      last_event_received_at: new Date(this.lastEventReceivedAt).toISOString(),
      queue_depth: this.queue.length,
      processing_queue: this.processingQueue,
      backoff_ms: this.backoffMs,
      window_started_at: new Date(this.windowStartAt).toISOString(),
      stats: this.stats,
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    console.log(`[shutdown] received ${signal}, flushing queue/state`);
    this.es?.close();
    while (this.queue.length) {
      await this.processQueue();
      if (this.queue.length) await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await this.flushState();
    process.exit(0);
  }
}

new WikiMatchWorker().start().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
