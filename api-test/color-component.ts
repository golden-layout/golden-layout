import { ComponentContainer, JsonValue } from '../dist/golden-layout';

export class ColorComponent {
    static readonly typeName = 'color';
    static readonly undefinedColor = 'MediumVioletRed';

    private _paraElement: HTMLParagraphElement;
    private _inputElement: HTMLInputElement;

    constructor(container: ComponentContainer, state: JsonValue | undefined) {
        let color: string;
        if (state === undefined) {
            color = ColorComponent.undefinedColor;
        } else {
            if (typeof state !== 'string') {
                color = 'IndianRed';
            } else {
                color = state;
            }
        }

        this._paraElement = document.createElement("p");
        this._paraElement.style.textAlign = "left";
        this._paraElement.style.color = color;
        const title = container.config.title;
        this._paraElement.innerText = (title ?? "unknown") + " component";
        container.contentElement.appendChild(this._paraElement);

        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.value = color;
        this._inputElement.style.display = "block";

        this._inputElement.addEventListener('input', () => this.handleInputChangeEvent());
        container.contentElement.appendChild(this._inputElement);

        container.stateRequestEvent = () => this.handleContainerStateRequestEvent();
        container.beforeDestroyEvent = () => this.handleContainerBeforeDestroyEvent();
    }

    private handleInputChangeEvent() {
        this._paraElement.style.color = this._inputElement.value;
    }

    private handleContainerStateRequestEvent(): string | undefined {
        const color = this._inputElement.value;
        if (color === ColorComponent.undefinedColor) {
            return undefined;
        } else {
            return color;
        }
    }

    private handleContainerBeforeDestroyEvent(): void {
        this._inputElement.removeEventListener('change', () => this.handleInputChangeEvent());
    }
}
