interface IConfig {
  name?: string;
  message: string;
  code?: number;
  info?: object;
  internalError?: Error;
}

export class BaseError extends Error {
  protected constructor(config: IConfig, self: Function) {
    super(config.message);
    this.name = config.name ?? this.constructor.name;
    this.code = config.code ?? 500;
    this.info = config.info;
    this.internalError = config.internalError;
    Object.setPrototypeOf(this, self.prototype);
  }

  public name: string;
  public code: number;
  public info: object | undefined;
  public internalError: Error | undefined;

  protected toJSON() {
    const { message, name, code, info, internalError, stack } = this;
    const infoAsString = info ? JSON.stringify(info) : undefined;
    return {
      name,
      message,
      code,
      info: infoAsString,
      internalError,
      stack,
    };
  }
}
