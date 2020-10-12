import { ComponentConfig, HeaderedItemConfig } from '../config/config';
import { ComponentContainer } from '../container/ComponentContainer';
import { Tab } from '../controls/Tab';
import { UnexpectedUndefinedError } from '../errors/internal-error';
import { LayoutManager } from '../LayoutManager';
import { ReactComponentHandler } from '../utils/ReactComponentHandler';
import { createTemplateHtmlElement, deepExtend, getElementHeight, getElementWidth } from '../utils/utils';
import { AbstractContentItem } from './AbstractContentItem';
import { Stack } from './Stack';

export class ComponentItem extends AbstractContentItem {
    private readonly _componentName: string;
    private _container: ComponentContainer;
    private _tab: Tab;
    private _component: ComponentItem.Component; // this is the user component wrapped by this ComponentItem instance

    get componentName(): string { return this._componentName; }
    get component(): ComponentItem.Component { return this._component; }
    get container(): ComponentContainer { return this._container; }
    get stack(): Stack { return this._stack; } 

    get headerConfig(): HeaderedItemConfig.Header | undefined { return this._componentConfig.header; }
    get tab(): Tab { return this._tab; }

    constructor(layoutManager: LayoutManager, private readonly _componentConfig: ComponentConfig, private _stack: Stack) {
        super(layoutManager, _componentConfig, _stack, createTemplateHtmlElement(ComponentItem.templateHtml));

        let componentInstantiator: ComponentItem.ComponentInstantiator;
        let componentState: unknown;
        if (ComponentConfig.isSerialisable(this._componentConfig)) {
            componentInstantiator = layoutManager.getComponentInstantiator(this._componentConfig);
            if (this._componentConfig.componentState === undefined) {
                componentState = {};
            } else {
                componentState = deepExtend({}, this._componentConfig.componentState as Record<string, unknown>); // make copy
            }
        } else {
            if (ComponentConfig.isReact(this._componentConfig)) {
                componentInstantiator = {
                    constructor: ReactComponentHandler,
                    factoryFunction: undefined,
                };
                componentState = this._componentConfig.props;
            } else {
                throw new Error(`Component.constructor: unsupported Config type: ${this._componentConfig.type}`);
            }
        }

        if (typeof componentState === 'object' && componentState !== null) {
            (componentState as Record<string, unknown>).componentName = this._componentConfig.componentName;
        }

        this._componentName = this._componentConfig.componentName;

        if (this.config.title === '') {
            this.config.title = this._componentConfig.componentName;
        }

        this.isComponent = true;
        this._container = new ComponentContainer(this._componentConfig, this, layoutManager, this.element);
        const componentConstructor = componentInstantiator.constructor;
        if (componentConstructor !== undefined) {
            this._component = new componentConstructor(this._container, componentState);
        } else {
            const factoryFunction = componentInstantiator.factoryFunction;
            if (factoryFunction !== undefined) {
                this._component = factoryFunction(this._container, componentState);
            } else {
                throw new UnexpectedUndefinedError('CIC10008');
            }
        }
    }

    close(): void {
        this._stack.removeChild(this, false);
    }

    updateSize(): void {
        this.updateNodeSize();
        // ComponentItems do not have any ContentItems
    }

    private updateNodeSize(): void {
        if (this.element.style.display !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            this._container._$setSize(getElementWidth(this.element), getElementHeight(this.element));
        }
    }

    /** @internal */
    init(): void {
        this.updateNodeSize();

        super.init();
        this._container.emit('open');
        this.initContentItems();
    }

    setTab(tab: Tab): void {
        this._tab = tab;
        this.emit('tab', tab)
        this._container.setTab(tab);
    }

    _$hide(): void {
        this._container.hide();
        super._$hide();
    }

    _$show(): void {
        this._container.show();
        super._$show();
    }

    _$destroy(): void {
        this._container.emit('destroy');
        super._$destroy();
    }

    /**
     * Dragging onto a component directly is not an option
     *
     * @returns null
     */
    getArea(): AbstractContentItem.Area | null {
        return null;
    }

    setParent(parent: Stack): void {
        this._stack = parent;
        super.setParent(parent);
    }
}

export namespace ComponentItem {
    export type Component = unknown;
    export type ComponentConstructor = new(container: ComponentContainer, state: unknown) => Component;
    export type ComponentFactoryFunction = (container: ComponentContainer, state: unknown) => Component;
    export interface ComponentInstantiator {
        constructor: ComponentConstructor | undefined;
        factoryFunction: ComponentFactoryFunction | undefined;
    }

    export const templateHtml =
        '<div class="lm_item_container"> ' +
        '  <div class="lm_content"></div>' +
        '</div>';
}
