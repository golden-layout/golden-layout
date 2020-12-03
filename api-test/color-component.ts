import { ComponentContainer, JsonValue } from '../dist/golden-layout';

export class ColorComponent {
    static readonly typeName = 'color';
    static readonly undefinedColor = 'MediumVioletRed';

    private _paraElement: HTMLParagraphElement;
    private _inputElement: HTMLInputElement;

    private _beforeComponentReleaseEventListener = () => this.handleBeforeComponentReleaseEvent()
    private _inputChangeListener = () => this.handleInputChangeEvent();
    private _shownEventListener = () => this.handleShownEvent();

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
        const title = container.title;
        this._paraElement.innerText = (title ?? "unknown") + " component";
        container.contentElement.appendChild(this._paraElement);

        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.value = color;
        this._inputElement.style.display = "block";

        this._inputElement.addEventListener('input', this._inputChangeListener);
        container.contentElement.appendChild(this._inputElement);

        container.stateRequestEvent = () => this.handleContainerStateRequestEvent();
        container.addEventListener('beforeComponentRelease', this._beforeComponentReleaseEventListener);
        container.addEventListener('shown', this._shownEventListener);
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

    private handleBeforeComponentReleaseEvent(): void {
        this._inputElement.removeEventListener('change', this._inputChangeListener);
    }

    private handleShownEvent(): void {
        this._paraElement.style.backgroundColor = 'purple';
        setTimeout(() => { 
            this._paraElement.style.backgroundColor = ''
        }, 1000);
    }
}
