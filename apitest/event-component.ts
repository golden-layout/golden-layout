import { ComponentContainer, EventEmitter, JsonValue } from '..';
import { ComponentBase } from './component-base';

export class EventComponent extends ComponentBase {
    static readonly typeName = 'event';

    private _inputElement: HTMLInputElement;
    private _sendElement: HTMLButtonElement;

    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();

    constructor(container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) {
        super(container, virtual);

        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.style.display = "block";
        this.rootHtmlElement.appendChild(this._inputElement);

        this._sendElement = document.createElement('button');
        this._sendElement.innerText = "SEND EVENT";
        this._sendElement.addEventListener('click', () => {
            this.container.layoutManager.eventHub.emitUserBroadcast('foo', this._inputElement.value);
        });
        this.rootHtmlElement.appendChild(this._sendElement);

        const cb = (...ev: EventEmitter.UnknownParams) => {
            const evt = document.createElement('span');
            evt.innerText = `Received: ${ev}`
            this.rootHtmlElement.appendChild(evt);
        };

        this.container.layoutManager.eventHub.on('userBroadcast', cb);
        this.container.on('beforeComponentRelease', () => {
            this.container.layoutManager.eventHub.off('userBroadcast', cb);
        })

        this.rootHtmlElement.addEventListener('click', this._containerClickListener);
        this.rootHtmlElement.addEventListener('focusin', this._containerFocusinListener);
    }

    private handleClickFocusEvent(): void {
        this.container.focus();
    }
}
