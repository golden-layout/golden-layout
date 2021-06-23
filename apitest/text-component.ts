import { ComponentContainer, JsonValue } from '..';
import { ComponentBase } from './component-base';

export class TextComponent extends ComponentBase {
    private static readonly undefinedTextValue = '<undefined>';
    static readonly typeName = 'text';

    private _rootElement: HTMLElement;
    private _inputElement: HTMLInputElement;

    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();

    get rootHtmlElement(): HTMLElement { return this._rootElement; }

    constructor(private _container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) {
        super();

        if (virtual) {
            this._rootElement = document.createElement('div');
            this._rootElement.style.position = 'absolute';
        } else {
            this._rootElement = this._container.element;
        }

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
        this._rootElement.appendChild(this._inputElement);

        this._container.stateRequestEvent = () => this.handleContainerStateRequestEvent();

        this._rootElement.addEventListener('click', this._containerClickListener);
        this._rootElement.addEventListener('focusin', this._containerFocusinListener);
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

    private handleClickFocusEvent(): void {
        this._container.focus();
    }
}

export namespace TextComponent {
    type TextPropertyName = 'text';
    export type State = { [propertyName in TextPropertyName]: string }
}
