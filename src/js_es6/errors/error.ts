export class ConfigurationError extends Error {
    constructor(message: string, public node: x) {
        super(message);

        this.name = 'Configuration Error';
        this.node = node;
    }
}

export abstract class CodedError extends Error {
    constructor(type: string, code: string, message?: string) {
        super(`${type}: ${code}${message === undefined ? '' : ': ' + message}`)
    }
}

export class AssertError extends CodedError {
    constructor(code: string, message?: string) {
        super('Assert', code, message)
    }
}

export class UnreachableCaseError extends CodedError {
    constructor(code: string, variableValue: never, message?: string) {
        super('UnreachableCase', code, `${variableValue}${message === undefined ? '' : ': ' + message}`)
    }
}

export class UnexpectedNullError extends CodedError {
    constructor(code: string, message?: string) {
        super('UnexpectedNull', code, message)
    }
}

export class UnexpectedUndefinedError extends CodedError {
    constructor(code: string, message?: string) {
        super('UnexpectedUndefined', code, message)
    }
}
