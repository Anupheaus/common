import type { LoggerEntry } from './logger-listener';
import { getLevelAsString } from './logger-utils';

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
      if (!response.ok) throw new Error(`Failed to send logs to Grafana Loki: ${response.statusText}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
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
      if (!response.ok) throw new Error(`Failed to send logs to New Relic: ${response.statusText}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };
}

export type LoggerService = (entries: LoggerEntry[]) => Promise<void>;

export const LoggerServices = {
  useGrafanaLoki,
  useNewRelic,
};