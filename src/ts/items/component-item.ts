import { ResolvedComponentItemConfig, ResolvedHeaderedItemConfig } from '../config/resolved-config';
import { ComponentContainer } from '../container/component-container';
import { Tab } from '../controls/tab';
import { UnexpectedNullError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { ItemType, JsonValue } from '../utils/types';
import { ComponentParentableItem } from './component-parentable-item';
import { ContentItem } from './content-item';
import { Stack } from './stack';
import { numberToPixels } from '../utils/utils';

/** @public */
export class ComponentItem extends ContentItem {
    /** @internal */
    private _reorderEnabled: boolean;
    /** @internal */
    private _headerConfig: ResolvedHeaderedItemConfig.Header | undefined;
    /** @internal */
    private _title: string;
    /** @internal */
    private readonly _initialWantMaximise: boolean;
    /** @internal */
    private _container: ComponentContainer;
    /** @internal */
    private _tab: Tab;
    /** @internal */
    private _titleRenderer: Tab.TitleRenderer | undefined;
    /** @internal */
    private _focused = false;

    /** @internal @deprecated use {@link (ComponentItem:class).componentType} */
    get componentName(): JsonValue { return this._container.componentType; }
    get componentType(): JsonValue { return this._container.componentType; }
    get reorderEnabled(): boolean { return this._reorderEnabled; }
    /** @internal */
    get initialWantMaximise(): boolean { return this._initialWantMaximise; }
    get container(): ComponentContainer { return this._container; }
    get parentItem(): ComponentParentableItem { return this._parentItem; }

    get headerConfig(): ResolvedHeaderedItemConfig.Header | undefined { return this._headerConfig; }
    get title(): string { return this._title; }
    get titleRenderer(): Tab.TitleRenderer | undefined { return this._titleRenderer; }
    get tab(): Tab { return this._tab; }
    get focused(): boolean { return this._focused; }

    /** @internal */
    constructor(
        layoutManager: LayoutManager,
        config: ResolvedComponentItemConfig,
        /** @internal */
        private _parentItem: ComponentParentableItem
    ) {
        super(layoutManager, config, _parentItem, ContentItem.createElement());
        this.isComponent = true;

        this._reorderEnabled = config.reorderEnabled;

        this.applyUpdatableConfig(config);

        this._initialWantMaximise = config.maximised;

        this._container = new ComponentContainer(config, this, layoutManager,
            (itemConfig) => this.handleUpdateItemConfigEvent(itemConfig),
            () => this.show(),
            () => this.hide(),
            (suppressEvent) => this.focus(suppressEvent),
            (suppressEvent) => this.blur(suppressEvent),
        );
    }

    /** @internal */
    override destroy(): void {
        const element = this.element;
        if (element)
            element.style.opacity = '0.1';
        const wasDragging = this.layoutManager.currentlyDragging();
        this.layoutManager.deferIfDragging((cancel) => {
            if (element)
                element.style.opacity = '';
            if (! cancel && ! wasDragging) {
                this._container.destroy();
                super.destroy();
            }
        });
    }

    applyUpdatableConfig(config: ResolvedComponentItemConfig): void {
        this.setTitle(config.title);
        this._headerConfig = config.header;
    }

    toConfig(): ResolvedComponentItemConfig {
        const stateRequestEvent = this._container.stateRequestEvent;
        const state = stateRequestEvent === undefined ? this._container.state : stateRequestEvent();

        const result: ResolvedComponentItemConfig = {
            type: ItemType.component,
            content: [],
            size: this.size,
            sizeUnit: this.sizeUnit,
            minSize: this.minSize,
            minSizeUnit: this.minSizeUnit,
            id: this.id,
            maximised: false,
            isClosable: this.isClosable,
            reorderEnabled: this._reorderEnabled,
            title: this._title,
            header: ResolvedHeaderedItemConfig.Header.createCopy(this._headerConfig),
            componentType: ResolvedComponentItemConfig.copyComponentType(this.componentType),
            componentState: state,
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
    enterDragMode(width: number, height: number): void {
        const style = this.element.style;
        style.height = `${height}px`;
        style.width = `${width}px`;
        this._container.enterDragMode(width, height);
    }

    /** @internal */
    exitDragMode(): void {
        const style = this.element.style;
        style.height = '';
        style.width = '';
        this._container.exitDragMode();
    }

    /** @internal */
    enterStackMaximised(): void {
        this._container.enterStackMaximised();
    }

    /** @internal */
    exitStackMaximised(): void {
        this._container.exitStackMaximised();
    }

    // Used by Drag Proxy
    /** @internal */
    drag(): void {
        this._container.drag();
    }

    /** @internal */
    override init(): void {
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

    setTitleRenderer(renderer: Tab.TitleRenderer | undefined): void {
        this._titleRenderer = renderer;
        this.emit('titleChanged', this._title);
        this.emit('stateChanged');
    }

    setTab(tab: Tab): void {
        this._tab = tab;
        this.emit('tab', tab)
        this._container.setTab(tab);
    }

    /** @internal */
    override hide(): void {
        this._container.setVisibility(false);
    }

    /** @internal */
    override show(): void {
        this._container.setVisibility(true);
    }

    /**
     * Focuses the item if it is not already focused
     */
    focus(suppressEvent = false): void {
        this.parentItem.setActiveComponentItem(this, true, suppressEvent);
    }

    /** @internal */
    setFocused(suppressEvent: boolean): void {
        this._focused = true;
        this.tab.setFocused();
        if (!suppressEvent) {
            this.emitBaseBubblingEvent('focus');
        }
    }

    /**
     * Blurs (defocuses) the item if it is focused
     */
    blur(suppressEvent = false): void {
        if (this._focused) {
            this.layoutManager.setFocusedComponentItem(undefined, suppressEvent);
        }
    }

    /** @internal */
    setBlurred(suppressEvent: boolean): void {
        this._focused = false;
        this.tab.setBlurred();
        if (!suppressEvent) {
            this.emitBaseBubblingEvent('blur');
        }
    }

    /** @internal */
    protected override setParent(parent: ContentItem): void {
        this._parentItem = parent as ComponentParentableItem;
        super.setParent(parent);
    }

    /** @internal */
    private handleUpdateItemConfigEvent(itemConfig: ResolvedComponentItemConfig) {
        this.applyUpdatableConfig(itemConfig);
    }

    /** @internal */
    updateNodeSize(): void {
        // OLD:  this._container.setSizeToNodeSize(width, height, force)
        const contentInset = this.layoutManager.layoutConfig.dimensions.contentInset;
        this.element.style.margin = contentInset ? `${contentInset}px` : '';

        const contentElement = this.container.contentElement;
        const componentElement = this.container.element;
        if (contentElement instanceof HTMLElement
            // && contentElement.style.display !== 'none'
            && this.parentItem instanceof Stack) {
            // Do not update size of hidden components to prevent unwanted reflows
            const stackElement = this.parentItem.element;
            let stackBounds;
            const itemElement = this.element;
            const itemBounds = itemElement.getBoundingClientRect();
            const layoutBounds = this.layoutManager.container.getBoundingClientRect();
            if (componentElement instanceof HTMLElement
                && contentElement !== componentElement) {
                stackBounds = stackElement.getBoundingClientRect();
                componentElement.style.top = numberToPixels(stackBounds.top - layoutBounds.top);
                componentElement.style.left = numberToPixels(stackBounds.left - layoutBounds.left);
                componentElement.style.width = numberToPixels(stackBounds.width);
                componentElement.style.height = numberToPixels(stackBounds.height);
            } else {
                stackBounds = layoutBounds;
            }
            contentElement.style.position = "absolute";
            contentElement.style.top = numberToPixels(itemBounds.top - stackBounds.top);
            contentElement.style.left = numberToPixels(itemBounds.left - stackBounds.left);
            contentElement.style.width = numberToPixels(itemBounds.width);
            contentElement.style.height = numberToPixels(itemBounds.height);
        }
        else console.log('updateNodeSize ignored');

        this.layoutManager.addVirtualSizedContainer(this.container);
    }
}

/** @public @deprecated use {@link (ComponentItem:class)} */
export type Component = ComponentItem;

/** @public */
export namespace ComponentItem {
    export type Component = ComponentContainer.Component;
}
