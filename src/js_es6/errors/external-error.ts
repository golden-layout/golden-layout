import { Json } from '../utils/types';

export abstract class ExternalError extends Error {
    constructor(public readonly type: string, message: string) {
        super(message);
    }
}

export class ConfigurationError extends ExternalError {
    constructor(message: string, public node: Json | undefined) {
        super('Configuration', message);

        this.node = node;
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
