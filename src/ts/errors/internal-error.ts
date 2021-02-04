/** @internal */
abstract class InternalError extends Error {
    constructor(type: string, code: string, message?: string) {
        super(`${type}: ${code}${message === undefined ? '' : ': ' + message}`)
    }
}

/** @internal */
export class AssertError extends InternalError {
    constructor(code: string, message?: string) {
        super('Assert', code, message)
    }
}

/** @internal */
export class UnreachableCaseError extends InternalError {
    constructor(code: string, variableValue: never, message?: string) {
        super('UnreachableCase', code, `${variableValue}${message === undefined ? '' : ': ' + message}`)
    }
}

/** @internal */
export class UnexpectedNullError extends InternalError {
    constructor(code: string, message?: string) {
        super('UnexpectedNull', code, message)
    }
}

/** @internal */
export class UnexpectedUndefinedError extends InternalError {
    constructor(code: string, message?: string) {
        super('UnexpectedUndefined', code, message)
    }
}
