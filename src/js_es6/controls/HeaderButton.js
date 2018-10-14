

export default class HeaderButton {
    constructor(header, label, cssClass, action) {
        this._header = header;
        this.element = $('<li class="' + cssClass + '" title="' + label + '"></li>');
        this._header.on('destroy', this._$destroy, this);
        this._action = action;
        this.element.on('click touchstart', this._action);
        this._header.controlsContainer.append(this.element);
    }

    _$destroy() {
        this.element.off();
        this.element.remove();
    }
}
