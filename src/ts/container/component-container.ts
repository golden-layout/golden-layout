import { ComponentItemConfig, ItemConfig } from '../config/config';
import { ResolvedComponentItemConfig } from '../config/resolved-config';
import { Tab } from '../controls/tab';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { ComponentItem } from '../items/component-item';
import { ContentItem } from '../items/content-item';
import { LayoutManager } from '../layout-manager';
import { DomConstants } from '../utils/dom-constants';
import { EventEmitter } from '../utils/event-emitter';
import { setElementDisplayVisibility } from '../utils/utils'
import { JsonValue, LogicalZIndex, LogicalZIndexToDefaultMap } from '../utils/types';
import { deepExtend, setElementHeight, setElementWidth } from '../utils/utils';

/** @public */
export class ComponentContainer extends EventEmitter {
    /** @internal */
    private _componentType: JsonValue;
    /** @internal */
    private _handle: ComponentContainer.Handle;
    /** @internal */
    private _width: number;
    /** @internal */
    private _height: number;
    /** @internal */
    private _isClosable;
    /** @internal */
    private _initialState: JsonValue | undefined;
    /** @internal */
    private _state: JsonValue | undefined;
    /** @internal */
    private _visible;
    /** @internal */
    private _isShownWithZeroDimensions;
    /** @internal */
    private _tab: Tab;
    /** @internal */
    private _stackMaximised = false;
    /** @internal */
    private _logicalZIndex: LogicalZIndex;
    /** @internal */
    private _element: HTMLElement | undefined;

    stateRequestEvent: ComponentContainer.StateRequestEventHandler | undefined;
    virtualRectingRequiredEvent: ComponentContainer.VirtualRectingRequiredEvent | undefined; // DEPRECATED
    notifyResize: ComponentContainer.NotifyResizeHandler | undefined;
    virtualVisibilityChangeRequiredEvent: ComponentContainer.VirtualVisibilityChangeRequiredEvent | undefined;
    virtualZIndexChangeRequiredEvent: ComponentContainer.VirtualZIndexChangeRequiredEvent | undefined;

    get width(): number { return this._width; }
    get height(): number { return this._height; }
    get parent(): ComponentItem { return this._parent; }
    /** @internal @deprecated use {@link (ComponentContainer:class).componentType} */
    get componentName(): JsonValue { return this._componentType; }
    get componentType(): JsonValue { return this._componentType; }
    get handle(): ComponentContainer.Handle { return this._handle; }
    get virtual(): boolean { return this._element === undefined; }
    get tab(): Tab { return this._tab; }
    get title(): string { return this._parent.title; }
    get layoutManager(): LayoutManager { return this._layoutManager; }
    get isHidden(): boolean { return !this._visible; }
    get visible(): boolean { return this._visible; }
    get state(): JsonValue | undefined { return this._state; }
    /** Return the initial component state */
    get initialState(): JsonValue | undefined { return this._initialState; }
    /** The inner DOM element where the container's content is intended to live in */
    get element(): HTMLElement | undefined { return this._element; }
    readonly contentElement: HTMLElement | undefined;

    /** @internal */
    constructor(
        /** @internal */
        private readonly _config: ResolvedComponentItemConfig,
        /** @internal */
        private readonly _parent: ComponentItem,
        /** @internal */
        private readonly _layoutManager: LayoutManager,
        /** @internal */
        private readonly _updateItemConfigEvent: ComponentContainer.UpdateItemConfigEventHandler,
        /** @internal */
        private readonly _showEvent: ComponentContainer.ShowEventHandler,
        /** @internal */
        private readonly _hideEvent: ComponentContainer.HideEventHandler,
        /** @internal */
        private readonly _focusEvent: ComponentContainer.FocusEventHandler,
        /** @internal */
        private readonly _blurEvent: ComponentContainer.BlurEventHandler,
    ) {
        super();

        this._element = _layoutManager.createComponentElement(_config, this);
        if (this._element) {
            this._element.classList.add(DomConstants.ClassName.Component);
            const content = this._element.querySelector(".lm_content");
            this.contentElement = content instanceof HTMLElement ? content
                : this._element;
        }
        this._width = 0;
        this._height = 0;
        this._visible = true;
        this._isShownWithZeroDimensions = true;

        this._componentType = _config.componentType;
        this._isClosable = _config.isClosable;
        this._initialState = _config.componentState;
        this._state = this._initialState;

        this._handle = this.layoutManager.bindComponent(this, _config);

        //FIXME:this.updateElementPositionPropertyFromBoundComponent();
    }

