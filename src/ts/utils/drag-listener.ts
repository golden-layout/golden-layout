import { DomConstants } from './dom-constants';
import { EventEmitter } from './event-emitter';

/** @internal */
export class DragListener extends EventEmitter {
    private _timeout: ReturnType<typeof setTimeout> | undefined;
    private _allowableTargets: HTMLElement[];
    private _oDocument: Document;
    private _eBody: HTMLElement;
    private _nDelay: number;
    private _nDistance: number;
    private _nX: number;
    private _nY: number;
    private _nOriginalX: number;
    private _nOriginalY: number;
    private _dragging: boolean;
    private _pointerTracking = false;

    private _pointerDownEventListener = (ev: PointerEvent) => this.onPointerDown(ev);
    private _pointerMoveEventListener = (ev: PointerEvent) => this.onPointerMove(ev);
    private _pointerUpEventListener = (ev: PointerEvent) => this.onPointerUp(ev);

    constructor(private _eElement: HTMLElement, extraAllowableChildTargets: HTMLElement[]) {
        super();

        this._timeout = undefined;

        this._allowableTargets = [_eElement, ...extraAllowableChildTargets];
        this._oDocument = document;
        this._eBody = document.body;

        /**
         * The delay after which to start the drag in milliseconds
         * Do NOT make too short (previous value of 200 was not long enough for my touchpad)
         * Should generally rely on the mouse move to start drag.  Not this delay.
         */
        this._nDelay = 1800;

        /**
         * The distance the mouse needs to be moved to qualify as a drag
         * Previous comment: works better with delay only
         * ???
         * Probably somehow needs tuning for different devices
         */
        this._nDistance = 10;

        this._nX = 0;
        this._nY = 0;

        this._nOriginalX = 0;
        this._nOriginalY = 0;

        this._dragging = false;

        this._eElement.addEventListener('pointerdown', this._pointerDownEventListener, { passive: true });
    }

    destroy(): void {
        this.checkRemovePointerTrackingEventListeners();

        this._eElement.removeEventListener('pointerdown', this._pointerDownEventListener);
    }

    cancelDrag(): void {
        this.processDragStop(undefined);
    }

    private onPointerDown(oEvent: PointerEvent) {
        if (this._allowableTargets.includes(oEvent.target as HTMLElement) && oEvent.isPrimary) {
            const coordinates = this.getPointerCoordinates(oEvent);
            this.processPointerDown(coordinates);
        }
    }

    private processPointerDown(coordinates: DragListener.PointerCoordinates) {
        this._nOriginalX = coordinates.x;
        this._nOriginalY = coordinates.y;

        this._oDocument.addEventListener('pointermove', this._pointerMoveEventListener);
        this._oDocument.addEventListener('pointerup', this._pointerUpEventListener, { passive: true });
        this._pointerTracking = true;

        this._timeout = setTimeout(
            () => {
                try {
                    this.startDrag()
                }
                catch (err) {
                    console.error(err);
                    throw err;
                }
            }
            , this._nDelay);
    }

    private onPointerMove(oEvent: PointerEvent) {
        if (this._pointerTracking) {
            this.processDragMove(oEvent);
            oEvent.preventDefault();
        }
    }

    private processDragMove(dragEvent: PointerEvent) {
        this._nX = dragEvent.pageX - this._nOriginalX;
        this._nY = dragEvent.pageY - this._nOriginalY;

        if (this._dragging === false) {
            if (
                Math.abs(this._nX) > this._nDistance ||
                Math.abs(this._nY) > this._nDistance
            ) {
                this.startDrag();
            }
        }

        if (this._dragging) {
            this.emit('drag', this._nX, this._nY, dragEvent);
        }
    }

    private onPointerUp(oEvent: PointerEvent) {
        this.processDragStop(oEvent);
    }

    private processDragStop(dragEvent?: PointerEvent) {
        if (this._timeout !== undefined) {
            clearTimeout(this._timeout);
            this._timeout = undefined;
        }

        this.checkRemovePointerTrackingEventListeners();
    
        if (this._dragging === true) {
            this._eBody.classList.remove(DomConstants.ClassName.Dragging);
            this._eElement.classList.remove(DomConstants.ClassName.Dragging);
            this._oDocument.querySelector('iframe')?.style.setProperty('pointer-events', '');
            this._dragging = false;
            this.emit('dragStop', dragEvent);
        }
    }

    private checkRemovePointerTrackingEventListeners(): void {
        if (this._pointerTracking) {
            this._oDocument.removeEventListener('pointermove', this._pointerMoveEventListener);
            this._oDocument.removeEventListener('pointerup', this._pointerUpEventListener);
            this._pointerTracking = false;
        }    
    }

    private startDrag() {
        if (this._timeout !== undefined) {
            clearTimeout(this._timeout);
            this._timeout = undefined;
        }
        this._dragging = true;
        this._eBody.classList.add(DomConstants.ClassName.Dragging);
        this._eElement.classList.add(DomConstants.ClassName.Dragging);
        this._oDocument.querySelector('iframe')?.style.setProperty('pointer-events', 'none');
        this.emit('dragStart', this._nOriginalX, this._nOriginalY);
    }

    private getPointerCoordinates(event: PointerEvent) {
        const result: DragListener.PointerCoordinates = {
            x: event.pageX,
            y: event.pageY
        };
        return result;
    }

}

/** @internal */
export namespace DragListener {
    export interface PointerCoordinates {
        x: number,
        y: number,
    }
}