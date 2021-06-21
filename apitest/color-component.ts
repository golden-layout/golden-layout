import { ComponentContainer, GoldenLayout, JsonValue } from '..';

export class ColorComponent implements GoldenLayout.VirtuableComponent {
    static readonly typeName = 'color';
    static readonly undefinedColor = 'MediumVioletRed';

    private _rootElement: HTMLElement;
    private _paraElement: HTMLParagraphElement;
    private _inputElement: HTMLInputElement;

    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();
    private _beforeComponentReleaseEventListener = () => this.handleBeforeComponentReleaseEvent()
    private _inputChangeListener = () => this.handleInputChangeEvent();
    private _showEventListener = () => this.handleShowEvent();

    get rootHtmlElement(): HTMLElement { return this._rootElement; }

    constructor(private _container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) {
        if (virtual) {
            this._rootElement = document.createElement('div');
        } else {
            this._rootElement = this._container.element;
        }

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
        const title = this._container.title;
        this._paraElement.innerText = (title ?? "unknown") + " component";
        this._rootElement.appendChild(this._paraElement);

        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.value = color;
        this._inputElement.style.display = "block";

        this._inputElement.addEventListener('input', this._inputChangeListener, { passive: true });
        this._rootElement.appendChild(this._inputElement);

        this._container.stateRequestEvent = () => this.handleContainerStateRequestEvent();
        this._container.addEventListener('beforeComponentRelease', this._beforeComponentReleaseEventListener);
        this._container.addEventListener('show', this._showEventListener);

        this._rootElement.addEventListener('click', this._containerClickListener);
        this._rootElement.addEventListener('focusin', this._containerFocusinListener);
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
        this._rootElement.removeChild(this._inputElement);
        this._rootElement.removeChild(this._paraElement);
        this._container.removeEventListener('show', this._showEventListener);
        this._container.removeEventListener('beforeComponentRelease', this._beforeComponentReleaseEventListener);
        this._rootElement.removeEventListener('click', this._containerClickListener);
        this._rootElement.removeEventListener('focusin', this._containerFocusinListener);
    }

    private handleShowEvent(): void {
        this._paraElement.style.backgroundColor = 'purple';
        setTimeout(() => {
            this._paraElement.style.backgroundColor = ''
        }, 1000);
    }

    private handleClickFocusEvent(): void {
        this._container.focus();
    }
}