    /** @internal */
    destroy(): void {
        this.releaseComponent();
        this.stateRequestEvent = undefined;
        this.emit('destroy');
    }

    /** @deprecated use {@link (ComponentContainer:class).element } */
    getElement(): HTMLElement | undefined {
        return this._element;
    }

    /**
     * Hides the container's component item (and hence, the container) if not already hidden.
     * Emits hide event prior to hiding the container.
     */
    hide(): void {
        this._hideEvent();
    }

    /**
     * Shows the container's component item (and hence, the container) if not visible.
     * Emits show event prior to hiding the container.
     */
    show(): void {
        this._showEvent();
    }

    /**
     * Focus this component in Layout.
     */
    focus(suppressEvent = false): void {
        this._focusEvent(suppressEvent);
    }

    /**
     * Remove focus from this component in Layout.
     */
    blur(suppressEvent = false): void {
        this._blurEvent(suppressEvent);
    }

    /**
     * Set the size from within the container. Traverses up
     * the item tree until it finds a row or column element
     * and resizes its items accordingly.
     *
     * If this container isn't a descendant of a row or column
     * it returns false
     * @param width - The new width in pixel
     * @param height - The new height in pixel
     *
     * @returns resizeSuccesful
     *
     * @internal
     */
    setSize(width: number, height: number): boolean {
        let ancestorItem: ContentItem | null = this._parent;
        if (ancestorItem.isColumn || ancestorItem.isRow || ancestorItem.parent === null) {
            throw new AssertError('ICSSPRC', 'ComponentContainer cannot have RowColumn Parent');
        } else {
            let ancestorChildItem: ContentItem;
            do {
                ancestorChildItem = ancestorItem;
                ancestorItem = ancestorItem.parent;
            } while (ancestorItem !== null && !ancestorItem.isColumn && !ancestorItem.isRow);

            if (ancestorItem === null) {
                // no Row or Column found
                return false;
            } else {
                // ancestorItem is Row or Column
                const direction = ancestorItem.isColumn ? 'height' : 'width';
                const currentSize = this[direction];
                if (currentSize === null) {
                    throw new UnexpectedNullError('ICSSCS11194');
                } else {
                    const newSize = direction === 'height' ? height : width;

                    const totalPixel = currentSize * (1 / (ancestorChildItem.size / 100));
                    const percentage = (newSize / totalPixel) * 100;
                    const delta = (ancestorChildItem.size - percentage) / (ancestorItem.contentItems.length - 1);

                    for (let i = 0; i < ancestorItem.contentItems.length; i++) {
                        const ancestorItemContentItem = ancestorItem.contentItems[i];
                        if (ancestorItemContentItem === ancestorChildItem) {
                            ancestorItemContentItem.size = percentage;
                        } else {
                            ancestorItemContentItem.size += delta;
                        }
                    }

                    ancestorItem.updateSize();

                    return true;
                }
            }
        }
    }

    /**
     * Closes the container if it is closable. Can be called by
     * both the component within at as well as the contentItem containing
     * it. Emits a close event before the container itself is closed.
     */
    close(): void {
        if (this._isClosable) {
            this.emit('close');
            this._parent.close();
        }
    }

