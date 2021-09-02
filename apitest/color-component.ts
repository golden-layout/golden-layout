import { ComponentContainer, JsonValue } from '..';
import { ComponentBase } from './component-base';

export class ColorComponent extends ComponentBase {
    static readonly typeName = 'color';
    static readonly undefinedColor = 'MediumVioletRed';

    private _paraElement: HTMLParagraphElement;
    private _inputElement: HTMLInputElement;

    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();
    private _beforeComponentReleaseEventListener = () => this.handleBeforeComponentReleaseEvent()
    private _inputChangeListener = () => this.handleInputChangeEvent();
    private _showEventListener = () => this.handleShowEvent();

    constructor(container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) {
        super(container, virtual);

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
        const title = this.container.title;
        this._paraElement.innerText = (title ?? "unknown") + " component";
        this.rootHtmlElement.appendChild(this._paraElement);

        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.value = color;
        this._inputElement.style.display = "block";

        this._inputElement.addEventListener('input', this._inputChangeListener, { passive: true });
        this.rootHtmlElement.appendChild(this._inputElement);

        this.container.stateRequestEvent = () => this.handleContainerStateRequestEvent();
        this.container.addEventListener('beforeComponentRelease', this._beforeComponentReleaseEventListener);
        this.container.addEventListener('show', this._showEventListener);

        this.rootHtmlElement.addEventListener('click', this._containerClickListener);
        this.rootHtmlElement.addEventListener('focusin', this._containerFocusinListener);
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
        this.rootHtmlElement.removeChild(this._inputElement);
        this.rootHtmlElement.removeChild(this._paraElement);
        this.container.removeEventListener('show', this._showEventListener);
        this.container.removeEventListener('beforeComponentRelease', this._beforeComponentReleaseEventListener);
        this.rootHtmlElement.removeEventListener('click', this._containerClickListener);
        this.rootHtmlElement.removeEventListener('focusin', this._containerFocusinListener);
    }

    private handleShowEvent(): void {
        this._paraElement.style.backgroundColor = 'purple';
        setTimeout(() => {
            this._paraElement.style.backgroundColor = ''
        }, 1000);
    }

    private handleClickFocusEvent(): void {
        this.container.focus();
    }
}
