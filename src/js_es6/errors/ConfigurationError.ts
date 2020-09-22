

export default class ConfigurationError extends Error {
    constructor(message: string, public node: Config) {
        super();

        this.name = 'Configuration Error';
        this.message = message;
        this.node = node;
    }
}
