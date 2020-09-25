import { DragProxy } from '../controls/DragProxy';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import {
    createTemplateHtmlElement,
    fnBind,
    stripTags
} from '../utils/utils';
import { Header } from './Header';

/**
 * Represents an individual tab within a Stack's header
 *
 * @param {Header} header
 * @param {AbstractContentItem} contentItem
 *
 * @constructor
 */

const _template = '<li class="lm_tab"><i class="lm_left"></i>' +
        '<span class="lm_title"></span><div class="lm_close_tab"></div>' +
        '<i class="lm_right"></i></li>'

export class Tab {
    private _layoutManager: LayoutManager;

    private _tabMouseDownEventListener = (ev: MouseEvent) => this.onTabMouseDown(ev);
    private _tabTouchStartEventListener = (ev: TouchEvent) => this.onTabTouchStart(ev);
    private _closeClickEventListener = (ev: MouseEvent) => this.onCloseClick(ev);
    private _closeTouchStartEventListener = (ev: TouchEvent) => this.onCloseTouchStart(ev);

    element: HTMLElement;
    titleElement: HTMLElement;
    closeElement: HTMLElement;
    isActive: boolean;

    constructor(public header: Header, public contentItem: AbstractContentItem) {
        this.contentItem = contentItem;
        this.element = createTemplateHtmlElement(_template, 'li');
        const titleElement = this.element.querySelector<HTMLElement>('.lm_title');
        if (titleElement === null) {
            throw Error('Bad Tab Template');
        } else {
            this.titleElement = titleElement;
        }
        const closeElement = this.element.querySelector<HTMLElement>('.lm_close_tab');
        if (closeElement === null) {

        } else {
            this.closeElement = closeElement;
        }
        if (contentItem.config.isClosable) {
            this.closeElement.style.display = '';
        } else {
            this.closeElement.style.display = 'none';
        }
        this.isActive = false;

        this.setTitle(contentItem.config.title);
        this.contentItem.on('titleChanged', this.setTitle, this);

        this._layoutManager = this.contentItem.layoutManager;

        if (
            this._layoutManager.config.settings.reorderEnabled === true &&
            contentItem.config.reorderEnabled === true
        ) {
            this._dragListener = new DragListener(this.element);
            this._dragListener.on('dragStart', this._onDragStart, this);
            this.contentItem.on('destroy', this._dragListener.destroy, this._dragListener);
        }

        this._onTabClickFn = fnBind(this.onTabMouseDown, this);
        this._onCloseClickFn = fnBind(this.onCloseClick, this);

        this.element.on('mousedown touchstart', this._onTabClickFn);

        if (this.contentItem.config.isClosable) {
            this.closeElement.on('click touchstart', this._onCloseClickFn);
            this.closeElement.on('mousedown', this._onCloseMousedown);
        } else {
            this.closeElement.remove();
        }

        this.contentItem.tab = this;
        this.contentItem.emit('tab', this);
        this.contentItem.layoutManager.emit('tabCreated', this);

        if (this.contentItem.isComponent) {
            this.contentItem.container.tab = this;
            this.contentItem.container.emit('tab', this);
        }
    }


    /**
     * Sets the tab's title to the provided string and sets
     * its title attribute to a pure text representation (without
     * html tags) of the same string.
     *
     * @public
     * @param {String} title can contain html
     */
    setTitle(title: string): void {
        this.element.setAttribute('title', stripTags(title));
        this.titleElement.innerHTML = title;
    }

    /**
     * Sets this tab's active state. To programmatically
     * switch tabs, use header.setActiveContentItem( item ) instead.
     *
     * @public
     * @param {Boolean} isActive
     */
    setActive(isActive: boolean): void {
        if (isActive === this.isActive) {
            return;
        }
        this.isActive = isActive;

        if (isActive) {
            this.element.classList.add('lm_active');
        } else {
            this.element.classList.remove('lm_active');
        }
    }

    /**
     * Destroys the tab
     */
    _$destroy(): void {
        this.element.removeEventListener('mousedown', this._tabMouseDownEventListener);
        this.element.removeEventListener('touchstart', this._tabTouchStartEventListener);
        this.closeElement.removeEventListener('click', this._closeClickEventListener);
        this.closeElement.removeEventListener('touchstart', this._closeTouchStartEventListener);
        if (this._dragListener) {
            this.contentItem.off('destroy', this._dragListener.destroy, this._dragListener);
            this._dragListener.off('dragStart', this._onDragStart);
            this._dragListener = null;
        }
        this.element.remove();
    }

    /**
     * Callback for the DragListener
     *
     * @param   {Number} x The tabs absolute x position
     * @param   {Number} y The tabs absolute y position
     *
     * @private
     * @returns {void}
     */
    _onDragStart(x, y) {
        if (!this.header._canDestroy)
            return null;
        if (this.contentItem.parent.isMaximised === true) {
            this.contentItem.parent.toggleMaximise();
        }
        new DragProxy(
            x,
            y,
            this._dragListener,
            this._layoutManager,
            this.contentItem,
            this.header.parent
        );
    }

    /**
     * Callback when the tab is clicked
     *
     * @param {jQuery DOM event} event
     *
     * @private
     * @returns {void}
     */
    private onTabMouseDown(event: MouseEvent) {
        // left mouse button
        if (event.button === 0) {
            this.header.parent.setActiveContentItem( this.contentItem );

            // middle mouse button
        } else if (event.button === 1 && this.contentItem.config.isClosable) {
            this.onCloseClick(event);
        }
    }

    private onTabTouchStart(event: TouchEvent) {
        this.header.parent.setActiveContentItem( this.contentItem );
    }

    /**
     * Callback when the tab's close button is
     * clicked
     */
    private onCloseClick(event: MouseEvent) {
        event.stopPropagation();
        if (!this.header._canDestroy) {
            return;
        } else {
            this.header.parent.removeChild(this.contentItem);
        }
    }

    private onCloseTouchStart(event: TouchEvent) {
        event.stopPropagation();
        if (!this.header._canDestroy) {
            return;
        } else {
            this.header.parent.removeChild(this.contentItem);
        }
    }

    /**
     * Callback to capture tab close button mousedown
     * to prevent tab from activating.
     *
     * @param (jQuery DOM event) event
     *
     * @private
     * @returns {void}
     */
    _onCloseMousedown(event) {
        event.stopPropagation();
    }
}
