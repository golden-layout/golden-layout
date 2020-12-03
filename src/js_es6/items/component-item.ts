import { ComponentItemConfig, HeaderedItemConfig, ReactComponentConfig, SerialisableComponentConfig } from '../config/config';
import { ComponentContainer } from '../container/component-container';
import { Tab } from '../controls/tab';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { createTemplateHtmlElement, getElementWidthAndHeight } from '../utils/utils';
import { ContentItem } from './content-item';
import { GroundItem } from './ground-item';
import { Stack } from './stack';

/** @public */
export class ComponentItem extends ContentItem {
    /** @internal */
    private readonly _componentName: string;
    /** @internal */
    private _container: ComponentContainer;
    /** @internal */
    private _title: string;
    /** @internal */
    private _tab: Tab;
    /** @internal */
    private _component: ComponentItem.Component; // this is the user component wrapped by this ComponentItem instance

    get componentName(): string { return this._componentName; }
    get component(): ComponentItem.Component { return this._component; }
    get container(): ComponentContainer { return this._container; }

    get headerConfig(): HeaderedItemConfig.Header | undefined { return this._componentConfig.header; }
    get title(): string { return this._title; }
    get tab(): Tab { return this._tab; }

    /** @internal */
    constructor(layoutManager: LayoutManager,
        private readonly _componentConfig: ComponentItemConfig,
        stackOrGroundItem: Stack | GroundItem
    ) {
        super(layoutManager, _componentConfig, stackOrGroundItem, createTemplateHtmlElement(ComponentItem.templateHtml));

        this.isComponent = true;
        this._componentName = this._componentConfig.componentName;
        this._title = this._componentConfig.title;
        if (this._title === '') {
            this._title = this._componentName;
        }
        this._container = new ComponentContainer(this._componentConfig, this, layoutManager, this.element);
        this.layoutManager.getComponent(this._container);
    }

    /** @internal */
    destroy(): void {
        if (this._container.beforeComponentReleaseEvent !== undefined) {
            this._container.beforeComponentReleaseEvent();
        }
        this.layoutManager.releaseComponent(this._container, this._component);
        this._container.destroy()
        super.destroy();
    }

    /** @internal */
    toConfig(): ComponentItemConfig {
        const stateRequestEvent = this._container.stateRequestEvent;
        const state = stateRequestEvent === undefined ? this._container.getState() : stateRequestEvent();

        const currentConfig = this._componentConfig;
        let result: ComponentItemConfig;
        if (ComponentItemConfig.isSerialisable(currentConfig)) {
            const serialisableResult: SerialisableComponentConfig = {
                type: currentConfig.type,
                content: [],
                width: currentConfig.width,
                minWidth: currentConfig.minWidth,
                height: currentConfig.height,
                minHeight: currentConfig.minHeight,
                id: currentConfig.id,
                maximised: false,
                isClosable: currentConfig.isClosable,
                reorderEnabled: currentConfig.reorderEnabled,
                title: this._title,
                header: HeaderedItemConfig.Header.createCopy(currentConfig.header),
                componentName: currentConfig.componentName,
                componentState: state,
            }
            result = serialisableResult;
        } else {
            if (ComponentItemConfig.isReact(currentConfig)) {
                const reactResult: ReactComponentConfig = {
                    type: currentConfig.type,
                    content: [],
                    width: currentConfig.width,
                    minWidth: currentConfig.minWidth,
                    height: currentConfig.height,
                    minHeight: currentConfig.minHeight,
                    id: currentConfig.id,
                    maximised: false,
                    isClosable: currentConfig.isClosable,
                    reorderEnabled: currentConfig.reorderEnabled,
                    title: this._title,
                    header: HeaderedItemConfig.Header.createCopy(currentConfig.header),
                    componentName: currentConfig.componentName,
                    component: currentConfig.component,
                    props: state,
                }
                result = reactResult;
            } else {
                throw new AssertError('CITC75335');
            }
        }

        return result;
    }

    close(): void {
        if (this.parent === null) {
            throw new UnexpectedNullError('CIC68883');
        } else {
            this.parent.removeChild(this, false);
        }
    }

    // Used by Drag Proxy
    /** @internal */
    setDragSize(width: number, height: number): void {
        if (this.element.style.display !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            this._container.setDragSize(width, height);
        }
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

    /**
     * Set this component's title
     *
     * @public
     * @param title -
     */

    setTitle(title: string): void {
        this._title = title;
        this.emit('titleChanged', title);
        this.emit('stateChanged');
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

    /** @internal */
    export const templateHtml =
        '<div class="lm_item_container"> ' +
        '  <div class="lm_content"></div>' +
        '</div>';
}
