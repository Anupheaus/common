import { is } from '../extensions/is';

interface ICommonConfig<T> {
  onFailure?(error: Error): T;
  onSuccess?(result: T, attempts: number): T | void;
}

interface IConfigMaxAttempts {
  maxAttempts: number;
  onAttempt?(attempt: number, error: Error): boolean | void;
}

interface IConfigOnAttempt {
  onAttempt(attempt: number, error: Error): boolean | void;
}

type IConfig<T> = ICommonConfig<T> & (IConfigMaxAttempts | IConfigOnAttempt);

export function repeatOnError<T>(delegate: () => T, config: IConfig<T>): T {
  const { onSuccess, onAttempt, onFailure, maxAttempts }: ICommonConfig<T> & IConfigMaxAttempts & IConfigOnAttempt = {
    onSuccess: () => void 0,
    onAttempt: () => true,
    maxAttempts: 0,
    ...config,
  };
  let attempt = 1;

  const handleError = (error: Error): T => {
    if (onAttempt(attempt, error) !== false && (maxAttempts === 0 || attempt < maxAttempts)) {
      attempt++;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return attemptToExecuteDelegate();
    } else if (onFailure) {
      return onFailure(error);
    } else {
      throw error;
    }
  };

  const attemptToExecuteDelegate = (): T => {
    try {
      let result = delegate();
      if (is.promise(result)) { return result.catch(handleError) as unknown as T; }
      let successResult: T | void | undefined;
      try { successResult = onSuccess(result, attempt); } catch (e) { /* ignore */ }
      if (successResult !== undefined) { result = successResult as T; }
      return result;
    } catch (error) {
      return handleError(error as Error);
    }
  };

  return attemptToExecuteDelegate();
}