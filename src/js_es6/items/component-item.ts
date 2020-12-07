import { ResolvedReactComponentConfig, ResolvedComponentItemConfig, ResolvedHeaderedItemConfig, ResolvedSerialisableComponentConfig } from '../config/resolved-config';
import { ComponentContainer } from '../container/component-container';
import { Tab } from '../controls/tab';
import { UnexpectedNullError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { ItemType } from '../utils/types';
import { createTemplateHtmlElement, getElementWidthAndHeight } from '../utils/utils';
import { ContentItem } from './content-item';
import { GroundItem } from './ground-item';
import { Stack } from './stack';

/** @public */
export class ComponentItem extends ContentItem {
    /** @internal */
    private readonly _isReact: boolean;
    /** @internal */
    private _reorderEnabled: boolean;
    /** @internal */
    private _headerConfig: ResolvedHeaderedItemConfig.Header | undefined;
    /** @internal */
    private _reactComponent: string;
    /** @internal */
    private _title: string;
    /** @internal */
    private readonly _initialWantMaximise: boolean;
    /** @internal */
    private _container: ComponentContainer;
    /** @internal */
    private _tab: Tab;

    get componentName(): string { return this._container.componentName; }
    get reorderEnabled(): boolean { return this._reorderEnabled; }
    /** @internal */
    get initialWantMaximise(): boolean { return this._initialWantMaximise; }
    get component(): ComponentItem.Component { return this._container.component; }
    get container(): ComponentContainer { return this._container; }

    get headerConfig(): ResolvedHeaderedItemConfig.Header | undefined { return this._headerConfig; }
    get title(): string { return this._title; }
    get tab(): Tab { return this._tab; }

    /** @internal */
    constructor(layoutManager: LayoutManager,
        config: ResolvedComponentItemConfig,
        stackOrGroundItem: Stack | GroundItem
    ) {
        super(layoutManager, config, stackOrGroundItem, createTemplateHtmlElement(ComponentItem.templateHtml));

        this.isComponent = true;

        if (ResolvedComponentItemConfig.isReact(config)) {
            this._isReact = true;
            this._reactComponent = config.component;
        } else {
            this._isReact = false;
        }

        this._reorderEnabled = config.reorderEnabled;

        this.applyUpdatableConfig(config);

        this._initialWantMaximise = config.maximised;
        this._container = new ComponentContainer(config, this, layoutManager, this.element,
            (itemConfig) => this.handleUpdateItemConfigEvent(itemConfig)
        );
    }

    /** @internal */
    destroy(): void {
        this._container.destroy()
        super.destroy();
    }

    applyUpdatableConfig(config: ResolvedComponentItemConfig): void {
        this._title = config.title;
        if (this._title === '') {
            this._title = this.componentName;
        }
        this._headerConfig = config.header;
    }

    toConfig(): ResolvedComponentItemConfig {
        const stateRequestEvent = this._container.stateRequestEvent;
        const state = stateRequestEvent === undefined ? this._container.getState() : stateRequestEvent();

        let result: ResolvedComponentItemConfig;
        if (this._isReact) {
            const reactResult: ResolvedReactComponentConfig = {
                type: ItemType.reactComponent,
                content: [],
                width: this.width,
                minWidth: this.minWidth,
                height: this.height,
                minHeight: this.minHeight,
                id: this.id,
                maximised: false,
                isClosable: this.isClosable,
                reorderEnabled: this._reorderEnabled,
                title: this._title,
                header: ResolvedHeaderedItemConfig.Header.createCopy(this._headerConfig),
                componentName: this.componentName,
                component: this._reactComponent,
                props: state,
            }
            result = reactResult;
        } else {
            const serialisableResult: ResolvedSerialisableComponentConfig = {
                type: ItemType.serialisableComponent,
                content: [],
                width: this.width,
                minWidth: this.minWidth,
                height: this.height,
                minHeight: this.minHeight,
                id: this.id,
                maximised: false,
                isClosable: this.isClosable,
                reorderEnabled: this._reorderEnabled,
                title: this._title,
                header: ResolvedHeaderedItemConfig.Header.createCopy(this._headerConfig),
                componentName: this.componentName,
                componentState: state,
            }
            result = serialisableResult;
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
    private handleUpdateItemConfigEvent(itemConfig: ResolvedComponentItemConfig) {
        // Called if component is replaced. Update properties accordingly
        if (ResolvedComponentItemConfig.isReact(itemConfig)) {
            this._reactComponent = itemConfig.component;
        }

        this.applyUpdatableConfig(itemConfig);
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
