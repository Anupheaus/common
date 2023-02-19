/* eslint-disable no-console */
import { PromiseMaybe } from '../extensions';

export async function captureConsole(delegate: () => PromiseMaybe<void>) {
  const capture = (methodName: keyof typeof console): [() => void, unknown[][]] => {
    const invocations: unknown[][] = [];
    const old = console[methodName];
    console[methodName] = ((...args: unknown[]): void => { invocations.push(args); }) as any;
    return [() => { console[methodName] = old as any; }, invocations];
  };

  const [restoreLog, logs] = capture('log');
  const [restoreWarns, warns] = capture('warn');
  const [restoreErrors, errors] = capture('error');
  const [restoreInfos, infos] = capture('info');
  const [restoreDebugs, debugs] = capture('debug');
  const [restoreTraces, traces] = capture('trace');
  const [restoreDirs, dirs] = capture('dir');
  await delegate();
  restoreLog();
  restoreWarns();
  restoreErrors();
  restoreInfos();
  restoreDebugs();
  restoreTraces();
  restoreDirs();
  return {
    all: logs.concat(warns, errors, infos, debugs, traces, dirs),
    logs,
    warns,
    errors,
    infos,
    debugs,
    traces,
    dirs,
  };
}
