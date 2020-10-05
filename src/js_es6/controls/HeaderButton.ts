import { EventEmitter } from '../utils/EventEmitter';
import { createTemplateHtmlElement } from '../utils/utils';

export class HeaderButton {
    private _element: HTMLElement;
    private _clickEventListener = () => this.onClick();
    private _touchStartEventListener = () => this.onTouchStart();

    get element(): HTMLElement { return this._element; }

    constructor(private _header: HeaderButton.Header, label: string, cssClass: string, private _pushEvent: HeaderButton.PushEvent) {
        this._element = createTemplateHtmlElement('<li class="' + cssClass + '" title="' + label + '"></li>');
        this._header.on('destroy', this._$destroy);
        this._element.addEventListener('click', this._clickEventListener);
        this._element.addEventListener('touchstart', this._touchStartEventListener);
        this._header.controlsContainerElement.appendChild(this._element);
    }

    _$destroy(): void {
        this._element.removeEventListener('click', this._clickEventListener);
        this._element.removeEventListener('touchstart', this._touchStartEventListener);
        this._element.parentNode?.removeChild(this._element);
    }

    private onClick() {
        this._pushEvent();
    }

    private onTouchStart() {
        this._pushEvent();
    }
}

export namespace HeaderButton {
    export type PushEvent = (this: void) => void;

    export interface Header {
        readonly controlsContainerElement: HTMLElement;
        on<K extends keyof EventEmitter.EventParamsMap>(eventName: K, callback: EventEmitter.Callback<K>): void;
    }
}
