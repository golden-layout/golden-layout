import { ComponentContainer, EventEmitter } from '..';

export class EventComponent {
    static readonly typeName = 'event';

    private _inputElement: HTMLInputElement;
    private _sendElement: HTMLButtonElement;

    private _containerClickListener = () => this.handleClickFocusEvent();
    private _containerFocusinListener = () => this.handleClickFocusEvent();

    constructor(private _container: ComponentContainer) {
        this._inputElement = document.createElement('input');
        this._inputElement.type = "text";
        this._inputElement.style.display = "block";
        this._container.element.appendChild(this._inputElement);

        this._sendElement = document.createElement('button');
        this._sendElement.innerText = "SEND EVENT";
        this._sendElement.addEventListener('click', () => {
            this._container.layoutManager.eventHub.emitUserBroadcast('foo', this._inputElement.value);
        });
        this._container.element.appendChild(this._sendElement);

        const cb = (...ev: EventEmitter.UnknownParams) => {
            const evt = document.createElement('span');
            evt.innerText = `Received: ${ev}`
            this._container.element.appendChild(evt);
        };

        this._container.layoutManager.eventHub.on('userBroadcast', cb);
        this._container.on('beforeComponentRelease', () => {
            this._container.layoutManager.eventHub.off('userBroadcast', cb);
        })

        this._container.element.addEventListener('click', this._containerClickListener);
        this._container.element.addEventListener('focusin', this._containerFocusinListener);

    }

    private handleClickFocusEvent(): void {
        this._container.focus();
    }
}
