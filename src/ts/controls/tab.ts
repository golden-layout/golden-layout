import { UnexpectedUndefinedError } from '../errors/internal-error';
import { ComponentItem } from '../items/component-item';
import { LayoutManager } from '../layout-manager';
import { DomConstants } from '../utils/dom-constants';
import { DragListener } from '../utils/drag-listener';

/**
 * Represents an individual tab within a Stack's header
 * @public
 */
export class Tab {
    /** @internal */
    private readonly _element: HTMLDivElement;
    /** @internal */
    private readonly _titleElement: HTMLSpanElement;
    /** @internal */
    private readonly _closeElement: HTMLDivElement | undefined;

    /** @internal */
    private _dragListener: DragListener | undefined;
    /** @internal */
    private _isActive = false;

    /** @internal */
    private readonly _tabClickListener = (ev: MouseEvent) => this.onTabClickDown(ev);
    /** @internal */
    private readonly _tabTouchStartListener = (ev: TouchEvent) => this.onTabTouchStart(ev);
    /** @internal */
    private readonly _closeClickListener = () => this.onCloseClick();
    /** @internal */
    private readonly _closeTouchStartListener = () => this.onCloseTouchStart();
    // /** @internal */
    // private readonly _closeMouseDownListener = () => this.onCloseMousedown();
    /** @internal */
    private readonly _dragStartListener = (x: number, y: number) => this.onDragStart(x, y);
    /** @internal */
    private readonly _contentItemDestroyListener = () => this.onContentItemDestroy();
    /** @internal */
    private readonly _tabTitleChangedListener = (title: string) => this.setTitle(title)

    get isActive(): boolean { return this._isActive; }
    // get header(): Header { return this._header; }
    get componentItem(): ComponentItem { return this._componentItem; }
    /** @deprecated use {@link (Tab:class).componentItem} */
    get contentItem(): ComponentItem { return this._componentItem; }
    get element(): HTMLElement { return this._element; }
    get titleElement(): HTMLElement { return this._titleElement; }
    get closeElement(): HTMLElement | undefined { return this._closeElement; }
    get reorderEnabled(): boolean { return this._dragListener !== undefined; }
    set reorderEnabled(value: boolean) {
        if (value !== this.reorderEnabled) {
            if (value) {
                this.enableReorder();
            } else {
                this.disableReorder();
            }
        }
    }

    /** @internal */
    constructor(
        /** @internal */
        private readonly _layoutManager: LayoutManager,
        /** @internal */
        private _componentItem: ComponentItem,
        /** @internal */
        private _closeEvent: Tab.CloseEvent | undefined,
        /** @internal */
        private _focusEvent: Tab.FocusEvent | undefined,
        /** @internal */
        private _dragStartEvent: Tab.DragStartEvent | undefined
    ) {
        this._element = document.createElement('div');
        this._element.classList.add(DomConstants.ClassName.Tab);
        this._titleElement = document.createElement('span'); 
        this._titleElement.classList.add(DomConstants.ClassName.Title);
        this._closeElement = document.createElement('div'); 
        this._closeElement.classList.add(DomConstants.ClassName.CloseTab);
        this._element.appendChild(this._titleElement);
        this._element.appendChild(this._closeElement);

        if (_componentItem.isClosable) {
            this._closeElement.style.display = '';
        } else {
            this._closeElement.style.display = 'none';
        }

        this.setTitle(_componentItem.title);
        this._componentItem.on('titleChanged', this._tabTitleChangedListener);

        const reorderEnabled = _componentItem.reorderEnabled ?? this._layoutManager.layoutConfig.settings.reorderEnabled;

        if (reorderEnabled) {
            this.enableReorder();
        }

        this._element.addEventListener('click', this._tabClickListener, { passive: true });
        this._element.addEventListener('touchstart', this._tabTouchStartListener, { passive: true });

        if (this._componentItem.isClosable) {
            this._closeElement.addEventListener('click', this._closeClickListener, { passive: true });
            this._closeElement.addEventListener('touchstart', this._closeTouchStartListener, { passive: true });
            // this._closeElement.addEventListener('mousedown', this._closeMouseDownListener, { passive: true });
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
        this._titleElement.innerText = title;
        this._element.title = title;
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
            this._element.classList.add(DomConstants.ClassName.Active);
        } else {
            this._element.classList.remove(DomConstants.ClassName.Active);
        }
    }

