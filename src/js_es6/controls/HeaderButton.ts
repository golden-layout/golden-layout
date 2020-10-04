import { createTemplateHtmlElement } from '../utils/utils';
import { Header } from './Header';

export class HeaderButton {
    private _clickEventListener = () => this.onClick();
    private _touchStartEventListener = () => this.onTouchStart();

    element: HTMLElement;
    constructor(private _header: Header, label: string, cssClass: string, private _pushEvent: HeaderButton.PushEvent) {
        this.element = createTemplateHtmlElement('<li class="' + cssClass + '" title="' + label + '"></li>');
        this._header.on('destroy', this._$destroy);
        this.element.addEventListener('click', this._clickEventListener);
        this.element.addEventListener('touchstart', this._touchStartEventListener);
        this._header.controlsContainerElement.appendChild(this.element);
    }

    _$destroy(): void {
        this.element.removeEventListener('click', this._clickEventListener);
        this.element.removeEventListener('touchstart', this._touchStartEventListener);
        this.element.parentNode?.removeChild(this.element);
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
}