    /** Replaces component without affecting layout */
    replaceComponent(itemConfig: ComponentItemConfig): void {
        this.releaseComponent();

        if (!ItemConfig.isComponent(itemConfig)) {
            throw new Error('ReplaceComponent not passed a component ItemConfig')
        } else {
            const config = ComponentItemConfig.resolve(itemConfig, false);
            this._initialState = config.componentState;
            this._state = this._initialState;
            this._componentType = config.componentType;

            this._updateItemConfigEvent(config);

            this._handle = this.layoutManager.bindComponent(this, config);
            this.updateElementPositionPropertyFromBoundComponent();

            if (this.virtualVisibilityChangeRequiredEvent !== undefined) {
                this.virtualVisibilityChangeRequiredEvent(this, this._visible);
            }
            if (this.virtualRectingRequiredEvent !== undefined) {
                this._layoutManager.beforeVirtualRectingEvent?.(1);
                try {
                    this.virtualRectingRequiredEvent(this, this._width, this._height);
                } finally {
                    this._layoutManager.afterVirtualRectingEvent?.();
                }
            }
            this.setBaseLogicalZIndex();

            this.emit('stateChanged');
        }
    }

    /**
     * Returns the initial component state or the latest passed in setState()
     * @returns state
     * @deprecated Use {@link (ComponentContainer:class).initialState}
     */
    getState(): JsonValue | undefined {
        return this._state;
    }

    /**
     * Merges the provided state into the current one
     * @deprecated Use {@link (ComponentContainer:class).stateRequestEvent}
     */
    extendState(state: Record<string, unknown>): void {
        const extendedState = deepExtend(this._state as Record<string, unknown>, state);
        this.setState(extendedState as JsonValue);
    }

    /**
     * Sets the component state
     * @deprecated Use {@link (ComponentContainer:class).stateRequestEvent}
     */
    setState(state: JsonValue): void {
        this._state = state;
        this._parent.emitBaseBubblingEvent('stateChanged');
    }

    /**
     * Set's the components title
     */
    setTitle(title: string): void {
        this._parent.setTitle(title);
    }

    setTitleRenderer(renderer: Tab.TitleRenderer | undefined): void {
        this._parent.setTitleRenderer(renderer);
    }

    /** @internal */
    setTab(tab: Tab): void {
        this._tab = tab;
        this.emit('tab', tab)
    }

    /** @internal */
    setVisibility(value: boolean): void {
        if (this.virtualVisibilityChangeRequiredEvent !== undefined) {
            this.virtualVisibilityChangeRequiredEvent(this, value);
        }
        if (this._element)
            setElementDisplayVisibility(this._element, value);
        if (value) {
            if (!this._visible) {
                this._visible = true;
                if (this._height === 0 && this._width === 0) {
                    this._isShownWithZeroDimensions = true;
                } else {
                    this._isShownWithZeroDimensions = false;
                    this.parent.updateNodeSize();
                    this.emitShow();
                }
            } else {
                if (this._isShownWithZeroDimensions && (this._height !== 0 || this._width !== 0)) {
                    this._isShownWithZeroDimensions = false;
                    this.parent.updateNodeSize();
                    this.emitShow();
                }
            }
        } else {
            if (this._visible) {
                this._visible = false;
                this._isShownWithZeroDimensions = false;
                this.emitHide();
            }
        }
    }

    setBaseLogicalZIndex(): void {
        this.setLogicalZIndex(LogicalZIndex.base);
    }

    setLogicalZIndex(logicalZIndex: LogicalZIndex): void {
        if (logicalZIndex !== this._logicalZIndex) {
            this._logicalZIndex = logicalZIndex;

            this.notifyVirtualZIndexChangeRequired();
        }
    }

    /**
     * Set the container's size, but considered temporary (for dragging)
     * so don't emit any events.
     * @internal
     */
    enterDragMode(width: number, height: number): void {
        this._width = width;
        this._height = height;
        if (this._element) {
            setElementWidth(this._element, width);
            setElementHeight(this._element, height);
        }

        this.setLogicalZIndex(LogicalZIndex.drag);

        this.drag();
    }

    /** @internal */
    exitDragMode(): void {
        this.setBaseLogicalZIndex();
    }

