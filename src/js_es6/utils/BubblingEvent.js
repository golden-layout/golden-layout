

export default class BubblingEvent {
    constructor(name, origin) {
        this.name = name;
        this.origin = origin;
        this.isPropagationStopped = false;
    }

    stopPropagation() {
        this.isPropagationStopped = true;
    }
}
