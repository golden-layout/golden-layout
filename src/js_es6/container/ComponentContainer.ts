import { ComponentItemConfig } from '../config/config';
import { Tab } from '../controls/Tab';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { ComponentItem } from '../items/ComponentItem';
import { LayoutManager } from '../LayoutManager';
import { EventEmitter } from '../utils/EventEmitter';
import { JsonValue } from '../utils/types';
import { deepExtend, setElementHeight, setElementWidth } from '../utils/utils';

export class ComponentContainer extends EventEmitter {
    /** @internal */
    private _width: number | null;
    /** @internal */
    private _height: number | null;
    /** @internal */
    private readonly _title;
    /** @internal */
    private _isHidden;
    /** @internal */
    private readonly _contentElement;
    /** @internal */
    private _tab: Tab;

    get width(): number | null { return this._width; }
    get height(): number | null { return this._height; }
    get parent(): ComponentItem { return this._parent; }
    get config(): ComponentItemConfig { return this._config; }
    get tab(): Tab { return this._tab; }
    get title(): string { return this._title; }
    get layoutManager(): LayoutManager { return this._layoutManager; }
    get isHidden(): boolean { return this._isHidden; }
    /** The inner DOM element where the container's content is intended to live in */
    get contentElement(): HTMLElement { return this._contentElement; }

    /** @internal */
    constructor(private readonly _config: ComponentItemConfig,
        private readonly _parent: ComponentItem,
        private readonly _layoutManager: LayoutManager,
        private readonly _element: HTMLElement
    ) {
        super();

        this._width = null;
        this._height = null;
        this._title = this._config.componentName;
        this._isHidden = false;

        const contentElement = this._element.querySelector('.lm_content') as HTMLElement;
        if (contentElement === null) {
            throw new UnexpectedNullError('CCC11195');
        } else {
            this._contentElement = contentElement;
        }
    }

    /** @deprecated use {@link contentElement } */
    getElement(): HTMLElement {
        return this._contentElement;
    }

    /**
     * Hide the container. Notifies the containers content first
     * and then hides the DOM node. If the container is already hidden
     * this should have no effect
     */
    hide(): void {
        this.emit('hide');
        this._isHidden = true;
        this._element.style.display = 'none';
    }

    /**
     * Shows a previously hidden container. Notifies the
     * containers content first and then shows the DOM element.
     * If the container is already visible this has no effect.
     */
    show(): void {
        this.emit('show');
        this._isHidden = false;
        this._element.style.display = '';
        // emit shown only if the container has a valid size
        if (this._height != 0 || this._width != 0) {
            this.emit('shown');
        }
    }


    /**
     * Set the size from within the container. Traverses up
     * the item tree until it finds a row or column element
     * and resizes its items accordingly.
     *
     * If this container isn't a descendant of a row or column
     * it returns false
     * @param width  The new width in pixel
     * @param height The new height in pixel
     *
     * @returns resizeSuccesful
     */
    setSize(width: number, height: number): boolean {
        let ancestorItem: AbstractContentItem | null = this._parent;
        if (ancestorItem.isColumn || ancestorItem.isRow || ancestorItem.parent === null) {
            throw new AssertError('ICSSPRC', 'ComponentContainer cannot have RowColumn Parent');
        } else {
            let ancestorChildItem: AbstractContentItem;
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

                    const totalPixel = currentSize * (1 / (ancestorChildItem.config[direction] / 100));
                    const percentage = (newSize / totalPixel) * 100;
                    const delta = (ancestorChildItem.config[direction] - percentage) / (ancestorItem.contentItems.length - 1);

                    for (let i = 0; i < ancestorItem.contentItems.length; i++) {
                        if (ancestorItem.contentItems[i] === ancestorChildItem) {
                            ancestorItem.contentItems[i].config[direction] = percentage;
                        } else {
                            ancestorItem.contentItems[i].config[direction] += delta;
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
        if (this._config.isClosable) {
            this.emit('close');
            this._parent.close();
        }
    }


    /**
     * Returns the current state object
     * @returns state
     */
    getState(): JsonValue {
        if (ComponentItemConfig.isSerialisable(this._config)) {
            return this._config.componentState;
        } else {
            if (ComponentItemConfig.isReact(this._config)) {
                return this._config.props as JsonValue;
            } else {
                throw new AssertError('ICGS25546');
            }
        }
    }


    /**
     * Merges the provided state into the current one
     */
    extendState(state: Record<string, unknown>): void {
        const extendedState = deepExtend(this.getState() as Record<string, unknown>, state);
        this.setState(extendedState as JsonValue);
    }


    /**
     * Notifies the layout manager of a stateupdate
     *
     * @param {serialisable} state
     */
    setState(state: JsonValue): void {
        if (ComponentItemConfig.isSerialisable(this._config)) {
            this._config.componentState = state;
            this._parent.emitBubblingEvent('stateChanged');
        } else {
            if (ComponentItemConfig.isReact(this._config)) {
                this._config.props = state;
                this._parent.emitBubblingEvent('stateChanged');
            } else {
                throw new AssertError('ICSS25546');
            }
        }
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


    /**
     * Set's the containers size. Called by the container's component.
     * To set the size programmatically from within the container please
     * use the public setSize method
     * @param width  in px
     * @param height in px
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
        }
    }
}

/** @deprecated use {@link ComponentContainer} */
export type ItemContainer = ComponentContainer;
