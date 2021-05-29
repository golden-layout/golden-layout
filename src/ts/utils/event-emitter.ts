import { BrowserPopout } from '../controls/browser-popout';
import { Tab } from '../controls/tab';
import { ComponentItem } from '../items/component-item';

/**
 * A generic and very fast EventEmitter implementation. On top of emitting the actual event it emits an
 * {@link (EventEmitter:namespace).ALL_EVENT} event for every event triggered. This allows to hook into it and proxy events forwards
 * @public
 */
export class EventEmitter {
    /** @internal */
    private _allEventSubscriptions: EventEmitter.UnknownCallback[] = [];
    /** @internal */
    private _subscriptionsMap = new Map<string, EventEmitter.UnknownCallback[]>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tryBubbleEvent(name: string, args: unknown[]): void {
        // overridden by ContentItem
    }

    /**
     * Emit an event and notify listeners
     *
     * @param eventName - The name of the event
     * @param args - Additional arguments that will be passed to the listener
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

        this.emitAllEvent(eventName, args);
        this.tryBubbleEvent(eventName, args);
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

        this.emitAllEvent(eventName, args);
        this.tryBubbleEvent(eventName, args);
    }

    /* @internal **/
    emitBaseBubblingEvent<K extends keyof EventEmitter.EventParamsMap>(eventName: K): void {
        const event = new EventEmitter.BubblingEvent(eventName, this);
        this.emitUnknown(eventName, event);
    }

    /** @internal */
    emitUnknownBubblingEvent(eventName: string): void {
        const event = new EventEmitter.BubblingEvent(eventName, this);
        this.emitUnknown(eventName, event);
    }

    /**
     * Removes a listener for an event.
     * @param eventName - The name of the event
     * @param callback - The previously registered callback method (optional)
     */
    removeEventListener<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        const unknownCallback = callback as EventEmitter.UnknownCallback;
        this.removeUnknownEventListener(eventName, unknownCallback);
    }

    off<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        this.removeEventListener(eventName, callback);
    }

    /**
     * Alias for off
     */
    unbind = this.removeEventListener;

    /**
     * Alias for emit
     */
    trigger = this.emit;

    /**
     * Listen for events
     *
     * @param eventName - The name of the event to listen to
     * @param callback - The callback to execute when the event occurs
     */
    addEventListener<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        const unknownCallback = callback as EventEmitter.UnknownCallback;
        this.addUnknownEventListener(eventName, unknownCallback);
    }

    on<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void {
        this.addEventListener(eventName, callback);
    }

    /** @internal */
    private addUnknownEventListener(eventName: string, callback: EventEmitter.UnknownCallback): void {
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
    private removeUnknownEventListener(eventName: string, callback: EventEmitter.UnknownCallback): void {
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

    /** @internal */
    private removeSubscription(eventName: string, subscriptions: EventEmitter.UnknownCallback[], callback: EventEmitter.UnknownCallback) {
        const idx = subscriptions.indexOf(callback);
        if (idx < 0) {
            throw new Error('Nothing to unbind for ' + eventName);
        } else {
            subscriptions.splice(idx, 1);
        }
    }

    /** @internal */
    private emitAllEvent(eventName: string, args: unknown[]) {
        const allEventSubscriptionsCount = this._allEventSubscriptions.length;
        if (allEventSubscriptionsCount > 0) {
            const unknownArgs = args.slice() as EventEmitter.UnknownParams;
            unknownArgs.unshift(eventName);

            const allEventSubcriptions = this._allEventSubscriptions.slice();

            for (let i = 0; i < allEventSubscriptionsCount; i++) {
                allEventSubcriptions[i](...unknownArgs);
            }
        }
    }
}

/** @public */
export namespace EventEmitter {
    /**
     * The name of the event that's triggered for every event
     */
    export const ALL_EVENT = '__all';

    export const headerClickEventName = 'stackHeaderClick';
    export const headerTouchStartEventName = 'stackHeaderTouchStart';

    /** @internal */
    export type UnknownCallback = (this: void, ...args: UnknownParams) => void;
    export type Callback<K extends keyof EventEmitter.EventParamsMap> = (this: void, ...args: EventParamsMap[K]) => void;

    export interface EventParamsMap {
        "__all": UnknownParams;
        "activeContentItemChanged": ComponentItemParam;
        "close": NoParams;
        "closed": NoParams;
        "destroy": NoParams;
        "drag": DragParams;
        "dragStart": DragStartParams;
        "dragStop": DragStopParams;
        "hide": NoParams;
        "initialised": NoParams;
        "itemDropped": ComponentItemParam;
        "maximised": NoParams;
        "minimised": NoParams;
        "open": NoParams;
        "popIn": NoParams;
        "resize": NoParams;
        "show": NoParams;
        /** @deprecated - use show instead */
        "shown": NoParams;
        "stateChanged": NoParams;
        "tab": TabParam;
        "tabCreated": TabParam;
        "titleChanged": StringParam;
        "windowClosed": PopoutParam;
        "windowOpened": PopoutParam;
        "beforeComponentRelease": BeforeComponentReleaseParams;
        "beforeItemDestroyed": BubblingEventParam;
        "itemCreated": BubblingEventParam;
        "itemDestroyed": BubblingEventParam;
        "focus": BubblingEventParam;
        "blur": BubblingEventParam;
        "stackHeaderClick": ClickBubblingEventParam;
        "stackHeaderTouchStart": TouchStartBubblingEventParam;
        "userBroadcast": UnknownParams;
    }

    export type UnknownParams = unknown[];
    export type NoParams = [];
    export type UnknownParam = [unknown];
    export type PopoutParam = [BrowserPopout];
    export type ComponentItemParam = [ComponentItem];
    export type TabParam = [Tab];
    export type BubblingEventParam = [EventEmitter.BubblingEvent]
    export type StringParam = [string];
    export type DragStartParams = [originalX: number, originalY: number];
    export type DragStopParams = [event: PointerEvent | undefined];
    export type DragParams = [offsetX: number, offsetY: number, event: PointerEvent];
    export type BeforeComponentReleaseParams = [component: unknown];
    export type ClickBubblingEventParam = [ClickBubblingEvent];
    export type TouchStartBubblingEventParam = [TouchStartBubblingEvent];

    export class BubblingEvent {
        /** @internal */
        private _isPropagationStopped = false;

        get name(): string { return this._name; }
        get target(): EventEmitter { return this._target; }
        /** @deprecated Use {@link (EventEmitter:namespace).(BubblingEvent:class).target} instead */
        get origin(): EventEmitter { return this._target; }
        get isPropagationStopped(): boolean { return this._isPropagationStopped; }

        /** @internal */
        constructor(
            /** @internal */
            private readonly _name: string,
            /** @internal */
            private readonly _target: EventEmitter) {
        }

        stopPropagation(): void {
            this._isPropagationStopped = true;
        }
    }

    export class ClickBubblingEvent extends BubblingEvent {
        get mouseEvent(): MouseEvent { return this._mouseEvent; }

        /** @internal */
        constructor(name: string, target: EventEmitter,
            /** @internal */
            private readonly _mouseEvent: MouseEvent
        ) {
            super(name, target);
        }
    }

    export class TouchStartBubblingEvent extends BubblingEvent {
        get touchEvent(): TouchEvent { return this._touchEvent; }

        /** @internal */
        constructor(name: string, target: EventEmitter,
            /** @internal */
            private readonly _touchEvent: TouchEvent
        ) {
            super(name, target);
        }
    }
}
