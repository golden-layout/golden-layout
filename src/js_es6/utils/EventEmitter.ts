import { isFunction } from '../utils/utils';

/**
 * A generic and very fast EventEmitter
 * implementation. On top of emitting the
 * actual event it emits an
 *
 * EventEmitter.ALL_EVENT
 *
 * event for every event triggered. This allows
 * to hook into it and proxy events forwards
 *
 * @constructor
 */
export class EventEmitter {
    private _allEventSubscriptions: EventEmitter.UnknownCallback[] = [];
    private _subscriptionsMap = new Map<string, EventEmitter.UnknownCallback[]>();

    /**
     * Emit an event and notify listeners
     *
     * @param   {String} eventName The name of the event
     * @param    {Mixed}  various additional arguments that will be passed to the listener
     *
     * @returns {void}
     */
    emit<K extends keyof EventEmitter.EventParamsMap>(eventName: K, ...args: EventEmitter.EventParamsMap[K]): void {
        let subs = this._subscriptionsMap.get(eventName);

        if (subs !== undefined) {
            subs = subs.slice();
            for (let i = 0; i < subs.length; i++) {
                subs[i](args);
            }
        }

        const unknownArgs = args as EventEmitter.UnknownParams;
        unknownArgs.unshift(eventName);

        const allEventSubs = this._allEventSubscriptions.slice();

        for (let i = 0; i < allEventSubs.length; i++) {
            allEventSubs[i](unknownArgs);
        }
    }

    /**
     * Removes a listener for an event, or all listeners if no callback and context is provided.
     *
     * @param   eventName    The name of the event
     * @param   callback The previously registered callback method (optional)
     *
     * @returns {void}
     */
    off<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        const subscriptions = this._subscriptionsMap.get(eventName);
        if (subscriptions === undefined) {
            throw new Error('No subscribtions to unsubscribe for event ' + eventName);
        } else {
            const unknownCallback = callback as EventEmitter.UnknownCallback;
            const idx = subscriptions.indexOf(unknownCallback);
            if (idx < 0) {
                throw new Error('Nothing to unbind for ' + eventName);
            } else {
                subscriptions.splice(idx, 1);
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
        if (!isFunction(callback)) {
            throw new Error('Tried to listen to event ' + eventName + ' with non-function callback ' + callback);
        } else {
            const unknownCallback = callback as EventEmitter.UnknownCallback;
            if (eventName === EventEmitter.ALL_EVENT) {
                this._allEventSubscriptions.push(unknownCallback);
            } else {
                let subscriptions = this._subscriptionsMap.get(eventName);
                if (subscriptions !== undefined) {
                    subscriptions.push(unknownCallback);
                } else {
                    subscriptions = [unknownCallback];
                    this._subscriptionsMap.set(eventName, subscriptions);
                }
            }
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

    // export type Callback = (this: void, ...args: readonly unknown[]) => void;

    export type UnknownCallback = (this: void, ...args: UnknownParams) => void;
    export type Callback<K extends keyof EventEmitter.EventParamsMap> = (this: void, ...args: EventParamsMap[K]) => void;

    export interface EventParamsMap {
        "__all": UnknownParams;
        "drag": DragParams;
        "dragStop": NoParams;
    }

    export type UnknownParams = unknown[];
    export type NoParams = [];

    export interface DragEvent {
        mouseEvent: MouseEvent | undefined;
        touchEvent: TouchEvent | undefined;
        pageX: number;
        pageY: number;
    }
    export type DragParams = [offsetX: number, offsetY: number, event: DragEvent];
}
