import '../extensions/array';
import { gunzipSync } from 'zlib';
import { DateTime } from 'luxon';
import { useAxiom, type AxiomLogOptions } from './logger-axiom';
import type { LoggerEntry } from './logger-listener';

// Shipping log entries to Axiom's ingest API. One POST per batch the logger hands over: gzipped JSON events, each
// labelled with the app and environment it came from (the New Relic sink hard-coded env 'dev', so production logs
// read as development). A rate limit or server error is retried with backoff; anything else, or too many failures,
// drops that batch with a warning. The queue is bounded, so a long outage cannot exhaust memory: the oldest entries go.

interface CapturedRequest {
  url: string;
  headers: Record<string, string>;
  events: Record<string, unknown>[];
}

function makeEntry(overrides: Partial<LoggerEntry> = {}): LoggerEntry {
  return { timestamp: DateTime.fromISO('2026-09-28T12:00:00.000Z'), level: 3, names: ['Vision', 'Orders'], message: 'Order saved', ...overrides };
}

/** A stand-in for Axiom: answers each request with the next status (default 200), records what was sent. */
function fakeAxiom(statuses: number[] = []) {
  const requests: CapturedRequest[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    const raw = init.body as Buffer;
    const json = headers['Content-Encoding'] === 'gzip' ? gunzipSync(raw).toString('utf8') : raw.toString();
    requests.push({ url, headers, events: JSON.parse(json) });
    const status = statuses.shift() ?? 200;
    return { ok: status >= 200 && status < 300, status, statusText: String(status), text: async () => '' } as Response;
  }) as unknown as typeof globalThis.fetch;
  return { fetch, requests };
}

const warnings: string[] = [];
const OPTIONS: Omit<AxiomLogOptions, 'fetch'> = {
  token: 'xaat-ingest-token', dataset: 'vision-prod', app: 'vision', env: 'production', retryDelayMs: () => 0, warn: message => { warnings.push(message); },
};

beforeEach(() => { warnings.length = 0; });

describe('logger > useAxiom', () => {
  it('POSTs one gzipped batch to the dataset\'s ingest endpoint with the ingest token', async () => {
    const axiom = fakeAxiom();

    await useAxiom({ ...OPTIONS, fetch: axiom.fetch })([makeEntry(), makeEntry({ message: 'Second' })]);

    expect(axiom.requests.map(({ url, headers, events }) => ({ url, auth: headers.Authorization, type: headers['Content-Type'], encoding: headers['Content-Encoding'], count: events.length })))
      .to.deep.equal([{ url: 'https://api.axiom.co/v1/datasets/vision-prod/ingest', auth: 'Bearer xaat-ingest-token', type: 'application/json', encoding: 'gzip', count: 2 }]);
  });

  it('labels every event with its app, environment, level and logger names, keeping its meta', async () => {
    const axiom = fakeAxiom();

    await useAxiom({ ...OPTIONS, app: 'vision-controller', fetch: axiom.fetch })([makeEntry({ level: 4, meta: { orderId: 'order-1' } })]);

    expect(axiom.requests[0]?.events).to.deep.equal([{
      _time: '2026-09-28T12:00:00.000Z', app: 'vision-controller', env: 'production', level: 'warn', logger: 'Vision > Orders', message: 'Order saved',
      meta: { orderId: 'order-1' },
    }]);
  });

  it('sends an Error in the meta as its name, message and stack', async () => {
    const axiom = fakeAxiom();
    const error = new Error('Mongo down');

    await useAxiom({ ...OPTIONS, fetch: axiom.fetch })([makeEntry({ meta: { error } })]);

    expect(axiom.requests[0]?.events[0]?.meta).to.deep.equal({ error: { name: 'Error', message: 'Mongo down', stack: error.stack } });
  });

  it('uses the regional endpoint it is given', async () => {
    const axiom = fakeAxiom();

    await useAxiom({ ...OPTIONS, url: 'https://api.eu.axiom.co/', fetch: axiom.fetch })([makeEntry()]);

    expect(axiom.requests[0]?.url).to.equal('https://api.eu.axiom.co/v1/datasets/vision-prod/ingest');
  });

  for (const status of [429, 500, 503]) it(`retries a batch Axiom answers ${status}, then delivers it`, async () => {
    const axiom = fakeAxiom([status, status]);

    await useAxiom({ ...OPTIONS, fetch: axiom.fetch })([makeEntry()]);

    expect({ attempts: axiom.requests.length, warnings }).to.deep.equal({ attempts: 3, warnings: [] });
  });

  it('gives up on a batch after its last attempt, with a warning, and carries on with the next', async () => {
    const axiom = fakeAxiom([503, 503, 503, 503]);
    const ship = useAxiom({ ...OPTIONS, maxAttempts: 4, fetch: axiom.fetch });

    await ship([makeEntry({ message: 'lost' })]);
    await ship([makeEntry({ message: 'next' })]);

    expect({ attempts: axiom.requests.map(({ events }) => events[0]?.message), warnings })
      .to.deep.equal({ attempts: ['lost', 'lost', 'lost', 'lost', 'next'], warnings: ['Axiom log shipping failed after 4 attempts (503); dropped 1 entries.'] });
  });

  it('does not retry a batch Axiom refuses (400, 401, 403): it would only be refused again', async () => {
    const axiom = fakeAxiom([401]);

    await useAxiom({ ...OPTIONS, fetch: axiom.fetch })([makeEntry()]);

    expect({ attempts: axiom.requests.length, warnings }).to.deep.equal({ attempts: 1, warnings: ['Axiom log shipping was refused (401); dropped 1 entries.'] });
  });

  it('retries a network failure like a server error', async () => {
    let calls = 0;
    const axiom = fakeAxiom();
    const flaky = (async (url: string, init: RequestInit) => {
      calls++;
      if (calls === 1) throw new TypeError('fetch failed');
      return axiom.fetch(url, init);
    }) as unknown as typeof globalThis.fetch;

    await useAxiom({ ...OPTIONS, fetch: flaky })([makeEntry()]);

    expect({ calls, delivered: axiom.requests.length, warnings }).to.deep.equal({ calls: 2, delivered: 1, warnings: [] });
  });

  it('keeps the queue bounded while Axiom is unreachable, dropping the oldest entries', async () => {
    let release: () => void = () => undefined;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const axiom = fakeAxiom();
    const slow = (async (url: string, init: RequestInit) => { await gate; return axiom.fetch(url, init); }) as unknown as typeof globalThis.fetch;
    const ship = useAxiom({ ...OPTIONS, maxQueueEntries: 3, fetch: slow });

    const first = ship([makeEntry({ message: 'in flight' })]);
    const later = ship(['a', 'b', 'c', 'd', 'e'].map(message => makeEntry({ message })));
    release();
    await Promise.all([first, later]);

    expect({ sent: axiom.requests.flatMap(({ events }) => events.map(({ message }) => message)), warnings })
      .to.deep.equal({ sent: ['in flight', 'c', 'd', 'e'], warnings: ['Axiom log queue is full (3 entries); dropped the 2 oldest.'] });
  });

  it('sends nothing for an empty batch', async () => {
    const axiom = fakeAxiom();

    await useAxiom({ ...OPTIONS, fetch: axiom.fetch })([]);

    expect(axiom.requests).to.deep.equal([]);
  });
});