    /** @internal */
    enterStackMaximised(): void {
        this._stackMaximised = true;
        this.setLogicalZIndex(LogicalZIndex.stackMaximised);
    }

    /** @internal */
    exitStackMaximised(): void {
        this.setBaseLogicalZIndex();
        this._stackMaximised = false;
    }

    /** @internal */
    drag(): void {
        if (this.virtualRectingRequiredEvent !== undefined) {
            this._layoutManager.beforeVirtualRectingEvent?.(1);
            try {
                this.virtualRectingRequiredEvent(this, this._width, this._height);
            } finally {
                this._layoutManager.afterVirtualRectingEvent?.();
            }
        }
    }

    /** @internal */
    notifyVirtualRectingRequired(): void {
        if (this.virtualRectingRequiredEvent !== undefined
            || this.notifyResize) {
            if (this.virtualRectingRequiredEvent)
                this.virtualRectingRequiredEvent(this, this._width, this._height);
            const element = this.parent.element;
            //let left = 0, top = 0, width = 0, height = 0;
            if (this.notifyResize && element) {
                const bounds = element.getBoundingClientRect();
                this.notifyResize(this, bounds.left, bounds.top, bounds.width, bounds.height);
            }
            this.emit('resize');
            this.checkShownFromZeroDimensions();
        }
    }

    /** @internal */
    private notifyVirtualZIndexChangeRequired(): void {
        if (this.virtualZIndexChangeRequiredEvent !== undefined) {
            const logicalZIndex = this._logicalZIndex;
            const defaultZIndex = LogicalZIndexToDefaultMap[logicalZIndex];
            this.virtualZIndexChangeRequiredEvent(this, logicalZIndex, defaultZIndex);
        }
    }

    /** @internal */
    private updateElementPositionPropertyFromBoundComponent() {
        if (this._element) {
            if (this.virtual) {
                this._element.style.position = 'static';
            } else {
                this._element.style.position = ''; // set it back to attribute value
            }
        }
    }

    /** @internal */
    private checkShownFromZeroDimensions() {
        if (this._isShownWithZeroDimensions && (this._height !== 0 || this._width !== 0)) {
            this._isShownWithZeroDimensions = false;
            this.emitShow();
        }
    }

    /** @internal */
    private emitShow(): void {
        this.emit('shown');
        this.emit('show');
    }

    /** @internal */
    private emitHide(): void {
        this.emit('hide');
    }

    /** @internal */
    private releaseComponent() {
        if (this._stackMaximised) {
            this.exitStackMaximised();
        }
        this.emit('beforeComponentRelease', this._handle);
        this.layoutManager.unbindComponent(this, this._handle);
    }
}

/** @public @deprecated use {@link ComponentContainer} */
export type ItemContainer = ComponentContainer;

/** @public */
export namespace ComponentContainer {
    export type Handle = unknown;
    /* @deprecated - future may be reused as synonym for ComponentContainer*/
    export type Component = unknown;

    export type StateRequestEventHandler = (this: void) => JsonValue | undefined;
    export type VirtualRectingRequiredEvent = (this: void, container: ComponentContainer, width: number, height: number) => void; // DEPRECATED
    export type NotifyResizeHandler = (this: void, container: ComponentContainer, left: number, top: number, width: number, height: number) => void;
    export type VirtualVisibilityChangeRequiredEvent = (this: void, container: ComponentContainer, visible: boolean) => void;
    export type VirtualZIndexChangeRequiredEvent =
        (this: void, container: ComponentContainer, logicalZIndex: LogicalZIndex, defaultZIndex: string) => void;
    /** @internal */
    export type ShowEventHandler = (this: void) => void;
    /** @internal */
    export type HideEventHandler = (this: void) => void;
    /** @internal */
    export type FocusEventHandler = (this: void, suppressEvent: boolean) => void;
    /** @internal */
    export type BlurEventHandler = (this: void, suppressEvent: boolean) => void;
    /** @internal */
    export type UpdateItemConfigEventHandler = (itemConfig: ResolvedComponentItemConfig) => void;
}
