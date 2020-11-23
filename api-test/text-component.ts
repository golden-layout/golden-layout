import { ComponentContainer, JsonValue } from '../dist/golden-layout';

export class TextComponent {
    private static readonly undefinedTextValue = '<undefined>';
    static readonly typeName = 'text';

    private _inputElement: HTMLInputElement;

    constructor(container: ComponentContainer, state: JsonValue | undefined) {
        let textValue: string;
        if (state === undefined) {
            textValue = TextComponent.undefinedTextValue;
        } else {
            if (!JsonValue.isJson(state)) {
                textValue = '<Unexpect type>';
            } else {
                const textState: TextComponent.State = state as TextComponent.State;
                textValue = textState.text;
            }
        }

        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.value = textValue;
        this._inputElement.style.display = "block";
        container.contentElement.appendChild(this._inputElement);

        container.stateRequestEvent = () => this.handleContainerStateRequestEvent();
    }

    handleContainerStateRequestEvent(): TextComponent.State | undefined {
        const text = this._inputElement.value;
        if (text === TextComponent.undefinedTextValue) {
            return undefined;
        } else {
            return {
                text
            }
        }
    }
}

export namespace TextComponent {
    type TextPropertyName = 'text';
    export type State = { [propertyName in TextPropertyName]: string }
}
