import { ComponentConfig } from '../config/config';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { RowOrColumn } from '../items/RowOrColumn';
import { LayoutManager } from '../LayoutManager';
import { EventEmitter } from '../utils/EventEmitter';
import { createTemplateHtmlElement, deepExtend } from '../utils/utils';

export class ItemContainer extends EventEmitter {
    width: number | null;
    height: number | null;
    readonly title;
    isHidden;
    readonly element;
    private readonly _contentElement;

    constructor(private readonly _config: ComponentConfig, public readonly parent: RowOrColumn, public readonly layoutManager: LayoutManager) {

        super();

        this.width = null;
        this.height = null;
        this.title = this._config.componentName;
        this.isHidden = false;

        this.element = createTemplateHtmlElement(
            '<div class="lm_item_container"> ' +
            '  <div class="lm_content"></div>' +
            '</div>', 'div');

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
    getElement(): HTMLElement {
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
        // call shown only if the container has a valid size
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
     * @param {Number} width  The new width in pixel
     * @param {Number} height The new height in pixel
     *
     * @returns {Boolean} resizeSuccesful
     */
    setSize(width: number, height: number): boolean {
        let rowOrColumn = this.parent;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let rowOrColumnChild: AbstractContentItem = this;

        while (!rowOrColumn.isColumn && !rowOrColumn.isRow) {
            rowOrColumnChild = rowOrColumn;
            rowOrColumn = rowOrColumn.parent;

            /**
             * No row or column has been found
             */
            if (rowOrColumn.isRoot) {
                return false;
            }
        }

        const direction = rowOrColumn.isColumn ? 'height' : 'width';
        const newSize = direction === 'height' ? height : width;

        const totalPixel = this[direction] * (1 / (rowOrColumnChild.config[direction] / 100));
        const percentage = (newSize / totalPixel) * 100;
        const delta = (rowOrColumnChild.config[direction] - percentage) / (rowOrColumn.contentItems.length - 1);

        for (let i = 0; i < rowOrColumn.contentItems.length; i++) {
            if (rowOrColumn.contentItems[i] === rowOrColumnChild) {
                rowOrColumn.contentItems[i].config[direction] = percentage;
            } else {
                rowOrColumn.contentItems[i].config[direction] += delta;
            }
        }

        rowOrColumn.callDownwards('setSize');

        return true;
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
    getState(): Record<string, unknown> {
        return this._config.componentState;
    }


    /**
     * Merges the provided state into the current one
     *
     * @param   {Object} state
     *
     * @returns {void}
     */
    extendState(state: Record<string, unknown>): void {
        const extendedState = deepExtend(this.getState(), state);
        this.setState(extendedState);
    }


    /**
     * Notifies the layout manager of a stateupdate
     *
     * @param {serialisable} state
     */
    setState(state: Record<string, unknown>): void {
        this._config.componentState = state;
        this.parent.emitBubblingEvent('stateChanged');
    }


    /**
     * Set's the components title
     *
     * @param {String} title
     */
    setTitle(title: string) {
        this.parent.setTitle(title);
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
    _$setSize(width: [Int], height: [Int]): void {
        if (width !== this.width || height !== this.height) {
            this.width = width;
            this.height = height;
            $.zepto ? this._contentElement.width(width) : this._contentElement.outerWidth(width);
            $.zepto ? this._contentElement.height(height) : this._contentElement.outerHeight(height);
            this.emit('resize');
        }
    }
}
