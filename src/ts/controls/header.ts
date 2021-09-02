import { UnexpectedUndefinedError } from '../errors/internal-error';
import { ComponentItem } from '../items/component-item';
import { ContentItem } from '../items/content-item';
import { Stack } from '../items/stack';
import { LayoutManager } from '../layout-manager';
import { DomConstants } from '../utils/dom-constants';
import { DragListener } from '../utils/drag-listener';
import { EventEmitter } from '../utils/event-emitter';
import { Side } from '../utils/types';
import { numberToPixels, setElementDisplayVisibility } from '../utils/utils';
import { HeaderButton } from './header-button';
import { Tab } from './tab';
import { TabsContainer } from './tabs-container';

/**
 * This class represents a header above a Stack ContentItem.
 * @public
 */
export class Header extends EventEmitter {
    /** @internal */
    private readonly _tabsContainer: TabsContainer;
    /** @internal */
    private readonly _element: HTMLElement;
    /** @internal */
    private readonly _controlsContainerElement: HTMLElement;

    /** @internal */
    private readonly _show: boolean;
    /** @internal */
    private readonly _popoutEnabled: boolean;
    /** @internal */
    private readonly _popoutLabel: string;
    /** @internal */
    private readonly _maximiseEnabled: boolean;
    /** @internal */
    private readonly _maximiseLabel: string;
    /** @internal */
    private readonly _minimiseEnabled: boolean;
    /** @internal */
    private readonly _minimiseLabel: string;
    /** @internal */
    private readonly _closeEnabled: boolean;
    /** @internal */
    private readonly _closeLabel: string;
    /** @internal */
    private readonly _tabDropdownEnabled: boolean;
    /** @internal */
    private readonly _tabDropdownLabel: string;

    /** @internal */
    private readonly _tabControlOffset: number;

    /** @internal */
    private readonly _clickListener = (ev: MouseEvent) => this.onClick(ev);
    /** @internal */
    private readonly _touchStartListener = (ev: TouchEvent) => this.onTouchStart(ev);
    /** @internal */
    private readonly _documentMouseUpListener: (this: void) => void;

    /** @internal */
    private _rowColumnClosable = true;
    /** @internal */
    private _canRemoveComponent: boolean;
    /** @internal */
    private _side: Side;
    /** @internal */
    private _leftRightSided: boolean;
    /** @internal */
    private readonly _closeButton: HeaderButton | null = null;
    /** @internal */
    private readonly _popoutButton: HeaderButton | null = null;
    /** @internal */
    private readonly _tabDropdownButton: HeaderButton;
    /** @internal */
    private readonly _maximiseButton: HeaderButton | undefined;
    // /** @internal */
    // private _activeComponentItem: ComponentItem | null = null; // only used to identify active tab

    /** @internal */
    get show(): boolean { return this._show; }
    /** @internal */
    get side(): Side { return this._side; }
    /** @internal */
    get leftRightSided(): boolean { return this._leftRightSided; }

    get layoutManager(): LayoutManager { return this._layoutManager; }
    get parent(): Stack { return this._parent; }
    get tabs(): Tab[] { return this._tabsContainer.tabs; }
    get lastVisibleTabIndex(): number { return this._tabsContainer.lastVisibleTabIndex; }
    /**
     * @deprecated use {@link (Stack:class).getActiveComponentItem} */
    get activeContentItem(): ContentItem | null {
        const activeComponentItem = this._getActiveComponentItemEvent();
        if (activeComponentItem === undefined) {
            return null;
        } else {
            return activeComponentItem;
        }
    }
    get element(): HTMLElement { return this._element; }
    /** @deprecated use {@link (Header:class).tabsContainerElement} */
    get tabsContainer(): HTMLElement { return this._tabsContainer.element; }
    get tabsContainerElement(): HTMLElement { return this._tabsContainer.element; }
    get controlsContainerElement(): HTMLElement { return this._controlsContainerElement; }
    /** @deprecated use {@link (Header:class).controlsContainerElement} */
    get controlsContainer(): HTMLElement { return this._controlsContainerElement; }

