import { createTemplateHtmlElement } from '../utils/utils';
import Header from './Header';

export class HeaderButton {
    element: HTMLElement;
    constructor(private _header: Header, label: string, cssClass: string, private _action: X) {
        this.element = createTemplateHtmlElement('<li class="' + cssClass + '" title="' + label + '"></li>', 'li');
        this._header.on('destroy', this._$destroy, this);
        this.element.on('click touchstart', this._action);
        this._header.controlsContainer.append(this.element);
    }

    _$destroy() {
        this.element.off();
        this.element.remove();
    }
}
