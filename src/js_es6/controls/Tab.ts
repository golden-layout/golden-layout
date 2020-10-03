import { Component } from 'src';
import { ItemContainer } from '../container/ItemContainer';
import { DragProxy } from '../controls/DragProxy';
import { UnexpectedNullError, UnexpectedUndefinedError } from '../errors/error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import {
    createTemplateHtmlElement,

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

export class Tab implements ItemContainer.Tab {
    private _layoutManager: LayoutManager;
    private _dragListener: DragListener | undefined;

    private _tabMouseDownListener = (ev: MouseEvent) => this.onTabMouseDown(ev);
    private _tabTouchStartListener = () => this.onTabTouchStart();
    private _closeClickListener = (ev: MouseEvent) => this.onCloseClick(ev);
    private _closeTouchStartListener = (ev: TouchEvent) => this.onCloseTouchStart(ev);
    private _closeMouseDownListener = (ev: MouseEvent) => this._onCloseMousedown(ev);
    private _dragStartListener = (x: number, y: number) => this._onDragStart(x, y);
    private _contentItemDestroyListener = () => this.onContentItemDestroy();

    element: HTMLElement;
    titleElement: HTMLElement;
    closeElement: HTMLElement | undefined;
    isActive: boolean;

    constructor(public header: Header, public component: Component, private _headerParent: Tab.HeaderParent) {
        this.element = createTemplateHtmlElement(_template, 'li');
        const titleElement = this.element.querySelector<HTMLElement>('.lm_title');
        if (titleElement === null) {
            throw new UnexpectedNullError('Bad Tab Template');
        } else {
            this.titleElement = titleElement;
        }
        const closeElement = this.element.querySelector<HTMLElement>('.lm_close_tab');
        if (closeElement === null) {
            throw new UnexpectedNullError('TCCEN08743');
        } else {
            this.closeElement = closeElement;
        }
        if (component.config.isClosable) {
            this.closeElement.style.display = '';
        } else {
            this.closeElement.style.display = 'none';
        }
        this.isActive = false;

        this.setTitle(component.config.title);
        this.component.on('titleChanged', (title) => this.setTitle(title));

        this._layoutManager = this.component.layoutManager;

        const reorderEnabled = component.config.reorderEnabled ?? this._layoutManager.config.settings.reorderEnabled;

        if (reorderEnabled) {
            this._dragListener = new DragListener(this.element);
            this._dragListener.on('dragStart', this._dragStartListener);
            this.component.on('destroy', this._contentItemDestroyListener);
        }

        this.element.addEventListener('mousedown', this._tabMouseDownListener);
        this.element.addEventListener('touchstart', this._tabTouchStartListener);

        if (this.component.config.isClosable) {
            this.closeElement.addEventListener('click', this._closeClickListener);
            this.closeElement.addEventListener('touchstart', this._closeTouchStartListener);
            this.closeElement.addEventListener('mousedown', this._closeMouseDownListener);
        } else {
            this.closeElement.remove();
            this.closeElement = undefined;
        }

        // this.contentItem.tab = this; // only Components have Tabs
        // this.contentItem.emit('tab', this);
        this.component.layoutManager.emit('tabCreated', this);

        if (this.component.isComponent) {
            const component = (this.component as Component);
            component.setTab(this);
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
        this.element.removeEventListener('mousedown', this._tabMouseDownListener);
        this.element.removeEventListener('touchstart', this._tabTouchStartListener);
        this.closeElement?.removeEventListener('click', this._closeClickListener);
        this.closeElement?.removeEventListener('touchstart', this._closeTouchStartListener);
        this.closeElement?.removeEventListener('mousedown', this._closeMouseDownListener);
        if (this._dragListener !== undefined) {
            this.component.off('destroy', this._contentItemDestroyListener);
            this._dragListener.off('dragStart', this._dragStartListener);
            this._dragListener = undefined;
        }
        this.element.remove();
    }

    /**
     * Callback for the DragListener
     *
     * @param   x The tabs absolute x position
     * @param   y The tabs absolute y position
     */
    _onDragStart(x: number, y: number): void {
        if (this._dragListener === undefined) {
            throw new UnexpectedUndefinedError('TODSDLU10093');
        } else {
            if (!this.header.canDestroy) {
                return;
            } else {
                const contentItemParent = this.component.parent;
                if (contentItemParent === null) {
                    throw new UnexpectedNullError('TODSCIPN71115');
                } else {
                    if (contentItemParent.isMaximised === true) {
                        contentItemParent.toggleMaximise();
                    }
                    new DragProxy(
                        x,
                        y,
                        this._dragListener,
                        this._layoutManager,
                        this.component,
                        this._headerParent
                    );
                }
            }
        }

    }

    private onContentItemDestroy() {
        if (this._dragListener !== undefined) {
            this._dragListener.destroy();
            this._dragListener = undefined;
        }
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
            this._headerParent.setActiveContentItem(this.component);

            // middle mouse button
        } else if (event.button === 1 && this.component.config.isClosable) {
            this.onCloseClick(event);
        }
    }

    private onTabTouchStart() {
        this._headerParent.setActiveContentItem(this.component);
    }

    /**
     * Callback when the tab's close button is
     * clicked
     */
    private onCloseClick(event: MouseEvent) {
        event.stopPropagation();
        if (!this.header.canDestroy) {
            return;
        } else {
            this._headerParent.removeChild(this.component);
        }
    }

    private onCloseTouchStart(event: TouchEvent) {
        event.stopPropagation();
        if (!this.header.canDestroy) {
            return;
        } else {
            this._headerParent.removeChild(this.component);
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
    _onCloseMousedown(event: MouseEvent): void {
        event.stopPropagation();
    }
}

export namespace Tab {
    export interface HeaderParent extends AbstractContentItem {
        setActiveContentItem(component: Component): void;        
    }
}