    /**
     * Destroys the tab
     * @internal
     */
    destroy(): void {
        this._closeEvent = undefined;
        this._focusEvent = undefined;
        this._dragStartEvent = undefined;
        this._element.removeEventListener('click', this._tabClickListener);
        this._element.removeEventListener('touchstart', this._tabTouchStartListener);
        this._closeElement?.removeEventListener('click', this._closeClickListener);
        this._closeElement?.removeEventListener('touchstart', this._closeTouchStartListener);
        // this._closeElement?.removeEventListener('mousedown', this._closeMouseDownListener);
        this._componentItem.off('titleChanged', this._tabTitleChangedListener);
        if (this.reorderEnabled) {
            this.disableReorder();
        }
        this._element.remove();
    }

    /** @internal */
    setBlurred(): void {
        this._element.classList.remove(DomConstants.ClassName.Focused);
        this._titleElement.classList.remove(DomConstants.ClassName.Focused);
    }

    /** @internal */
    setFocused(): void {
        this._element.classList.add(DomConstants.ClassName.Focused);
        this._titleElement.classList.add(DomConstants.ClassName.Focused);
    }

    /**
     * Callback for the DragListener
     * @param x - The tabs absolute x position
     * @param y - The tabs absolute y position
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
    private onTabClickDown(event: MouseEvent) {
        const target = event.target;
        if (target === this._element || target === this._titleElement) {
            // left mouse button
            if (event.button === 0) {
                // event.stopPropagation();
                this.notifyFocus();

                // middle mouse button
            } else if (event.button === 1 && this._componentItem.isClosable) {
                // event.stopPropagation();
                this.notifyClose();
            }
        }
    }

    /** @internal */
    private onTabTouchStart(event: TouchEvent) {
        if (event.target === this._element) {
            this.notifyFocus();
        }
    }

    /**
     * Callback when the tab's close button is clicked
     * @internal
     */
    private onCloseClick() {
        this.notifyClose();
    }

    /** @internal */
    private onCloseTouchStart() {
        this.notifyClose();
    }

    /**
     * Callback to capture tab close button mousedown
     * to prevent tab from activating.
     * @internal
     */
    // private onCloseMousedown(): void {
    //     // event.stopPropagation();
    // }

    /** @internal */
    private notifyClose() {
        if (this._closeEvent === undefined) {
            throw new UnexpectedUndefinedError('TNC15007');
        } else {
            this._closeEvent(this._componentItem);
        }
    }

    /** @internal */
    private notifyFocus() {
        if (this._focusEvent === undefined) {
            throw new UnexpectedUndefinedError('TNA15007');
        } else {
            this._focusEvent(this._componentItem);
        }
    }

    /** @internal */
    private enableReorder() {
        this._dragListener = new DragListener(this._element, [this._titleElement]);
        this._dragListener.on('dragStart', this._dragStartListener);
        this._componentItem.on('destroy', this._contentItemDestroyListener);
    }

    /** @internal */
    private disableReorder() {
        if (this._dragListener === undefined) {
            throw new UnexpectedUndefinedError('TDR87745');
        } else {
            this._componentItem.off('destroy', this._contentItemDestroyListener);
            this._dragListener.off('dragStart', this._dragStartListener);
            this._dragListener = undefined;
        }
    }
}

/** @public */
export namespace Tab {
    /** @internal */
    export type CloseEvent = (componentItem: ComponentItem) => void;
    /** @internal */
    export type FocusEvent = (componentItem: ComponentItem) => void;
    /** @internal */
    export type DragStartEvent = (x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) => void;
}
