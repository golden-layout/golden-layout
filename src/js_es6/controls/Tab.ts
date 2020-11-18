import { UnexpectedNullError, UnexpectedUndefinedError } from '../errors/internal-error';
import { ComponentItem } from '../items/ComponentItem';
import { LayoutManager } from '../LayoutManager';
import { DragListener } from '../utils/DragListener';
import { createTemplateHtmlElement, stripTags } from '../utils/utils';

/** @internal */
const _template = '<li class="lm_tab"><i class="lm_left"></i>' +
        '<span class="lm_title"></span><div class="lm_close_tab"></div>' +
        '<i class="lm_right"></i></li>'

/**
 * Represents an individual tab within a Stack's header
 */
export class Tab {
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
    private readonly _tabTouchStartListener = (ev: TouchEvent) => this.onTabTouchStart(ev);
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
    // get header(): Header { return this._header; }
    get componentItem(): ComponentItem { return this._componentItem; }
    /** @internal */
    set componentItem(value: ComponentItem) { this._componentItem = value; }
    /** @deprecated use {@link componentItem} */
    get contentItem(): ComponentItem { return this._componentItem; }
    get element(): HTMLElement { return this._element; }
    get titleElement(): HTMLElement { return this._titleElement; }
    get closeElement(): HTMLElement | undefined { return this._closeElement; }

    /** @internal */
    constructor(private readonly _layoutManager: LayoutManager,
        private _componentItem: ComponentItem,
        private _closeEvent: Tab.CloseEvent | undefined,
        private _activateEvent: Tab.ActivateEvent | undefined,
        private _dragStartEvent: Tab.DragStartEvent | undefined
    ) {
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

        const reorderEnabled = _componentItem.config.reorderEnabled ?? this._layoutManager.managerConfig.settings.reorderEnabled;

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
        this._layoutManager.emit('tabCreated', this);
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
     * switch tabs, use Stack.setActiveComponentItem( item ) instead.
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
        this._closeEvent = undefined;
        this._activateEvent = undefined;
        this._dragStartEvent = undefined;
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
            if (this._dragStartEvent === undefined) {
                throw new UnexpectedUndefinedError('TODS23309');
            } else {
                this._dragStartEvent(x, y, this._dragListener, this.componentItem);
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
            event.stopPropagation();
            this.notifyActivate();

            // middle mouse button
        } else if (event.button === 1 && this._componentItem.config.isClosable) {
            event.stopPropagation();
            this.notifyClose();
        }
    }

    /** @internal */
    private onTabTouchStart(event: TouchEvent) {
        event.stopPropagation();
        this.notifyActivate();
    }

    /**
     * Callback when the tab's close button is clicked
     * @internal
     */
    private onCloseClick(event: MouseEvent) {
        event.stopPropagation();
        this.notifyClose();
    }

    /** @internal */
    private onCloseTouchStart(event: TouchEvent) {
        event.stopPropagation();
        this.notifyClose();
    }

    /**
     * Callback to capture tab close button mousedown
     * to prevent tab from activating.
     * @internal
     */
    private onCloseMousedown(event: MouseEvent): void {
        event.stopPropagation();
    }

    private notifyClose() {
        if (this._closeEvent === undefined) {
            throw new UnexpectedUndefinedError('TNC15007');
        } else {
            this._closeEvent(this._componentItem);
        }
    }

    private notifyActivate() {
        if (this._activateEvent === undefined) {
            throw new UnexpectedUndefinedError('TNA15007');
        } else {
            this._activateEvent(this._componentItem);
        }
    }
}

/** @internal */
export namespace Tab {
    export type CloseEvent = (componentItem: ComponentItem) => void;
    export type ActivateEvent = (componentItem: ComponentItem) => void;
    export type DragStartEvent = (x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) => void;
}
