import { gzip } from 'zlib';
import { promisify } from 'util';
import type { LoggerEntry } from './logger-listener';
import { getLevelAsString } from './logger-utils';

const gzipAsync = promisify(gzip);

const DEFAULT_URL = 'https://api.axiom.co';
const DEFAULT_MAX_ATTEMPTS = 4;
/** Entries held while Axiom is unreachable; beyond this the oldest are dropped, so an outage cannot exhaust memory. */
const DEFAULT_MAX_QUEUE_ENTRIES = 10_000;
/** Entries per request. Axiom accepts far more; this keeps one request small enough to retry cheaply. */
const MAX_BATCH_ENTRIES = 1_000;

export interface AxiomLogOptions {
  /** An ingest-only API token for the dataset. */
  token: string;
  dataset: string;
  /** Labels every event, e.g. `vision` or `vision-controller`. */
  app: string;
  /** Labels every event, e.g. `production` or `development`. */
  env: string;
  /** The API base; a regional one where the organisation lives in one. Default `https://api.axiom.co`. */
  url?: string;
  /** Attempts per batch, including the first. Default 4. */
  maxAttempts?: number;
  /** Delay before retry `attempt` (1-based). Default 1s, 2s, 4s… */
  retryDelayMs?(attempt: number): number;
  /** Default 10,000. */
  maxQueueEntries?: number;
  /** Where the sink reports its own failures. Default `console.warn`: never through the logger it is shipping for. */
  warn?(message: string): void;
  /** Injectable for tests. Default the global `fetch`. */
  fetch?: typeof globalThis.fetch;
}

/** A status worth trying again: rate limited, or a server-side failure. */
const isRetryable = (status: number): boolean => status === 429 || status >= 500;

/** Errors do not survive JSON.stringify (they become `{}`); send what makes them useful. */
function toSerialisable(value: unknown): unknown {
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map(toSerialisable);
  if (value != null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, toSerialisable(inner)]));
  }
  return value;
}

/**
 * A log sink that ships entries to Axiom's ingest API (`POST <url>/v1/datasets/<dataset>/ingest`).
 * - Each batch goes as gzipped JSON events. Every event carries `_time`, the configured `app` and `env`, its `level`
 *   name, the `logger` names and the `message`, plus its `meta`.
 * - A 429, a 5xx or a network failure is retried with backoff. Any other refusal, or running out of attempts, drops
 *   that batch with one warning.
 * - Entries arriving during a send are queued. The queue is bounded, and the oldest entries go first.
 * - One send at a time, in order.
 */
export function useAxiom({
  token,
  dataset,
  app,
  env,
  url = DEFAULT_URL,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  retryDelayMs = attempt => 1_000 * 2 ** (attempt - 1),
  maxQueueEntries = DEFAULT_MAX_QUEUE_ENTRIES,
  // eslint-disable-next-line no-console
  warn = message => console.warn(message),
  fetch = globalThis.fetch,
}: AxiomLogOptions): (entries: LoggerEntry[]) => Promise<void> {
  const endpoint = `${url.replace(/\/+$/, '')}/v1/datasets/${encodeURIComponent(dataset)}/ingest`;
  const queue: LoggerEntry[] = [];
  let sending: Promise<void> | undefined;

  const toEvent = ({ timestamp, level, names, message, meta, ...rest }: LoggerEntry) => ({
    _time: timestamp.toUTC().toISO(),
    app,
    env,
    level: getLevelAsString(level),
    logger: names.join(' > '),
    message,
    ...(meta != null ? { meta: toSerialisable(meta) } : {}),
    ...(toSerialisable(rest) as object),
  });

  async function sendBatch(batch: LoggerEntry[]): Promise<void> {
    const body = await gzipAsync(Buffer.from(JSON.stringify(batch.map(toEvent)), 'utf8'));
    let lastFailure = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' },
          body,
        });
        if (response.ok) return;
        if (!isRetryable(response.status)) {
          warn(`Axiom log shipping was refused (${response.status}); dropped ${batch.length} entries.`);
          return;
        }
        lastFailure = String(response.status);
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : String(error);
      }
      if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, retryDelayMs(attempt)));
    }
    warn(`Axiom log shipping failed after ${maxAttempts} attempts (${lastFailure}); dropped ${batch.length} entries.`);
  }

  async function drain(): Promise<void> {
    while (queue.length > 0) await sendBatch(queue.splice(0, MAX_BATCH_ENTRIES));
  }

  return async entries => {
    if (entries.length === 0) return;
    queue.push(...entries);
    if (queue.length > maxQueueEntries) {
      const dropped = queue.length - maxQueueEntries;
      queue.splice(0, dropped);
      warn(`Axiom log queue is full (${maxQueueEntries} entries); dropped the ${dropped} oldest.`);
    }
    // Loop: entries queued just as a drain finished must not wait for the next batch to be sent.
    while (queue.length > 0) {
      if (sending == null) sending = drain().finally(() => { sending = undefined; });
      await sending;
    }
  };
}
