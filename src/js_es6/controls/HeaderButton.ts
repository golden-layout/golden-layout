import { createTemplateHtmlElement } from '../utils/utils';
import { Header } from './Header';

export class HeaderButton {
    private _clickEventListener = (ev: MouseEvent) => this.onClick(ev);
    private _touchStartEventListener = (ev: TouchEvent) => this.onTouchStart(ev);

    element: HTMLElement;
    constructor(private _header: Header, label: string, cssClass: string, private _action: HeaderButton.PushEvent) {
        this.element = createTemplateHtmlElement('<li class="' + cssClass + '" title="' + label + '"></li>', 'li');
        this._header.on('destroy', this._$destroy);
        this.element.addEventListener('click', this._clickEventListener);
        this.element.addEventListener('touchstart', this._touchStartEventListener);
        this._header.controlsContainerElement.append(this.element);
    }

    _$destroy(): void {
        this.element.removeEventListener('click', this._clickEventListener);
        this.element.removeEventListener('touchstart', this._touchStartEventListener);
        this.element.parentNode?.removeChild(this.element);
    }

    private onClick(event: MouseEvent) {
        this._action();
    }

    private onTouchStart(event: TouchEvent) {
        this._action();
    }
}

export namespace HeaderButton {
    export type PushEvent = (this: void) => void;
}
