/** @public */
export abstract class ExternalError extends Error {
    constructor(public readonly type: string, message: string) {
        super(message);
    }
}

/** @public */
export class ConfigurationError extends ExternalError {
    constructor(message: string, public readonly node?: string) {
        super('Configuration', message);
    }
}

/** @public */
export class PopoutBlockedError extends ExternalError {
    constructor(message: string) {
        super('popoutBlocked', message);
    }    
}

/** @public */
export class ApiError extends ExternalError {
    constructor(message: string) {
        super('API', message);
    }    
}
