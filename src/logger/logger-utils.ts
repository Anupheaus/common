export const LogLevels = {
  'silly': 0,
  'trace': 1,
  'debug': 2,
  'info': 3,
  'warn': 4,
  'error': 5,
  'fatal': 6,
  'always': 7,
} as const;

const logLevelNumberToString = Object.entries(LogLevels).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {} as Record<number, string>);

export function getLevelAsString(level: number): string {
  return logLevelNumberToString[level] ?? 'silly';
}
