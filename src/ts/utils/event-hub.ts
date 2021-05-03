import { LayoutManager } from '../layout-manager';
import { EventEmitter } from './event-emitter';

// Add our ChildEvent to WindowEventMap for type safety
/** @public */
declare global {
    interface WindowEventMap {
        [EventHub.ChildEventName]: CustomEvent<EventHub.ChildEventDetail>;
    }
}

/**
 * An EventEmitter singleton that propagates events
 * across multiple windows. This is a little bit trickier since
 * windows are allowed to open childWindows in their own right
 *
 * This means that we deal with a tree of windows. Hence the rules for event propagation are:
 *
 * - Propagate events from this layout to both parents and children
 * - Propagate events from parent to this and children
 * - Propagate events from children to the other children (but not the emitting one) and the parent
 *
 * @public
 */
export class EventHub extends EventEmitter {
    private _childEventSource: LayoutManager | null;
    private _dontPropagateToParent: string | null;

    private _childEventListener = (childEvent: CustomEvent<EventHub.ChildEventDetail>) => this.onEventFromChild(childEvent);

    constructor(private _layoutManager: LayoutManager) {

        super();

        this._dontPropagateToParent = null;
        this._childEventSource = null;
        this.on(EventEmitter.ALL_EVENT, (evn, ...args) => this.onEventFromThis(evn as string, args));

        globalThis.addEventListener(EventHub.ChildEventName, this._childEventListener, { passive: true });
    }

    /**
     * Broadcasts a message to all other currently opened windows.
     * @public
     */
    emitUserBroadcast(...args: EventEmitter.UnknownParams): void {
        this.emit('userBroadcast', args);
    }

    /**
     * Destroys the EventHub
     * @internal
     */
    destroy(): void {
        globalThis.removeEventListener(EventHub.ChildEventName, this._childEventListener);
    }

    /**
     * Called by the parent layout.
     * @internal
     */
    onEventFromParent(eventName: string, ...args: unknown[]): void {
        this._dontPropagateToParent = eventName;
        this.emitUnknown(eventName, args);
    }

    /**
     * Called on every event emitted on this eventHub, regardles of origin.
     */
    private onEventFromThis(eventName: string, ...args: unknown[]) {
        if (this._layoutManager.isSubWindow && args[0] !== this._dontPropagateToParent) {
            this.propagateToParent(eventName, args);
        }
        this.propagateToChildren(eventName, args);

        //Reset
        this._dontPropagateToParent = null;
        this._childEventSource = null;
    }

    /**
     * Callback for child events raised on the window
     */
    private onEventFromChild(event: CustomEvent<EventHub.ChildEventDetail>) {
        const detail = event.detail;
        this._childEventSource = detail.layoutManager;
        this.emitUnknown(detail.eventName, detail.args);
    }

    /**
     * Propagates the event to the parent by emitting
     * it on the parent's DOM window
     */
    private propagateToParent(eventName: string, args: unknown[]) {
        const detail: EventHub.ChildEventDetail = {
            layoutManager: this._layoutManager,
            eventName,
            args: args,
        }

        const eventInit: EventHub.ChildEventInit = {
            bubbles: true,
            cancelable: true,
            detail,
        };

        const event = new CustomEvent<EventHub.ChildEventDetail>(EventHub.ChildEventName, eventInit);
        globalThis.opener.dispatchEvent(event);
    }

    /**
     * Propagate events to children
     */
    private propagateToChildren(eventName: string, args: unknown[]) {

        for (let i = 0; i < this._layoutManager.openPopouts.length; i++) {
            const childGl = this._layoutManager.openPopouts[i].getGlInstance();

            if (childGl && childGl !== this._childEventSource) {
                childGl.eventHub.onEventFromParent(eventName, args);
            }
        }
    }
}

/** @public */
export namespace EventHub {
    export const ChildEventName = 'gl_child_event';
    export type ChildEventDetail = {
        layoutManager: LayoutManager;
        eventName: string;
        args: unknown[];
    };

    export type ChildEventInit = CustomEventInit<ChildEventDetail>;
}
