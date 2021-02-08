import { ComponentContainer, JsonValue } from '..';

export class BooleanComponent {
    static readonly typeName = 'boolean';

    private _inputElement: HTMLInputElement;
    
    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();

    constructor(private _container: ComponentContainer, state: JsonValue | undefined) {
        this._inputElement = document.createElement('input');
        this._inputElement.type = "checkbox";
        this._inputElement.checked = (state as boolean) ?? true;
        this._inputElement.style.display = "block";
        this._container.element.appendChild(this._inputElement);

        this._container.stateRequestEvent = () => this.handleContainerStateRequestEvent();

        this._container.element.addEventListener('click', this._containerClickListener);
        this._container.element.addEventListener('focusin', this._containerFocusinListener);
    }

    handleContainerStateRequestEvent(): boolean {
        return this._inputElement.checked;
    }

    private handleClickFocusEvent(): void {
        this._container.focus();
    }
}
