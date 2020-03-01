import { bind } from '../decorators';
import { CancellationCallback } from './models';

export class CancellationToken {
  private constructor() {
    this._isCancelled = false;
    this._callbacks = [];
    this._reason = undefined;
    this._isDisposed = false;
  }

  //#region Static

  public static create(): CancellationToken {
    return new CancellationToken();
  }

  //#endregion

  //#region Variables

  private _isCancelled: boolean;
  private _reason: string | undefined;
  private _callbacks: CancellationCallback[];
  private _isDisposed: boolean;

  //#endregion

  //#region Properties

  public get isCancelled() { return this._isCancelled; }

  public get reason() { return this._reason; }

  //#endregion

  //#region Methods

  public cancel(): void;
  public cancel(reason: string): void;
  @bind
  public cancel(reason?: string): void {
    if (this._isDisposed || this._isCancelled) { return; }
    this._isCancelled = true;
    this._reason = reason ?? '';
    this.callAllCallbacks();
  }

  @bind
  public onCancelled(callback: CancellationCallback): boolean {
    if (this._isDisposed) { return false; }
    if (this._isCancelled && this._reason != null) {
      callback(this._reason);
    } else {
      this._callbacks.push(callback);
    }
    return this._isCancelled;
  }

  @bind
  public dispose(): void {
    this._isDisposed = true;
    this._callbacks.length = 0;
  }

  private callAllCallbacks(): void {
    const reason = this._reason;
    if (reason == null) return;
    this._callbacks.forEach(callback => callback(reason));
    this._callbacks.length = 0;
  }

  //#endregion

}
