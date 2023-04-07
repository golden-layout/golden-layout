import { ComponentContainer, GoldenLayout } from '..';

export abstract class ComponentBase implements GoldenLayout.VirtuableComponent {
    private _rootElement: HTMLElement;

    get container(): ComponentContainer { return this._container; }
    get rootHtmlElement(): HTMLElement { return this._rootElement; }

    constructor(private _container: ComponentContainer, virtual: boolean) {
        if (virtual) {
            this._rootElement = document.createElement('div');
            this._rootElement.style.position = 'absolute';
            this._rootElement.style.overflow = 'hidden';
        } else {
            this._rootElement = this._container.element as HTMLElement;
        }
    }
}
