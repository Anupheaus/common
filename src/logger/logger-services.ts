import fs from 'fs/promises';
import path from 'path';
import type { LoggerEntry } from './logger-listener';
import { getLevelAsString } from './logger-utils';

const defaultClippedFileMaxBytes = 200 * 1024 * 1024;

export interface ClippedFileLogOptions {
  maxBytes?: number;
}

function formatLogEntryForFile(entry: LoggerEntry): string {
  const level = getLevelAsString(entry.level);
  const names = entry.names.join(' > ');
  const { timestamp, message, level: _ignored, names: _names, meta, ...rest } = entry;
  const attributes = { ...rest, ...(meta != null ? { meta } : {}) };
  const attributeSuffix = Object.keys(attributes).length > 0 ? ` ${JSON.stringify(attributes)}` : '';
  return `${timestamp.toISO()} [${level.padEnd(5)}] [${names}] ${message}${attributeSuffix}\n`;
}

async function clipFileToMaxBytes(filePath: string, maxBytes: number): Promise<void> {
  const stat = await fs.stat(filePath);
  if (stat.size <= maxBytes) return;

  const content = await fs.readFile(filePath);
  let start = content.length - maxBytes;
  const newlineIndex = content.indexOf(0x0a, start);
  if (newlineIndex >= 0 && newlineIndex < content.length - 1) start = newlineIndex + 1;
  await fs.writeFile(filePath, content.subarray(start));
}

function useGrafanaLoki(userName: string, password: string, server: string = 'logs-prod-012.grafana.net') {
  const url = `https://${userName}:${password}@${server}/loki/api/v1/push`;
  return async (entries: LoggerEntry[]) => {
    try {
      const body = {
        streams: entries.groupBy(entry => entry.level).toArray().map(([level, levelEntries]) => ({
          stream: {
            'app': 'vision',
            'env': 'dev',
            'level': getLevelAsString(level),
          },
          values: levelEntries.map(({ timestamp, message, ...rest }) => [(timestamp.toUTC().valueOf() * 1000000).toString(), message, rest]),
        })),
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Grafana Loki log shipping failed: ${response.status} ${response.statusText}`);
        return;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Grafana Loki log shipping failed:', error instanceof Error ? error.message : error);
    }
  };
}

function useNewRelic(apiKey: string, server: string = 'log-api.eu.newrelic.com') {
  const url = `https://${server}/log/v1`;
  return async (entries: LoggerEntry[]) => {
    try {
      const body = entries.groupBy(entry => entry.level).toArray().map(([level, levelEntries]) => ({
        common: {
          attributes: {
            'app': 'vision',
            'env': 'dev',
            'level': getLevelAsString(level),
          },
        },
        logs: levelEntries.map(({ timestamp, message, level: _ignored, ...rest }) => ({
          timestamp: timestamp.toUTC().valueOf(),
          message,
          attributes: rest,
        })),
      }));
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        } as any,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.warn(`New Relic log shipping failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ''}`);
        return;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('New Relic log shipping failed:', error instanceof Error ? error.message : error);
    }
  };
}

function useClippedFileLog(filePath: string, options: ClippedFileLogOptions = {}) {
  const maxBytes = options.maxBytes ?? defaultClippedFileMaxBytes;
  let writeChain = Promise.resolve();
  let directoryEnsured = false;

  return async (entries: LoggerEntry[]) => {
    if (entries.length === 0) return;

    const text = entries.map(formatLogEntryForFile).join('');
    writeChain = writeChain.then(async () => {
      try {
        if (!directoryEnsured) {
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          directoryEnsured = true;
        }
        await fs.appendFile(filePath, text, 'utf8');
        await clipFileToMaxBytes(filePath, maxBytes);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Clipped file log shipping failed:', error instanceof Error ? error.message : error);
      }
    });
    await writeChain;
  };
}

export type LoggerService = (entries: LoggerEntry[]) => Promise<void>;

export const LoggerServices = {
  useClippedFileLog,
  useGrafanaLoki,
  useNewRelic,
};