    /** @internal */
    constructor(
        /** @internal */
        private _layoutManager: LayoutManager,
        /** @internal */
        private _parent: Stack,
        settings: Header.Settings,
        /** @internal */
        private readonly _configClosable: boolean,
        /** @internal */
        private _getActiveComponentItemEvent: Header.GetActiveComponentItemEvent,
        closeEvent: Header.CloseEvent,
        /** @internal */
        private _popoutEvent: Header.PopoutEvent | undefined,
        /** @internal */
        private _maximiseToggleEvent: Header.MaximiseToggleEvent | undefined,
        /** @internal */
        private _clickEvent: Header.ClickEvent | undefined,
        /** @internal */
        private _touchStartEvent: Header.TouchStartEvent | undefined,
        /** @internal */
        private _componentRemoveEvent: Header.ComponentRemoveEvent | undefined,
        /** @internal */
        private _componentFocusEvent: Header.ComponentFocusEvent | undefined,
        /** @internal */
        private _componentDragStartEvent: Header.ComponentDragStartEvent | undefined,
    ) {
        super();

        this._tabsContainer = new TabsContainer(this._layoutManager,
            (item) => this.handleTabInitiatedComponentRemoveEvent(item),
            (item) => this.handleTabInitiatedComponentFocusEvent(item),
            (x, y, dragListener, item) => this.handleTabInitiatedDragStartEvent(x, y, dragListener, item),
            () => this.processTabDropdownActiveChanged(),
        );

        this._show = settings.show;
        this._popoutEnabled = settings.popoutEnabled;
        this._popoutLabel = settings.popoutLabel;
        this._maximiseEnabled = settings.maximiseEnabled;
        this._maximiseLabel = settings.maximiseLabel;
        this._minimiseEnabled = settings.minimiseEnabled;
        this._minimiseLabel = settings.minimiseLabel;
        this._closeEnabled = settings.closeEnabled;
        this._closeLabel = settings.closeLabel;
        this._tabDropdownEnabled = settings.tabDropdownEnabled;
        this._tabDropdownLabel = settings.tabDropdownLabel;
        this.setSide(settings.side);

        this._canRemoveComponent = this._configClosable;

        this._element = document.createElement('section');
        this._element.classList.add(DomConstants.ClassName.Header);
        this._controlsContainerElement = document.createElement('section');
        this._controlsContainerElement.classList.add(DomConstants.ClassName.Controls);
        this._element.appendChild(this._tabsContainer.element);
        this._element.appendChild(this._controlsContainerElement);
        this._element.appendChild(this._tabsContainer.dropdownElement);

        this._element.addEventListener('click', this._clickListener, { passive: true });
        this._element.addEventListener('touchstart', this._touchStartListener, { passive: true });

        this._documentMouseUpListener = () => this._tabsContainer.hideAdditionalTabsDropdown()
        globalThis.document.addEventListener('mouseup', this._documentMouseUpListener, { passive: true });

        this._tabControlOffset = this._layoutManager.layoutConfig.settings.tabControlOffset;

        if (this._tabDropdownEnabled) {
            this._tabDropdownButton = new HeaderButton(this, this._tabDropdownLabel, DomConstants.ClassName.TabDropdown,
                () => this._tabsContainer.showAdditionalTabsDropdown()
            );
        }

        if (this._popoutEnabled) {
            this._popoutButton = new HeaderButton(this, this._popoutLabel, DomConstants.ClassName.Popout, () => this.handleButtonPopoutEvent());
        }

        /**
         * Maximise control - set the component to the full size of the layout
         */
        if (this._maximiseEnabled) {
            this._maximiseButton = new HeaderButton(this, this._maximiseLabel, DomConstants.ClassName.Maximise,
                (ev) => this.handleButtonMaximiseToggleEvent(ev)
            );
        }

        /**
         * Close button
         */
        if (this._configClosable) {
            this._closeButton = new HeaderButton(this, this._closeLabel, DomConstants.ClassName.Close, () => closeEvent());
        }

        this.processTabDropdownActiveChanged();
    }

    /**
     * Destroys the entire header
     * @internal
     */
    destroy(): void {
        this.emit('destroy');

        this._popoutEvent = undefined;
        this._maximiseToggleEvent = undefined;
        this._clickEvent = undefined;
        this._touchStartEvent = undefined;
        this._componentRemoveEvent = undefined;
        this._componentFocusEvent = undefined;
        this._componentDragStartEvent = undefined;

        this._tabsContainer.destroy();

        globalThis.document.removeEventListener('mouseup', this._documentMouseUpListener);
        this._element.remove();
    }

