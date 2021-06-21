import { ComponentContainer, GoldenLayout, JsonValue } from '..';

export class BooleanComponent implements GoldenLayout.VirtuableComponent {
    static readonly typeName = 'boolean';

    private _rootElement: HTMLElement;
    private _inputElement: HTMLInputElement;

    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();

    get rootHtmlElement(): HTMLElement { return this._rootElement; }

    constructor(private _container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) {
        if (virtual) {
            this._rootElement = document.createElement('div');
        } else {
            this._rootElement = this._container.element;
        }

        this._inputElement = document.createElement('input');
        this._inputElement.type = "checkbox";
        this._inputElement.checked = (state as boolean) ?? true;
        this._inputElement.style.display = "block";

        this._rootElement.appendChild(this._inputElement);

        this._container.stateRequestEvent = () => this.handleContainerStateRequestEvent();

        this._rootElement.addEventListener('click', this._containerClickListener);
        this._rootElement.addEventListener('focusin', this._containerFocusinListener);
    }

    handleContainerStateRequestEvent(): boolean {
        return this._inputElement.checked;
    }

    private handleClickFocusEvent(): void {
        this._container.focus();
    }
}
