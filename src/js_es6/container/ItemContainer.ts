import { ComponentConfig } from '../config/config';
import { Tab } from '../controls/Tab';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { Component } from '../items/Component';
import { LayoutManager } from '../LayoutManager';
import { EventEmitter } from '../utils/EventEmitter';
import { JsonValue } from '../utils/types';
import { createTemplateHtmlElement, deepExtend, setElementHeight, setElementWidth } from '../utils/utils';

export class ItemContainer extends EventEmitter {
    width: number | null;
    height: number | null;
    readonly title;
    isHidden;
    readonly element;
    private readonly _contentElement;
    private _tab: Tab;

    get config(): ComponentConfig { return this._config; }
    get tab(): Tab { return this._tab; }

    constructor(private readonly _config: ComponentConfig, public readonly parent: Component, public readonly layoutManager: LayoutManager) {

        super();

        this.width = null;
        this.height = null;
        this.title = this._config.componentName;
        this.isHidden = false;

        this.element = createTemplateHtmlElement(
            '<div class="lm_item_container"> ' +
            '  <div class="lm_content"></div>' +
            '</div>');

        const contentElement = this.element.querySelector('.lm_content') as HTMLElement;
        if (contentElement === null) {
            throw new Error('ItemContainer.constructor: contentElement not found')
        } else {
            this._contentElement = contentElement;
        }
    }

    /**
     * Get the inner DOM element the container's content
     * is intended to live in
     *
     * @returns {DOM element}
     */
    getContentElement(): HTMLElement {
        return this._contentElement;
    }


    /**
     * Hide the container. Notifies the containers content first
     * and then hides the DOM node. If the container is already hidden
     * this should have no effect
     *
     * @returns {void}
     */
    hide(): void {
        this.emit('hide');
        this.isHidden = true;
        this.element.style.display = 'none';
    }


    /**
     * Shows a previously hidden container. Notifies the
     * containers content first and then shows the DOM element.
     * If the container is already visible this has no effect.
     *
     * @returns {void}
     */
    show(): void {
        this.emit('show');
        this.isHidden = false;
        this.element.style.display = '';
        // emit shown only if the container has a valid size
        if (this.height != 0 || this.width != 0) {
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
     * @todo  Rework!!!
     * @param width  The new width in pixel
     * @param height The new height in pixel
     *
     * @returns resizeSuccesful
     */
    setSize(width: number, height: number): boolean {
        let ancestorItem: AbstractContentItem | null = this.parent;
        if (ancestorItem.isColumn || ancestorItem.isRow || ancestorItem.parent === null) {
            throw new AssertError('ICSSPRC', 'ItemContainer cannot have RowColumn Parent');
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
     *
     * @returns {void}
     */
    close(): void {
        if (this._config.isClosable) {
            this.emit('close');
            this.parent.close();
        }
    }


    /**
     * Returns the current state object
     *
     * @returns {Object} state
     */
    getState(): JsonValue {
        if (ComponentConfig.isJson(this._config)) {
            return this._config.componentState;
        } else {
            if (ComponentConfig.isReact(this._config)) {
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
        if (ComponentConfig.isJson(this._config)) {
            this._config.componentState = state;
            this.parent.emitBubblingEvent('stateChanged');
        } else {
            if (ComponentConfig.isReact(this._config)) {
                this._config.props = state;
                this.parent.emitBubblingEvent('stateChanged');
            } else {
                throw new AssertError('ICSS25546');
            }
        }
    }


    /**
     * Set's the components title
     */
    setTitle(title: string): void {
        this.parent.setTitle(title);
    }

    setTab(tab: Tab): void {
        this._tab = tab as Tab;
        this.emit('tab', tab)
    }


    /**
     * Set's the containers size. Called by the container's component.
     * To set the size programmatically from within the container please
     * use the public setSize method
     *
     * @param {[Int]} width  in px
     * @param {[Int]} height in px
     *
     * @returns {void}
     */
    _$setSize(width: number, height: number): void {
        if (width !== this.width || height !== this.height) {
            this.width = width;
            this.height = height;
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
