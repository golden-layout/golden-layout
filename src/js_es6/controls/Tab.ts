import { DragProxy } from '../controls/DragProxy';
import { UnexpectedNullError, UnexpectedUndefinedError } from '../errors/internal-error';
import { ComponentItem } from '../items/ComponentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import { createTemplateHtmlElement, stripTags } from '../utils/utils';
import { Header } from './Header';

/**
 * Represents an individual tab within a Stack's header
 */

const _template = '<li class="lm_tab"><i class="lm_left"></i>' +
        '<span class="lm_title"></span><div class="lm_close_tab"></div>' +
        '<i class="lm_right"></i></li>'

export class Tab {
    private _layoutManager: LayoutManager;
    private _element: HTMLElement;
    private _dragListener: DragListener | undefined;
    private _titleElement: HTMLElement;
    private _closeElement: HTMLElement | undefined;
    private _isActive: boolean;

    private _tabMouseDownListener = (ev: MouseEvent) => this.onTabMouseDown(ev);
    private _tabTouchStartListener = () => this.onTabTouchStart();
    private _closeClickListener = (ev: MouseEvent) => this.onCloseClick(ev);
    private _closeTouchStartListener = (ev: TouchEvent) => this.onCloseTouchStart(ev);
    private _closeMouseDownListener = (ev: MouseEvent) => this._onCloseMousedown(ev);
    private _dragStartListener = (x: number, y: number) => this._onDragStart(x, y);
    private _contentItemDestroyListener = () => this.onContentItemDestroy();

    get element(): HTMLElement { return this._element; }
    get titleElement(): HTMLElement { return this._titleElement; }

    constructor(public component: ComponentItem, private _header: Header) {
        this._element = createTemplateHtmlElement(_template);
        const titleElement = this._element.querySelector<HTMLElement>('.lm_title');
        if (titleElement === null) {
            throw new UnexpectedNullError('Bad Tab Template');
        } else {
            this._titleElement = titleElement;
        }
        const closeElement = this._element.querySelector<HTMLElement>('.lm_close_tab');
        if (closeElement === null) {
            throw new UnexpectedNullError('TCCEN08743');
        } else {
            this._closeElement = closeElement;
        }
        if (component.config.isClosable) {
            this._closeElement.style.display = '';
        } else {
            this._closeElement.style.display = 'none';
        }
        this._isActive = false;

        this.setTitle(component.config.title);
        this.component.on('titleChanged', (title) => this.setTitle(title));

        this._layoutManager = this.component.layoutManager;

        const reorderEnabled = component.config.reorderEnabled ?? this._layoutManager.config.settings.reorderEnabled;

        if (reorderEnabled) {
            this._dragListener = new DragListener(this._element);
            this._dragListener.on('dragStart', this._dragStartListener);
            this.component.on('destroy', this._contentItemDestroyListener);
        }

        this._element.addEventListener('mousedown', this._tabMouseDownListener);
        this._element.addEventListener('touchstart', this._tabTouchStartListener);

        if (this.component.config.isClosable) {
            this._closeElement.addEventListener('click', this._closeClickListener);
            this._closeElement.addEventListener('touchstart', this._closeTouchStartListener);
            this._closeElement.addEventListener('mousedown', this._closeMouseDownListener);
        } else {
            this._closeElement.remove();
            this._closeElement = undefined;
        }

        this.component.setTab(this);
        this.component.layoutManager.emit('tabCreated', this);
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
        this._element.setAttribute('title', stripTags(title));
        this._titleElement.innerHTML = title;
    }

    /**
     * Sets this tab's active state. To programmatically
     * switch tabs, use header.setActiveContentItem( item ) instead.
     */
    setActive(isActive: boolean): void {
        if (isActive === this._isActive) {
            return;
        }
        this._isActive = isActive;

        if (isActive) {
            this._element.classList.add('lm_active');
        } else {
            this._element.classList.remove('lm_active');
        }
    }

    /**
     * Destroys the tab
     */
    _$destroy(): void {
        this._element.removeEventListener('mousedown', this._tabMouseDownListener);
        this._element.removeEventListener('touchstart', this._tabTouchStartListener);
        this._closeElement?.removeEventListener('click', this._closeClickListener);
        this._closeElement?.removeEventListener('touchstart', this._closeTouchStartListener);
        this._closeElement?.removeEventListener('mousedown', this._closeMouseDownListener);
        if (this._dragListener !== undefined) {
            this.component.off('destroy', this._contentItemDestroyListener);
            this._dragListener.off('dragStart', this._dragStartListener);
            this._dragListener = undefined;
        }
        this._element.remove();
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
            if (!this._header.canDestroy) {
                return;
            } else {
                const contentItemParent = this.component.stack;
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
                        this._header.parent
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
            this._header.parent.setActiveContentItem(this.component);

            // middle mouse button
        } else if (event.button === 1 && this.component.config.isClosable) {
            this.onCloseClick(event);
        }
    }

    private onTabTouchStart() {
        this._header.parent.setActiveContentItem(this.component);
    }

    /**
     * Callback when the tab's close button is
     * clicked
     */
    private onCloseClick(event: MouseEvent) {
        event.stopPropagation();
        if (!this._header.canDestroy) {
            return;
        } else {
            this._header.parent.removeChild(this.component, false);
        }
    }

    private onCloseTouchStart(event: TouchEvent) {
        event.stopPropagation();
        if (!this._header.canDestroy) {
            return;
        } else {
            this._header.parent.removeChild(this.component, false);
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
