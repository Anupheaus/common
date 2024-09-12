/* eslint-disable max-classes-per-file */
// tslint:disable:interface-name
import './object';
import type { AnyObject } from './global';
import { bind } from '../decorators';
import { is } from './is';
import { InternalError } from '../errors';

// eslint-disable-next-line no-shadow
export enum PromiseState {
  Pending,
  Fulfilled,
  Rejected,
}

export class DeferredPromise<T = void> extends Promise<T> {
  constructor();
  constructor(executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void);
  constructor(executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void, meta: AnyObject = {}) {
    super((resolve, reject) => {
      meta.resolve = resolve;
      meta.reject = reject;
      executor?.(resolve, reject);
    });
    this.#resolve = meta.resolve;
    this.#reject = meta.reject;
    this.#state = PromiseState.Pending;
  }

  #state: PromiseState;
  #resolve: (value?: T | PromiseLike<T>) => void;
  #reject: (reason?: unknown) => void;

  public get state(): PromiseState { return this.#state; }

  @bind
  public resolve(value?: T | PromiseLike<T>): void {
    if (this.#state !== PromiseState.Pending) return;
    this.#state = PromiseState.Fulfilled;
    this.#resolve(value);
  }

  @bind
  public reject(reason?: unknown): void {
    if (this.#state !== PromiseState.Pending) return;
    this.#state = PromiseState.Rejected;
    this.#reject(reason);
  }

}

class PromiseConstructorExtensions {

  public async delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  public createDeferred<T = void>(): DeferredPromise<T> {
    return new DeferredPromise<T>();
  }

  public async whenAllSettled<T>(promises: Promise<T>[]): Promise<[T[], Error[]]> {
    const results = await Promise.allSettled(promises);
    const success = results.filter(result => result.status === 'fulfilled').map(result => (result as PromiseFulfilledResult<T>).value);
    const failed = results.filter(result => result.status === 'rejected').map(result => {
      const reason = (result as PromiseRejectedResult).reason;
      if (is.string(reason)) return new Error(reason);
      if (reason instanceof Error) return reason;
      return new InternalError('Unknown error');
    });
    return [success, failed];
  }

}

Object.extendPrototype(Promise, PromiseConstructorExtensions.prototype);
declare global { interface PromiseConstructor extends PromiseConstructorExtensions { } }
