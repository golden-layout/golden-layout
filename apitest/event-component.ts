import { ComponentContainer, EventEmitter, GoldenLayout, JsonValue } from '..';

export class EventComponent implements GoldenLayout.VirtuableComponent {
    static readonly typeName = 'event';

    private _rootElement: HTMLElement;
    private _inputElement: HTMLInputElement;
    private _sendElement: HTMLButtonElement;

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
        this._inputElement.type = "text";
        this._inputElement.style.display = "block";
        this._rootElement.appendChild(this._inputElement);

        this._sendElement = document.createElement('button');
        this._sendElement.innerText = "SEND EVENT";
        this._sendElement.addEventListener('click', () => {
            this._container.layoutManager.eventHub.emitUserBroadcast('foo', this._inputElement.value);
        });
        this._rootElement.appendChild(this._sendElement);

        const cb = (...ev: EventEmitter.UnknownParams) => {
            const evt = document.createElement('span');
            evt.innerText = `Received: ${ev}`
            this._rootElement.appendChild(evt);
        };

        this._container.layoutManager.eventHub.on('userBroadcast', cb);
        this._container.on('beforeComponentRelease', () => {
            this._container.layoutManager.eventHub.off('userBroadcast', cb);
        })

        this._rootElement.addEventListener('click', this._containerClickListener);
        this._rootElement.addEventListener('focusin', this._containerFocusinListener);
    }

    private handleClickFocusEvent(): void {
        this._container.focus();
    }
}
