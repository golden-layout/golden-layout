import { GoldenLayout } from '..';

export abstract class ComponentBase implements GoldenLayout.VirtuableComponent {
    abstract get rootHtmlElement(): HTMLElement;
}
