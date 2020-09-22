import {
    isFunction
} from '../utils/utils';

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
export default class EventEmitter {
    private _mSubscriptions: Record<string, CallbackWithContext[]>;

    constructor() {
        this._mSubscriptions = {};
        this._mSubscriptions[ALL_EVENT] = [];
    }

    /**
     * Emit an event and notify listeners
     *
     * @param   {String} sEvent The name of the event
     * @param    {Mixed}  various additional arguments that will be passed to the listener
     *
     * @returns {void}
     */
    emit (sEvent: string, ...args: unknown[]): void {
        // let args = Array.prototype.slice.call(arguments, 1);

        let subs = this._mSubscriptions[sEvent];

        if (subs) {
            subs = subs.slice();
            for (let i = 0; i < subs.length; i++) {
                const ctx = subs[i].ctx || {};
                subs[i].fn(ctx, args);
            }
        }

        args.unshift(sEvent);

        const allEventSubs = this._mSubscriptions[ALL_EVENT].slice();

        for (let i = 0; i < allEventSubs.length; i++) {
            const ctx = allEventSubs[i].ctx || {};
            allEventSubs[i].fn.apply(ctx, args);
        }
    }

    /**
     * Removes a listener for an event, or all listeners if no callback and context is provided.
     *
     * @param   {String} sEvent    The name of the event
     * @param   {Function} fCallback The previously registered callback method (optional)
     * @param   {Object} oContext  The previously registered context (optional)
     *
     * @returns {void}
     */
    unbind(sEvent: string, fCallback: Function, oContext?: object): void {
        if (!this._mSubscriptions[sEvent]) {
            throw new Error('No subscribtions to unsubscribe for event ' + sEvent);
        }

        let bUnbound = false;

        for (let i = 0; i < this._mSubscriptions[sEvent].length; i++) {
            if (
                (!fCallback || this._mSubscriptions[sEvent][i].fn === fCallback) &&
                (!oContext || oContext === this._mSubscriptions[sEvent][i].ctx)
            ) {
                this._mSubscriptions[sEvent].splice(i, 1);
                bUnbound = true;
            }
        }

        if (bUnbound === false) {
            throw new Error('Nothing to unbind for ' + sEvent);
        }
    }

    /**
     * Alias for unbind
     */
    off = this.unbind;

    /**
     * Alias for emit
     */
    trigger = this.emit;

    /**
     * Listen for events
     *
     * @param   {String} eventName    The name of the event to listen to
     * @param   {Function} callback The callback to execute when the event occurs
     * @param   {[Object]} oContext The value of the this pointer within the callback function
     *
     * @returns {void}
     */
    on(eventName: string, callback: Function, oContext?: [Record<string, unknown>]): void {
        if (!isFunction(callback)) {
            throw new Error('Tried to listen to event ' + eventName + ' with non-function callback ' + callback);
        }

        if (!this._mSubscriptions[eventName]) {
            this._mSubscriptions[eventName] = [];
        }

        this._mSubscriptions[eventName].push({
            fn: callback,
            ctx: oContext
        });
    }
}

export type Callback = (...args: unknown[]) => void;

interface CallbackWithContext {
    fn: Callback;
    ctx: Record<string, unknown>;
}

// export default interface EventEmitter {
//     /**
//      * Subscribe to an event
//      * @param eventName The name of the event to describe to
//      * @param callback The function that should be invoked when the event occurs
//      * @param context The value of the this pointer in the callback function
//      */
//     on(eventName: string, callback: Function, context?: any): void;

//     /**
//      * Notify listeners of an event and pass arguments along
//      * @param eventName The name of the event to emit
//      */
//     emit(eventName: string, arg1?: any, arg2?: any, ...argN: any[]): void;

//     /**
//      * Alias for emit
//      */
//     trigger(eventName: string, arg1?: any, arg2?: any, ...argN: any[]): void;

//     /**
//      * Unsubscribes either all listeners if just an eventName is provided, just a specific callback if invoked with
//      * eventName and callback or just a specific callback with a specific context if invoked with all three
//      * arguments.
//      * @param eventName The name of the event to unsubscribe from
//      * @param callback The function that should be invoked when the event occurs
//      * @param context The value of the this pointer in the callback function
//      */
//     unbind(eventName: string, callback?: Function, context?: any): void;

//     /**
//      * Alias for unbind
//      */
//     off(eventName: string, callback?: Function, context?: any): void;
// }
