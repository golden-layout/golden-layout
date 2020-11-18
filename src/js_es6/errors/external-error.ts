
export abstract class ExternalError extends Error {
    constructor(public readonly type: string, message: string) {
        super(message);
    }
}

export class ConfigurationError extends ExternalError {
    constructor(message: string, public readonly node?: string) {
        super('Configuration', message);
    }
}

export class PopoutBlockedError extends ExternalError {
    constructor(message: string) {
        super('popoutBlocked', message);
    }    
}

export class ApiError extends ExternalError {
    constructor(message: string) {
        super('API', message);
    }    
}
