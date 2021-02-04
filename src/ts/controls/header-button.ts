import { Header } from './header';

/** @internal */
export class HeaderButton {
    private _element: HTMLElement;
    private _clickEventListener = (ev: MouseEvent) => this.onClick(ev);
    private _touchStartEventListener = (ev: TouchEvent) => this.onTouchStart(ev);

    get element(): HTMLElement { return this._element; }

    constructor(private _header: Header, label: string, cssClass: string, private _pushEvent: HeaderButton.PushEvent) {
        this._element = document.createElement('div');
        this._element.classList.add(cssClass);
        this._element.title = label;
        this._header.on('destroy', () => this.destroy());
        this._element.addEventListener('click', this._clickEventListener, { passive: true });
        this._element.addEventListener('touchstart', this._touchStartEventListener, { passive: true });
        this._header.controlsContainerElement.appendChild(this._element);
    }

    destroy(): void {
        this._element.removeEventListener('click', this._clickEventListener);
        this._element.removeEventListener('touchstart', this._touchStartEventListener);
        this._element.parentNode?.removeChild(this._element);
    }

    private onClick(ev: MouseEvent) {
        this._pushEvent(ev);
    }

    private onTouchStart(ev: TouchEvent) {
        this._pushEvent(ev);
    }
}

/** @internal */
export namespace HeaderButton {
    export type PushEvent = (this: void, ev: Event) => void;
}
