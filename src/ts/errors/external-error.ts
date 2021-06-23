/** @public */
export abstract class ExternalError extends Error {
    /** @internal */
    constructor(public readonly type: string, message: string) {
        super(message);
    }
}

/** @public */
export class ConfigurationError extends ExternalError {
    /** @internal */
    constructor(message: string, public readonly node?: string) {
        super('Configuration', message);
    }
}

/** @public */
export class PopoutBlockedError extends ExternalError {
    /** @internal */
    constructor(message: string) {
        super('PopoutBlocked', message);
    }
}

/** @public */
export class ApiError extends ExternalError {
    /** @internal */
    constructor(message: string) {
        super('API', message);
    }
}

/** @public */
export class BindError extends ExternalError {
    /** @internal */
    constructor(message: string) {
        super('Bind', message);
    }
}
