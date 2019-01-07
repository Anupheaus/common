interface IConfig {
    name?: string;
    message: string;
    code?: number;
    info?: object;
    internalError?: Error;
}

export class BaseError extends Error {
    constructor(config: IConfig, self: Function) {
        super(config.message);
        this.name = config.name || this.constructor.name;
        this.code = config.code || 500;
        this.info = config.info;
        this.internalError = config.internalError;
        Object.setPrototypeOf(this, self.prototype);
    }

    public name: string;
    public code: number;
    public info: object;
    public internalError: Error;

    protected toJSON() {
        let { message, name, code, info, internalError, stack } = (this as BaseError);
        info = info ? JSON.stringify(info) as any : undefined;
        return {
            name,
            message,
            code,
            info,
            internalError,
            stack,
        };
    }
}