    /**
     * Creates a new tab and associates it with a contentItem
     * @param index - The position of the tab
     * @internal
     */
    createTab(componentItem: ComponentItem, index: number): void {
        this._tabsContainer.createTab(componentItem, index);
    }

    /**
     * Finds a tab based on the contentItem its associated with and removes it.
     * Cannot remove tab if it has the active ComponentItem
     * @internal
     */
    removeTab(componentItem: ComponentItem): void {
        this._tabsContainer.removeTab(componentItem);
    }

    /** @internal */
    processActiveComponentChanged(newActiveComponentItem: ComponentItem): void {
        this._tabsContainer.processActiveComponentChanged(newActiveComponentItem);
        this.updateTabSizes();
    }

    /** @internal */
    setSide(value: Side): void {
        this._side = value;
        this._leftRightSided = [Side.right, Side.left].includes(this._side);
    }

    /**
     * Programmatically set closability.
     * @param value - Whether to enable/disable closability.
     * @returns Whether the action was successful
     * @internal
     */
    setRowColumnClosable(value: boolean): void {
        this._rowColumnClosable = value;
        this.updateClosability();
    }

    /**
     * Updates the header's closability. If a stack/header is able
     * to close, but has a non closable component added to it, the stack is no
     * longer closable until all components are closable.
     * @internal
     */
    updateClosability(): void {
        let isClosable: boolean;
        if (!this._configClosable) {
            isClosable = false;
        } else {
            if (!this._rowColumnClosable) {
                isClosable = false;
            } else {
                isClosable = true;
                const len = this.tabs.length;
                for (let i = 0; i < len; i++) {
                    const tab = this._tabsContainer.tabs[i];
                    const item = tab.componentItem;
                    if (!item.isClosable) {
                        isClosable = false;
                        break;
                    }
                }
            }
        }

        if (this._closeButton !== null) {
            setElementDisplayVisibility(this._closeButton.element, isClosable);
        }
        if (this._popoutButton !== null) {
            setElementDisplayVisibility(this._popoutButton.element, isClosable);
        }

        this._canRemoveComponent = isClosable || this._tabsContainer.tabCount > 1;
    }

    /** @internal */
    applyFocusedValue(value: boolean): void {
        if (value) {
            this._element.classList.add(DomConstants.ClassName.Focused);
        } else {
            this._element.classList.remove(DomConstants.ClassName.Focused);
        }
    }

    /** @internal */
    processMaximised(): void {
        if (this._maximiseButton === undefined) {
            throw new UnexpectedUndefinedError('HPMAX16997');
        } else {
            this._maximiseButton.element.setAttribute('title', this._minimiseLabel);
        }
    }

    /** @internal */
    processMinimised(): void {
        if (this._maximiseButton === undefined) {
            throw new UnexpectedUndefinedError('HPMIN16997');
        } else {
            this._maximiseButton.element.setAttribute('title', this._maximiseLabel);
        }
    }

    /**
     * Pushes the tabs to the tab dropdown if the available space is not sufficient
     * @internal
     */
    updateTabSizes(): void {
        if (this._tabsContainer.tabCount > 0) {
            const headerHeight = this._show ? this._layoutManager.layoutConfig.dimensions.headerHeight : 0;

            if (this._leftRightSided) {
                this._element.style.height = '';
                this._element.style.width = numberToPixels(headerHeight);
            } else {
                this._element.style.width = '';
                this._element.style.height = numberToPixels(headerHeight);
            }
            let availableWidth: number;
            if (this._leftRightSided) {
                availableWidth = this._element.offsetHeight - this._controlsContainerElement.offsetHeight - this._tabControlOffset;
            } else {
                availableWidth = this._element.offsetWidth - this._controlsContainerElement.offsetWidth - this._tabControlOffset;
            }

            this._tabsContainer.updateTabSizes(availableWidth, this._getActiveComponentItemEvent());
        }
    }

