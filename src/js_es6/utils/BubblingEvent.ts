import EventEmitter from './EventEmitter';

export default class BubblingEvent {
    name: string;
    isPropagationStopped: boolean;
    origin: EventEmitter;

    constructor(name: string, origin: EventEmitter) {
        this.name = name;
        this.origin = origin;
        this.isPropagationStopped = false;
    }

    stopPropagation(): void {
        this.isPropagationStopped = true;
    }
}
