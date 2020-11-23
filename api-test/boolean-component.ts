import { ComponentContainer, JsonValue } from '../dist/golden-layout';

export class BooleanComponent {
    static readonly typeName = 'boolean';

    private _inputElement: HTMLInputElement;
    
    constructor(container: ComponentContainer, state: JsonValue | undefined) {
        this._inputElement = document.createElement('input');
        this._inputElement.type = "checkbox";
        this._inputElement.checked = (state as boolean) ?? true;
        this._inputElement.style.display = "block";
        container.contentElement.appendChild(this._inputElement);

        container.stateRequestEvent = () => this.handleContainerStateRequestEvent();
    }

    handleContainerStateRequestEvent(): boolean {
        return this._inputElement.checked;
    }
}