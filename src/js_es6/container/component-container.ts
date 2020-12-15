import { ItemConfig, ComponentItemConfig, ReactComponentConfig, SerialisableComponentConfig } from '../config/config';
import { ResolvedComponentItemConfig } from '../config/resolved-config';
import { Tab } from '../controls/tab';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { ComponentItem } from '../items/component-item';
import { ContentItem } from '../items/content-item';
import { LayoutManager } from '../layout-manager';
import { EventEmitter } from '../utils/event-emitter';
import { JsonValue } from '../utils/types';
import { deepExtend, setElementHeight, setElementWidth } from '../utils/utils';

/** @public */
export class ComponentContainer extends EventEmitter {
    /** @internal */
    private readonly _isReact: boolean;
    /** @internal */
    private _componentType: JsonValue;
    /** @internal */
    private _component: ComponentItem.Component;
    /** @internal */
    private _width: number | null;
    /** @internal */
    private _height: number | null;
    /** @internal */
    private _isHidden;
    /** @internal */
    private _isClosable;
    /** @internal */
    private _initialState: JsonValue | undefined;
    /** @internal */
    private _state: JsonValue | undefined;
    /** @internal */
    private _isShownWithZeroDimensions;
    /** @internal */
    private readonly _contentElement;
    /** @internal */
    private _tab: Tab;

    stateRequestEvent: ComponentContainer.StateRequestEventHandler | undefined;

    get width(): number | null { return this._width; }
    get height(): number | null { return this._height; }
    get parent(): ComponentItem { return this._parent; }
    /** @internal @deprecated use {@link (ComponentContainer:class).componentType} */
    get componentName(): JsonValue { return this._componentType; }
    get componentType(): JsonValue { return this._componentType; }
    get component(): ComponentItem.Component { return this._component; }
    get tab(): Tab { return this._tab; }
    get title(): string { return this._parent.title; }
    get layoutManager(): LayoutManager { return this._layoutManager; }
    get isHidden(): boolean { return this._isHidden; }
    /** Return the initial component state */
    get initialState(): JsonValue | undefined { return this._initialState; }
    /** The inner DOM element where the container's content is intended to live in */
    get contentElement(): HTMLElement { return this._contentElement; }

    /** @internal */
    constructor(config: ResolvedComponentItemConfig,
        private readonly _parent: ComponentItem,
        private readonly _layoutManager: LayoutManager,
        private readonly _element: HTMLElement,
        private readonly _updateItemConfigEvent: ComponentContainer.UpdateItemConfigEventHandler,
    ) {
        super();

        this._width = null;
        this._height = null;
        this._isHidden = false;
        this._isShownWithZeroDimensions = false;

        this._componentType = config.componentType;
        this._isClosable = config.isClosable;

        const contentElement = this._element.querySelector('.lm_content') as HTMLElement;
        if (contentElement === null) {
            throw new UnexpectedNullError('CCC11195');
        } else {
            this._contentElement = contentElement;
        }

        if (ResolvedComponentItemConfig.isSerialisable(config)) {
            this._isReact = false;
            this._initialState = config.componentState;
            this._state = this._initialState;
        } else {
            if (ResolvedComponentItemConfig.isReact(config)) {
                this._isReact = true;
                this._initialState = config.props as JsonValue;
                this._state = this._initialState;
            } else {
                throw new AssertError('ICGS25546');
            }
        }

        this._component = this.layoutManager.getComponent(this, config);
    }

    /** @internal */
    destroy(): void {
        this.releaseComponent();
        this.stateRequestEvent = undefined;
        this.emit('destroy');
    }

    /** @deprecated use {@link (ComponentContainer:class).contentElement } */
    getElement(): HTMLElement {
        return this._contentElement;
    }

    /**
     * Hide the container. Notifies the containers content first
     * and then hides the DOM node. If the container is already hidden
     * this should have no effect
     */
    hide(): void {
        if (!this._isHidden) {
            this.emit('hide');
            this._isHidden = true;
            this._isShownWithZeroDimensions = false;
        }
        this._element.style.display = 'none';
    }

