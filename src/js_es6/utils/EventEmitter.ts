/**
 * A generic and very fast EventEmitter implementation. On top of emitting the actual event it emits an
 * ALL_EVENT event for every event triggered. This allows to hook into it and proxy events forwards
 */
export class EventEmitter {
    /** @internal */
    private _allEventSubscriptions: EventEmitter.UnknownCallback[] = [];
    /** @internal */
    private _subscriptionsMap = new Map<string, EventEmitter.UnknownCallback[]>();

    /**
     * Emit an event and notify listeners
     *
     * @param   eventName The name of the event
     * @param   args additional arguments that will be passed to the listener
     */
    emit<K extends keyof EventEmitter.EventParamsMap>(eventName: K, ...args: EventEmitter.EventParamsMap[K]): void {
        let subcriptions = this._subscriptionsMap.get(eventName);

        if (subcriptions !== undefined) {
            subcriptions = subcriptions.slice();
            for (let i = 0; i < subcriptions.length; i++) {
                const subscription = subcriptions[i];
                subscription(...args);
            }
        }

        const unknownArgs = args as EventEmitter.UnknownParams;
        unknownArgs.unshift(eventName);

        const allEventSubs = this._allEventSubscriptions.slice();

        for (let i = 0; i < allEventSubs.length; i++) {
            allEventSubs[i](unknownArgs);
        }
    }

    /** @internal */
    emitUnknown(eventName: string, ...args: EventEmitter.UnknownParams): void {
        let subs = this._subscriptionsMap.get(eventName);

        if (subs !== undefined) {
            subs = subs.slice();
            for (let i = 0; i < subs.length; i++) {
                subs[i](...args);
            }
        }

        args.unshift(eventName);

        const allEventSubs = this._allEventSubscriptions.slice();

        for (let i = 0; i < allEventSubs.length; i++) {
            allEventSubs[i](...args);
        }
    }

    /**
     * Emit an event that bubbles up the item tree.
     *
     * @param  eventName The name of the event
     * @internal
     */
    emitBubblingEvent<K extends keyof EventEmitter.EventParamsMap>(eventName: K): void {
        const event = new EventEmitter.BubblingEvent(eventName, this);
        this.emitUnknown(eventName, event);
    }

    /** @internal */
    emitUnknownBubblingEvent(eventName: string): void {
        const event = new EventEmitter.BubblingEvent(eventName, this);
        this.emitUnknown(eventName, event);
    }

    /**
     * Removes a listener for an event, or all listeners if no callback and context is provided.
     * @param eventName The name of the event
     * @param callback The previously registered callback method (optional)
     */
    off<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        const unknownCallback = callback as EventEmitter.UnknownCallback;
        this.offUnknown(eventName, unknownCallback);
    }

    /** @internal */
    offUnknown(eventName: string, callback: EventEmitter.UnknownCallback): void {
        if (eventName === EventEmitter.ALL_EVENT) {
            this.removeSubscription(eventName, this._allEventSubscriptions, callback);
        } else {
            const subscriptions = this._subscriptionsMap.get(eventName);
            if (subscriptions === undefined) {
                throw new Error('No subscribtions to unsubscribe for event ' + eventName);
            } else {
                this.removeSubscription(eventName, subscriptions, callback);
            }
        }
    }

    /**
     * Alias for off
     */
    unbind = this.off;

    /**
     * Alias for emit
     */
    trigger = this.emit;

    /**
     * Listen for events
     *
     * @param   eventName    The name of the event to listen to
     * @param   callback The callback to execute when the event occurs
     */
    on<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        const unknownCallback = callback as EventEmitter.UnknownCallback;
        this.onUnknown(eventName, unknownCallback);
    }

    /** @internal */
    onUnknown(eventName: string, callback: EventEmitter.UnknownCallback): void {
        if (eventName === EventEmitter.ALL_EVENT) {
            this._allEventSubscriptions.push(callback);
        } else {
            let subscriptions = this._subscriptionsMap.get(eventName);
            if (subscriptions !== undefined) {
                subscriptions.push(callback);
            } else {
                subscriptions = [callback];
                this._subscriptionsMap.set(eventName, subscriptions);
            }
        }
    }

    /** @internal */
    private removeSubscription(eventName: string, subscriptions: EventEmitter.UnknownCallback[], callback: EventEmitter.UnknownCallback) {
        const idx = subscriptions.indexOf(callback);
        if (idx < 0) {
            throw new Error('Nothing to unbind for ' + eventName);
        } else {
            subscriptions.splice(idx, 1);
        }
    }
}

export namespace EventEmitter {
    /**
     * The name of the event that's triggered for every other event
     *
     * usage
     *
     * myEmitter.on( EventEmitter.ALL_EVENT, function( eventName, argsArray ){
     *  //do stuff
     * });
     */
    export const ALL_EVENT = '__all';

    /** @internal */
    export type UnknownCallback = (this: void, ...args: UnknownParams) => void;
    export type Callback<K extends keyof EventEmitter.EventParamsMap> = (this: void, ...args: EventParamsMap[K]) => void;

    export interface EventParamsMap {
        "__all": UnknownParams;
        "activeContentItemChanged": UnknownParam;
        "beforeItemDestroyed": BubblingEventParam;
        "close": NoParams;
        "closed": NoParams;
        "destroy": NoParams;
        "drag": DragParams;
        "dragStart": DragStartParams;
        "dragStop": DragStopParams;
        "hide": NoParams;
        "initialised": NoParams;
        "itemCreated": BubblingEventParam;
        "itemDestroyed": BubblingEventParam;
        "itemDropped": UnknownParam;
        "maximised": NoParams;
        "minimised": NoParams;
        "open": NoParams;
        "popIn": NoParams;
        "resize": NoParams;
        "selectionChanged": UnknownParam;
        "show": NoParams;
        "shown": NoParams;
        "stateChanged": NoParams;
        "tab": UnknownParam;
        "tabCreated": UnknownParam;
        "titleChanged": StringParam;
        "windowClosed": UnknownParam;
        "windowOpened": UnknownParam;
    }

    export type UnknownParams = unknown[];
    export type NoParams = [];
    export type UnknownParam = [unknown];
    export type BubblingEventParam = [EventEmitter.BubblingEvent]
    export type StringParam = [string];
    export type DragStartParams = [originalX: number, originalY: number];
    export type DragStopParams = [event: DragEvent];
    export type DragParams = [offsetX: number, offsetY: number, event: DragEvent];

    export class BubblingEvent {
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

    export interface DragEvent {
        mouseEvent: MouseEvent | undefined;
        touchEvent: TouchEvent | undefined;
        pageX: number;
        pageY: number;
    }
}
