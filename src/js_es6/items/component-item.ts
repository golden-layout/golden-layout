import { ComponentItemConfig, HeaderedItemConfig } from '../config/config';
import { ComponentContainer } from '../container/component-container';
import { Tab } from '../controls/tab';
import { AssertError, UnexpectedUndefinedError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { ReactComponentHandler } from '../utils/react-component-handler';
import { JsonValue } from '../utils/types';
import { createTemplateHtmlElement, deepExtendValue, getElementWidthAndHeight } from '../utils/utils';
import { ContentItem } from './content-item';
import { Stack } from './stack';

/** @public */
export class ComponentItem extends ContentItem {
    /** @internal */
    private readonly _componentName: string;
    /** @internal */
    private _container: ComponentContainer;
    /** @internal */
    private _tab: Tab;
    /** @internal */
    private _component: ComponentItem.Component; // this is the user component wrapped by this ComponentItem instance

    get componentName(): string { return this._componentName; }
    get component(): ComponentItem.Component { return this._component; }
    get container(): ComponentContainer { return this._container; }
    get stack(): Stack { return this._stack; } 

    get headerConfig(): HeaderedItemConfig.Header | undefined { return this._componentConfig.header; }
    get tab(): Tab { return this._tab; }

    /** @internal */
    constructor(layoutManager: LayoutManager, private readonly _componentConfig: ComponentItemConfig, private _stack: Stack) {
        super(layoutManager, _componentConfig, _stack, createTemplateHtmlElement(ComponentItem.templateHtml));

        let componentInstantiator: ComponentItem.ComponentInstantiator;
        let componentState: JsonValue | undefined;
        if (ComponentItemConfig.isSerialisable(this._componentConfig)) {
            componentInstantiator = layoutManager.getComponentInstantiator(this._componentConfig);
            if (this._componentConfig.componentState === undefined) {
                componentState = undefined;
            } else {
                 // make copy
                componentState = deepExtendValue({}, this._componentConfig.componentState as Record<string, unknown>) as JsonValue;
            }
        } else {
            if (ComponentItemConfig.isReact(this._componentConfig)) {
                componentInstantiator = {
                    constructor: ReactComponentHandler,
                    factoryFunction: undefined,
                };
                componentState = this._componentConfig.props as JsonValue;
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

    /** @internal */
    destroy(): void {
        this._container.destroy()
        super.destroy();
    }

    /** @internal */
    setParent(parent: Stack): void {
        this._stack = parent;
        super.setParent(parent);
    }

    /** @internal */
    toConfig(): ComponentItemConfig {
        // cannot rely on ItemConfig.createCopy() to create StackItemConfig as header may have changed
        const result = super.toConfig() as ComponentItemConfig;
        const stateRequestEvent = this._container.stateRequestEvent;
        if (stateRequestEvent !== undefined) {
            const state = stateRequestEvent();
            if (ComponentItemConfig.isSerialisable(result)) {
                result.componentState = state;
            } else {
                if (ComponentItemConfig.isReact(result)) {
                    result.props = state; // is this correct? Needs review.
                } else {
                    throw new AssertError('CITC75335');
                }
            }
        }

        return result;
    }

    close(): void {
        this._stack.removeChild(this, false);
    }

    /** @internal */
    updateSize(): void {
        this.updateNodeSize();
        // ComponentItems do not have any ContentItems
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

    /** @internal */
    hide(): void {
        this._container.hide();
        super.hide();
    }

    /** @internal */
    show(): void {
        this._container.show();
        super.show();
    }

    /** @internal */
    private updateNodeSize(): void {
        if (this.element.style.display !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            const { width, height } = getElementWidthAndHeight(this.element);
            this._container.setSizeToNodeSize(width, height);
        }
    }
}

/** @public @deprecated use {@link (ComponentItem:class)} */
export type Component = ComponentItem;

/** @public */
export namespace ComponentItem {
    export type Component = unknown;
    export type ComponentConstructor = new(container: ComponentContainer, state: JsonValue | undefined) => Component;
    export type ComponentFactoryFunction = (container: ComponentContainer, state: JsonValue | undefined) => Component;
    /** @internal */
    export interface ComponentInstantiator {
        constructor: ComponentConstructor | undefined;
        factoryFunction: ComponentFactoryFunction | undefined;
    }

    /** @internal */
    export const templateHtml =
        '<div class="lm_item_container"> ' +
        '  <div class="lm_content"></div>' +
        '</div>';
}