    /**
     * Shows a previously hidden container. Notifies the
     * containers content first and then shows the DOM element.
     * If the container is already visible this has no effect.
     */
    show(): void {
        const wasHidden = this._isHidden;
        if (wasHidden) {
            this._isHidden = false;
            this.emit('show');
        }
        this._element.style.display = '';

        // emit shown only if the container has a valid size
        if (wasHidden) {
            if (this._height === 0 && this._width === 0) {
                this._isShownWithZeroDimensions = true;
            } else {
                this._isShownWithZeroDimensions = false;
                this.emit('shown');
            }
        } else {
            if (this._isShownWithZeroDimensions && (this._height !== 0 || this._width !== 0)) {
                this._isShownWithZeroDimensions = false;
                this.emit('shown');
            }
        }
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

                    const totalPixel = currentSize * (1 / (ancestorChildItem[direction] / 100));
                    const percentage = (newSize / totalPixel) * 100;
                    const delta = (ancestorChildItem[direction] - percentage) / (ancestorItem.contentItems.length - 1);

                    for (let i = 0; i < ancestorItem.contentItems.length; i++) {
                        if (ancestorItem.contentItems[i] === ancestorChildItem) {
                            ancestorItem.contentItems[i][direction] = percentage;
                        } else {
                            ancestorItem.contentItems[i][direction] += delta;
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

        let resolvedItemConfig: ResolvedComponentItemConfig;
        if (ItemConfig.isSerialisableComponent(itemConfig)) {
            if (this._isReact) {
                throw new Error('Cannot replace React component with Serialisable component')
            } else {
                const config = SerialisableComponentConfig.resolve(itemConfig);
                this._initialState = config.componentState;
                this._state = this._initialState;
                resolvedItemConfig = config;
            }
        } else {
            if (ItemConfig.isReactComponent(itemConfig)) {
                if (!this._isReact) {
                    throw new Error('Cannot replace Serialisable component with React component')
                } else {
                    const config = ReactComponentConfig.resolve(itemConfig);
                    this._initialState = config.props as JsonValue;
                    this._state = this._initialState;
                    resolvedItemConfig = config;
                }
            } else {
                throw new Error('ReplaceComponent not passed a component ItemConfig')
            }
        }

        this._componentType = resolvedItemConfig.componentType;

        this._updateItemConfigEvent(resolvedItemConfig);

        this._component = this.layoutManager.getComponent(this, resolvedItemConfig);
        this.emit('stateChanged');
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
        this._parent.emitBubblingEvent('stateChanged');
    }

    /**
     * Set's the components title
     */
    setTitle(title: string): void {
        this._parent.setTitle(title);
    }

    /** @internal */
    setTab(tab: Tab): void {
        this._tab = tab as Tab;
        this.emit('tab', tab)
    }

    /** @internal */
    setDragSize(width: number, height: number): void {
        setElementWidth(this._element, width);
        setElementHeight(this._element, height);
        setElementWidth(this._contentElement, width);
        setElementHeight(this._contentElement, height);
    }

    /**
     * Set's the containers size. Called by the container's component.
     * To set the size programmatically from within the container please
     * use the public setSize method
     * @param width - in px
     * @param height - in px
     * @internal
     */
    setSizeToNodeSize(width: number, height: number): void {
        if (width !== this._width || height !== this._height) {
            this._width = width;
            this._height = height;
            // Previously tried to set offsetWidth and offsetHeight if full jQuery was available
            // There is no simple alternative for setting offsetWidth/offsetHeight
            // See if just setting width and height suffices.  If not, needs more work
            // $.zepto ? this._contentElement.width(width) : this._contentElement.outerWidth(width);
            // $.zepto ? this._contentElement.height(height) : this._contentElement.outerHeight(height);
            setElementWidth(this._contentElement, width);
            setElementHeight(this._contentElement, height);
            this.emit('resize');
            if (this._isShownWithZeroDimensions && (this._height !== 0 || this._width !== 0)) {
                this._isShownWithZeroDimensions = false;
                this.emit('shown');
            }
        }
    }

    private releaseComponent() {
        this.emit('beforeComponentRelease', this._component);
        this.layoutManager.releaseComponent(this, this._component);
    }
}

/** @public @deprecated use {@link ComponentContainer} */
export type ItemContainer = ComponentContainer;

/** @public */
export namespace ComponentContainer {
    export type StateRequestEventHandler = (this: void) => JsonValue | undefined;
    /** @internal */
    export type UpdateItemConfigEventHandler = (itemConfig: ResolvedComponentItemConfig) => void;
}
