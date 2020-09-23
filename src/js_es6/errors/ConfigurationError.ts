export class ConfigurationError extends Error {
    constructor(message: string, public node: x) {
        super();

        this.name = 'Configuration Error';
        this.message = message;
        this.node = node;
    }
}
