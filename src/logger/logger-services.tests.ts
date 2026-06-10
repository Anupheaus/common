import '../extensions/array';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { LoggerServices } from './logger-services';
import { DateTime } from 'luxon';
import type { LoggerEntry } from './logger-listener';

function makeEntry(overrides: Partial<LoggerEntry> = {}): LoggerEntry {
  return {
    timestamp: DateTime.fromISO('2024-01-15T12:00:00.000Z'),
    level: 3,
    names: ['app'],
    message: 'test message',
    ...overrides,
  };
}

describe('logger > LoggerServices', () => {

  let originalFetch: typeof globalThis.fetch;
  let capturedUrl: string;
  let capturedInit: RequestInit;
  let fetchResponse: { ok: boolean; status: number; statusText: string; body?: string };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    capturedUrl = '';
    capturedInit = {};
    fetchResponse = { ok: true, status: 200, statusText: 'OK' };
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedInit = init ?? {};
      return {
        ok: fetchResponse.ok,
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        text: async () => fetchResponse.body ?? '',
      } as Response;
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('useGrafanaLoki', () => {

    it('POSTs to the correct Grafana Loki URL', async () => {
      const handler = LoggerServices.useGrafanaLoki('user', 'pass', 'my-loki-server.example.com');
      await handler([makeEntry()]);
      expect(capturedUrl).to.include('my-loki-server.example.com');
      expect(capturedUrl).to.include('user:pass@');
      expect(capturedInit.method).to.equal('POST');
    });

    it('uses the default server when none is provided', async () => {
      const handler = LoggerServices.useGrafanaLoki('u', 'p');
      await handler([makeEntry()]);
      expect(capturedUrl).to.include('logs-prod-012.grafana.net');
    });

    it('sends a JSON body with a streams structure', async () => {
      const handler = LoggerServices.useGrafanaLoki('u', 'p');
      await handler([makeEntry({ level: 3, message: 'hello' })]);
      const body = JSON.parse(capturedInit.body as string);
      expect(body).to.have.property('streams').which.is.an('array');
      const stream = body.streams[0];
      expect(stream).to.have.property('stream');
      expect(stream.stream).to.have.property('level', 'info');
      expect(stream).to.have.property('values').which.is.an('array');
    });

    it('groups entries by level into separate streams', async () => {
      const handler = LoggerServices.useGrafanaLoki('u', 'p');
      await handler([
        makeEntry({ level: 3, message: 'info msg' }),
        makeEntry({ level: 5, message: 'error msg' }),
        makeEntry({ level: 3, message: 'another info' }),
      ]);
      const body = JSON.parse(capturedInit.body as string);
      expect(body.streams).to.have.lengthOf(2);
      const levels = body.streams.map((s: any) => s.stream.level).sort();
      expect(levels).to.include('info');
      expect(levels).to.include('error');
    });

    it('sets Content-Type to application/json', async () => {
      const handler = LoggerServices.useGrafanaLoki('u', 'p');
      await handler([makeEntry()]);
      expect((capturedInit.headers as Record<string, string>)['Content-Type']).to.equal('application/json');
    });

    it('does not throw when fetch returns a non-ok response', async () => {
      fetchResponse = { ok: false, status: 502, statusText: 'Bad Gateway' };
      const handler = LoggerServices.useGrafanaLoki('u', 'p');
      await expect(handler([makeEntry()])).to.not.be.rejectedWith(Error);
    });

    it('does not throw when fetch itself throws', async () => {
      globalThis.fetch = async () => { throw new Error('network error'); };
      const handler = LoggerServices.useGrafanaLoki('u', 'p');
      await expect(handler([makeEntry()])).to.not.be.rejectedWith(Error);
    });

  });

  describe('useNewRelic', () => {

    it('POSTs to the correct New Relic URL', async () => {
      const handler = LoggerServices.useNewRelic('my-api-key', 'log-api.example.com');
      await handler([makeEntry()]);
      expect(capturedUrl).to.include('log-api.example.com');
      expect(capturedInit.method).to.equal('POST');
    });

    it('uses the default server when none is provided', async () => {
      const handler = LoggerServices.useNewRelic('key');
      await handler([makeEntry()]);
      expect(capturedUrl).to.include('log-api.eu.newrelic.com');
    });

    it('sends an Api-Key header with the provided key', async () => {
      const handler = LoggerServices.useNewRelic('my-secret-key');
      await handler([makeEntry()]);
      expect((capturedInit.headers as Record<string, string>)['Api-Key']).to.equal('my-secret-key');
    });

    it('sends a JSON body with common attributes and logs array', async () => {
      const handler = LoggerServices.useNewRelic('key');
      await handler([makeEntry({ level: 4, message: 'a warning' })]);
      const body = JSON.parse(capturedInit.body as string);
      expect(body).to.be.an('array');
      const group = body[0];
      expect(group).to.have.property('common');
      expect(group.common.attributes.level).to.equal('warn');
      expect(group).to.have.property('logs').which.is.an('array');
      expect(group.logs[0].message).to.equal('a warning');
    });

    it('groups entries by level into separate body items', async () => {
      const handler = LoggerServices.useNewRelic('key');
      await handler([
        makeEntry({ level: 3, message: 'info' }),
        makeEntry({ level: 5, message: 'error' }),
      ]);
      const body = JSON.parse(capturedInit.body as string);
      expect(body).to.have.lengthOf(2);
    });

    it('includes a numeric timestamp on each log entry', async () => {
      const handler = LoggerServices.useNewRelic('key');
      await handler([makeEntry({ level: 3 })]);
      const body = JSON.parse(capturedInit.body as string);
      const logEntry = body[0].logs[0];
      expect(logEntry.timestamp).to.be.a('number');
    });

    it('does not throw when fetch returns a non-ok response', async () => {
      fetchResponse = { ok: false, status: 403, statusText: 'Forbidden' };
      const handler = LoggerServices.useNewRelic('key');
      await expect(handler([makeEntry()])).to.not.be.rejectedWith(Error);
    });

    it('does not throw when fetch itself throws', async () => {
      globalThis.fetch = async () => { throw new Error('network error'); };
      const handler = LoggerServices.useNewRelic('key');
      await expect(handler([makeEntry()])).to.not.be.rejectedWith(Error);
    });

  });

  describe('useClippedFileLog', () => {

    const tempDir = path.join(os.tmpdir(), `logger-services-clipped-${process.pid}`);
    let logFilePath: string;

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      logFilePath = path.join(tempDir, 'test.log');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('appends formatted entries to the file', async () => {
      const handler = LoggerServices.useClippedFileLog(logFilePath);
      await handler([makeEntry({ message: 'first line' })]);
      await handler([makeEntry({ message: 'second line' })]);

      const content = await fs.readFile(logFilePath, 'utf8');
      expect(content).to.include('first line');
      expect(content).to.include('second line');
      expect(content.split('\n').filter(Boolean)).to.have.length(2);
    });

    it('clips the file to maxBytes keeping the newest lines', async () => {
      const handler = LoggerServices.useClippedFileLog(logFilePath, { maxBytes: 120 });
      await handler([makeEntry({ message: 'aaaaaaaaaa' })]);
      await handler([makeEntry({ message: 'bbbbbbbbbb' })]);
      await handler([makeEntry({ message: 'cccccccccc' })]);

      const content = await fs.readFile(logFilePath, 'utf8');
      const stat = await fs.stat(logFilePath);
      expect(stat.size).to.be.at.most(120);
      expect(content).to.not.include('aaaaaaaaaa');
      expect(content).to.include('cccccccccc');
    });

    it('does not throw when the directory is missing', async () => {
      const nestedPath = path.join(tempDir, 'nested', 'test.log');
      const handler = LoggerServices.useClippedFileLog(nestedPath);
      await expect(handler([makeEntry()])).to.not.be.rejectedWith(Error);
      await expect(fs.stat(nestedPath)).to.not.be.rejectedWith(Error);
    });

  });

});
