import { DragProxy } from '../controls/DragProxy';
import { UnexpectedNullError, UnexpectedUndefinedError } from '../errors/internal-error';
import { ComponentItem } from '../items/ComponentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import { createTemplateHtmlElement, stripTags } from '../utils/utils';
import { Header } from './Header';

/** @internal */
const _template = '<li class="lm_tab"><i class="lm_left"></i>' +
        '<span class="lm_title"></span><div class="lm_close_tab"></div>' +
        '<i class="lm_right"></i></li>'

/**
 * Represents an individual tab within a Stack's header
 */
export class Tab {
    /** @internal */
    private readonly _layoutManager: LayoutManager;
    /** @internal */
    private readonly _element: HTMLElement;
    /** @internal */
    private readonly _titleElement: HTMLElement;
    /** @internal */
    private readonly _closeElement: HTMLElement | undefined;

    /** @internal */
    private _dragListener: DragListener | undefined;
    /** @internal */
    private _isActive = false;

    /** @internal */
    private readonly _tabMouseDownListener = (ev: MouseEvent) => this.onTabMouseDown(ev);
    /** @internal */
    private readonly _tabTouchStartListener = () => this.onTabTouchStart();
    /** @internal */
    private readonly _closeClickListener = (ev: MouseEvent) => this.onCloseClick(ev);
    /** @internal */
    private readonly _closeTouchStartListener = (ev: TouchEvent) => this.onCloseTouchStart(ev);
    /** @internal */
    private readonly _closeMouseDownListener = (ev: MouseEvent) => this.onCloseMousedown(ev);
    /** @internal */
    private readonly _dragStartListener = (x: number, y: number) => this.onDragStart(x, y);
    /** @internal */
    private readonly _contentItemDestroyListener = () => this.onContentItemDestroy();

    get isActive(): boolean { return this._isActive; }
    get header(): Header { return this._header; }
    get componentItem(): ComponentItem { return this._componentItem; }
    /** @internal */
    set componentItem(value: ComponentItem) { this._componentItem = value; }
    /** @deprecated use {$@link componentItem} */
    get contentItem(): ComponentItem { return this._componentItem; }
    get element(): HTMLElement { return this._element; }
    get titleElement(): HTMLElement { return this._titleElement; }
    get closeElement(): HTMLElement | undefined { return this._closeElement; }

    /** @internal */
    constructor(private _componentItem: ComponentItem, private readonly _header: Header) {
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
        if (_componentItem.config.isClosable) {
            this._closeElement.style.display = '';
        } else {
            this._closeElement.style.display = 'none';
        }

        this.setTitle(_componentItem.config.title);
        this._componentItem.on('titleChanged', (title) => this.setTitle(title));

        this._layoutManager = this._componentItem.layoutManager;

        const reorderEnabled = _componentItem.config.reorderEnabled ?? this._layoutManager.config.settings.reorderEnabled;

        if (reorderEnabled) {
            this._dragListener = new DragListener(this._element);
            this._dragListener.on('dragStart', this._dragStartListener);
            this._componentItem.on('destroy', this._contentItemDestroyListener);
        }

        this._element.addEventListener('mousedown', this._tabMouseDownListener);
        this._element.addEventListener('touchstart', this._tabTouchStartListener);

        if (this._componentItem.config.isClosable) {
            this._closeElement.addEventListener('click', this._closeClickListener);
            this._closeElement.addEventListener('touchstart', this._closeTouchStartListener);
            this._closeElement.addEventListener('mousedown', this._closeMouseDownListener);
        } else {
            this._closeElement.remove();
            this._closeElement = undefined;
        }

        this._componentItem.setTab(this);
        this._componentItem.layoutManager.emit('tabCreated', this);
    }


    /**
     * Sets the tab's title to the provided string and sets
     * its title attribute to a pure text representation (without
     * html tags) of the same string.
     */
    setTitle(title: string): void {
        this._element.setAttribute('title', stripTags(title));
        this._titleElement.innerText = title;
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
     * @internal
     */
    destroy(): void {
        this._element.removeEventListener('mousedown', this._tabMouseDownListener);
        this._element.removeEventListener('touchstart', this._tabTouchStartListener);
        this._closeElement?.removeEventListener('click', this._closeClickListener);
        this._closeElement?.removeEventListener('touchstart', this._closeTouchStartListener);
        this._closeElement?.removeEventListener('mousedown', this._closeMouseDownListener);
        if (this._dragListener !== undefined) {
            this._componentItem.off('destroy', this._contentItemDestroyListener);
            this._dragListener.off('dragStart', this._dragStartListener);
            this._dragListener = undefined;
        }
        this._element.remove();
    }

    /**
     * Callback for the DragListener
     * @param   x The tabs absolute x position
     * @param   y The tabs absolute y position
     * @internal
     */
    private onDragStart(x: number, y: number): void {
        if (this._dragListener === undefined) {
            throw new UnexpectedUndefinedError('TODSDLU10093');
        } else {
            if (!this._header.canDestroy) {
                return;
            } else {
                const contentItemParent = this._componentItem.stack;
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
                        this._componentItem,
                        this._header.parent
                    );
                }
            }
        }

    }

    /** @internal */
    private onContentItemDestroy() {
        if (this._dragListener !== undefined) {
            this._dragListener.destroy();
            this._dragListener = undefined;
        }
    }

    /**
     * Callback when the tab is clicked
     * @internal
     */
    private onTabMouseDown(event: MouseEvent) {
        // left mouse button
        if (event.button === 0) {
            this._header.parent.setActiveContentItem(this._componentItem);

            // middle mouse button
        } else if (event.button === 1 && this._componentItem.config.isClosable) {
            this.onCloseClick(event);
        }
    }

    /** @internal */
    private onTabTouchStart() {
        this._header.parent.setActiveContentItem(this._componentItem);
    }

    /**
     * Callback when the tab's close button is clicked
     * @internal
     */
    private onCloseClick(event: MouseEvent) {
        event.stopPropagation();
        if (!this._header.canDestroy) {
            return;
        } else {
            this._header.parent.removeChild(this._componentItem, false);
        }
    }

    /** @internal */
    private onCloseTouchStart(event: TouchEvent) {
        event.stopPropagation();
        if (!this._header.canDestroy) {
            return;
        } else {
            this._header.parent.removeChild(this._componentItem, false);
        }
    }

    /**
     * Callback to capture tab close button mousedown
     * to prevent tab from activating.
     * @internal
     */
    private onCloseMousedown(event: MouseEvent): void {
        event.stopPropagation();
    }
}