    /** @internal */
    private handleTabInitiatedComponentRemoveEvent(componentItem: ComponentItem) {
        if (this._canRemoveComponent) {
            if (this._componentRemoveEvent === undefined) {
                throw new UnexpectedUndefinedError('HHTCE22294');
            } else {
                this._componentRemoveEvent(componentItem);
            }
        }
    }

    /** @internal */
    private handleTabInitiatedComponentFocusEvent(componentItem: ComponentItem) {
        if (this._componentFocusEvent === undefined) {
            throw new UnexpectedUndefinedError('HHTAE22294');
        } else {
            this._componentFocusEvent(componentItem);
        }
    }

    /** @internal */
    private handleTabInitiatedDragStartEvent(x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) {
        if (!this._canRemoveComponent) {
            dragListener.cancelDrag();
        } else {
            if (this._componentDragStartEvent === undefined) {
                throw new UnexpectedUndefinedError('HHTDSE22294');
            } else {
                this._componentDragStartEvent(x, y, dragListener, componentItem);
            }
        }
    }

    /** @internal */
    private processTabDropdownActiveChanged() {
        if (this._tabDropdownButton !== undefined) {
            setElementDisplayVisibility(this._tabDropdownButton.element, this._tabsContainer.dropdownActive);
        }
    }

    /** @internal */
    private handleButtonPopoutEvent() {
        if (this._layoutManager.layoutConfig.settings.popoutWholeStack) {
            if (this._popoutEvent === undefined) {
                throw new UnexpectedUndefinedError('HHBPOE17834');
            } else {
                this._popoutEvent();
            }
        } else {
            const activeComponentItem = this._getActiveComponentItemEvent();
            if (activeComponentItem) {
                activeComponentItem.popout();
            }
            // else: if the stack is empty there won't be an active item (and nothing to popout)
        }
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private handleButtonMaximiseToggleEvent(ev: Event) {
        if (this._maximiseToggleEvent === undefined) {
            throw new UnexpectedUndefinedError('HHBMTE16834');
        } else {
            this._maximiseToggleEvent();
        }
    }

    /**
     * Invoked when the header's background is clicked (not it's tabs or controls)
     * @internal
     */
    private onClick(event: MouseEvent) {
        if (event.target === this._element) {
            this.notifyClick(event);
        }
    }

    /**
     * Invoked when the header's background is touched (not it's tabs or controls)
     * @internal
     */
    private onTouchStart(event: TouchEvent) {
        if (event.target === this._element) {
            this.notifyTouchStart(event);
        }
    }

    /** @internal */
    private notifyClick(ev: MouseEvent) {
        if (this._clickEvent === undefined) {
            throw new UnexpectedUndefinedError('HNHC46834');
        } else {
            this._clickEvent(ev);
        }
    }

    /** @internal */
    private notifyTouchStart(ev: TouchEvent) {
        if (this._touchStartEvent === undefined) {
            throw new UnexpectedUndefinedError('HNHTS46834');
        } else {
            this._touchStartEvent(ev);
        }
    }
}

/** @public */
export namespace Header {
    /** @internal */
    export type GetActiveComponentItemEvent = (this: void) => ComponentItem | undefined;
    /** @internal */
    export type CloseEvent = (this: void) => void;
    /** @internal */
    export type PopoutEvent = (this: void) => void;
    /** @internal */
    export type MaximiseToggleEvent = (this: void) => void;
    /** @internal */
    export type ClickEvent = (this: void, ev: MouseEvent) => void;
    /** @internal */
    export type TouchStartEvent = (this: void, ev: TouchEvent) => void;
    /** @internal */
    export type ComponentRemoveEvent = (this: void, componentItem: ComponentItem) => void;
    /** @internal */
    export type ComponentFocusEvent = (this: void, componentItem: ComponentItem) => void;
    /** @internal */
    export type ComponentDragStartEvent = (this: void, x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) => void;
    /** @internal */
    export type StateChangedEvent = (this: void) => void;

    /** @internal */
    export interface Settings {
        show: boolean;
        side: Side;
        popoutEnabled: boolean;
        popoutLabel: string;
        maximiseEnabled: boolean;
        maximiseLabel: string;
        minimiseEnabled: boolean;
        minimiseLabel: string;
        closeEnabled: boolean;
        closeLabel: string;
        tabDropdownEnabled: boolean;
        tabDropdownLabel: string;
    }
}
