import { ResolvedComponentItemConfig, ResolvedHeaderedItemConfig, ResolvedReactComponentConfig, ResolvedSerialisableComponentConfig } from '../config/resolved-config';
import { ComponentContainer } from '../container/component-container';
import { Tab } from '../controls/tab';
import { UnexpectedNullError } from '../errors/internal-error';
import { LayoutManager } from '../layout-manager';
import { DomConstants } from '../utils/dom-constants';
import { ItemType, JsonValue } from '../utils/types';
import { getElementWidthAndHeight, setElementHeight, setElementWidth } from '../utils/utils';
import { ComponentParentableItem } from './component-parentable-item';
import { ContentItem } from './content-item';

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
    /** @internal */
    private _focused = false;

    /** @internal @deprecated use {@link (ComponentItem:class).componentType} */
    get componentName(): JsonValue { return this._container.componentType; }
    get componentType(): JsonValue { return this._container.componentType; }
    get reorderEnabled(): boolean { return this._reorderEnabled; }
    /** @internal */
    get initialWantMaximise(): boolean { return this._initialWantMaximise; }
    get component(): ComponentItem.Component { return this._container.component; }
    get container(): ComponentContainer { return this._container; }
    get parentItem(): ComponentParentableItem { return this._parentItem; }

    get headerConfig(): ResolvedHeaderedItemConfig.Header | undefined { return this._headerConfig; }
    get title(): string { return this._title; }
    get tab(): Tab { return this._tab; }
    get focused(): boolean { return this._focused; }

    /** @internal */
    constructor(layoutManager: LayoutManager,
        config: ResolvedComponentItemConfig,
        private readonly _parentItem: ComponentParentableItem
    ) {
        super(layoutManager, config, _parentItem, document.createElement('div'));

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

        const containerElement = document.createElement('div');
        containerElement.classList.add('lm_content');
        this.element.appendChild(containerElement);
        this._container = new ComponentContainer(config, this, layoutManager, containerElement,
            (itemConfig) => this.handleUpdateItemConfigEvent(itemConfig),
            () => this.show(),
            () => this.hide(),
        );
    }

    /** @internal */
    destroy(): void {
        this._container.destroy()
        super.destroy();
    }

    applyUpdatableConfig(config: ResolvedComponentItemConfig): void {
        this.setTitle(config.title);
        this._headerConfig = config.header;
    }

    toConfig(): ResolvedComponentItemConfig {
        const stateRequestEvent = this._container.stateRequestEvent;
        const state = stateRequestEvent === undefined ? this._container.state : stateRequestEvent();

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
                componentType: ResolvedComponentItemConfig.copyComponentType(this.componentType),
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
                componentType: ResolvedComponentItemConfig.copyComponentType(this.componentType),
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
            setElementWidth(this.element, width);
            setElementHeight(this.element, height);
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
        this._container.checkEmitHide();
        super.hide();
    }

    /** @internal */
    show(): void {
        this._container.checkEmitShow();
        super.show();
    }

    /**
     * Focuses the item if it is not already focused
     */
    focus(suppressEvent = false): void {
        this.layoutManager.setFocusedComponentItem(this, suppressEvent); 
    }

    /** @internal */
    setBlurred(suppressEvent: boolean): void {
        this._focused = false;
        this.tab.element.classList.remove(DomConstants.ClassName.Focused);
        if (!suppressEvent) {
            this.emitBaseBubblingEvent('blur');
        }
    }

    /**
     * Blurs (defocuses) the item if it is focused
     */
    blur(suppressEvent = false): void {
        this.layoutManager.setFocusedComponentItem(undefined, suppressEvent); 
    }

    /** @internal */
    setFocused(suppressEvent: boolean): void {
        this._focused = true;
        this.tab.element.classList.add(DomConstants.ClassName.Focused);
        if (!suppressEvent) {
            this.emitBaseBubblingEvent('focus');
        }
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
}
