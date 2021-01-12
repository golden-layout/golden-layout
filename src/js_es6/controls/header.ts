import { AssertError, UnexpectedNullError, UnexpectedUndefinedError } from '../errors/internal-error';
import { ComponentItem } from '../items/component-item';
import { ContentItem } from '../items/content-item';
import { Stack } from '../items/stack';
import { LayoutManager } from '../layout-manager';
import { DomConstants } from '../utils/dom-constants';
import { DragListener } from '../utils/drag-listener';
import { EventEmitter } from '../utils/event-emitter';
import { Side } from '../utils/types';
import { numberToPixels, pixelsToNumber, setElementDisplayVisibility } from '../utils/utils';
import { HeaderButton } from './header-button';
import { Tab } from './tab';

/**
 * This class represents a header above a Stack ContentItem.
 * @public
 */
export class Header extends EventEmitter {
    /** @internal */
    private readonly _element: HTMLElement;
    /** @internal */
    private readonly _controlsContainerElement: HTMLElement;
    /** @internal */
    private readonly _tabDropdownContainerElement: HTMLElement;
    /** @internal */
    private readonly _tabsContainerElement: HTMLElement;

    /** @internal */
    private readonly _show: boolean;
    /** @internal */
    private readonly _popoutEnabled: boolean;
    /** @internal */
    private readonly _popoutLabel: string;
    /** @internal */
    private readonly _dockEnabled: boolean;
    /** @internal */
    private readonly _dockLabel: string;
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
    private readonly _tabs: Tab[] = [];

    /** @internal */
    private readonly _clickListener = (ev: MouseEvent) => this.onClick(ev);
    /** @internal */
    private readonly _touchStartListener = (ev: TouchEvent) => this.onTouchStart(ev);
    /** @internal */
    private readonly _documentMouseUpListener = () => this.hideAdditionalTabsDropdown();

    /** @internal */
    private _lastVisibleTabIndex = -1;
    /** @internal */
    private _rowColumnClosable = true;
    /** @internal */
    private _canRemoveComponent: boolean;
    /** @internal */
    private _side: Side;
    /** @internal */
    private _leftRightSided: boolean;
    /** @internal */
    private _closeButton: HeaderButton | null = null;
    /** @internal */
    private _dockButton: HeaderButton | null = null;
    /** @internal */
    private _tabDropdownButton: HeaderButton | null = null;
    /** @internal */
    private _maximiseButton: HeaderButton | undefined;
    /** @internal */
    private _activeComponentItem: ComponentItem | null = null; // only used to identify active tab

    /** @internal */
    get show(): boolean { return this._show; }
    /** @internal */
    get side(): Side { return this._side; }
    /** @internal */
    get leftRightSided(): boolean { return this._leftRightSided; }
    /** @internal */
    get dockEnabled(): boolean { return this._dockEnabled; }

    get layoutManager(): LayoutManager { return this._layoutManager; }
    get parent(): Stack { return this._parent; }
    get tabs(): Tab[] { return this._tabs; }
    /**
     * Caution: Returns active Tab but not necessarily Stack.activeComponentItem
     * Active Tab may not equal Stack.activeContentItem if Header.setActiveContentItem() is used
     * @deprecated use {@link (Stack:class).getActiveComponentItem} */
    get activeContentItem(): ContentItem | null {
        if (this._activeComponentItem === undefined) {
            return null;
        } else {
            return this._activeComponentItem;
        }
    }
    get element(): HTMLElement { return this._element; }
    get tabsContainerElement(): HTMLElement { return this._tabsContainerElement; }
    /** @deprecated use {@link (Header:class).tabsContainerElement} */
    get tabsContainer(): HTMLElement { return this._tabsContainerElement; }
    get controlsContainerElement(): HTMLElement { return this._controlsContainerElement; }
    /** @deprecated use {@link (Header:class).controlsContainerElement} */
    get controlsContainer(): HTMLElement { return this._controlsContainerElement; }

    /** @internal */
    constructor(private _layoutManager: LayoutManager,
        private _parent: Stack,
        settings: Header.Settings,
        private readonly _configClosable: boolean,
        closeEvent: Header.CloseEvent,
        private _dockEvent: Header.DockEvent | undefined,
        private _popoutEvent: Header.PopoutEvent | undefined,
        private _maximiseToggleEvent: Header.MaximiseToggleEvent | undefined,
        private _clickEvent: Header.ClickEvent | undefined,
        private _touchStartEvent: Header.TouchStartEvent | undefined,
        private _componentRemoveEvent: Header.ComponentRemoveEvent | undefined,
        private _componentFocusEvent: Header.ComponentFocusEvent | undefined,
        private _componentDragStartEvent: Header.ComponentDragStartEvent | undefined,
        private _stateChangedEvent: Header.StateChangedEvent | undefined,
    ) {
        super();
        
        this._show = settings.show;
        this._popoutEnabled = settings.popoutEnabled;
        this._popoutLabel = settings.popoutLabel;
        this._dockEnabled = settings.dockEnabled;
        this._dockLabel = settings.dockLabel;
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
        this._tabsContainerElement = document.createElement('section');
        this._tabsContainerElement.classList.add(DomConstants.ClassName.Tabs);
        this._controlsContainerElement = document.createElement('section');
        this._controlsContainerElement.classList.add(DomConstants.ClassName.Controls);
        this._tabDropdownContainerElement = document.createElement('section');
        this._tabDropdownContainerElement.classList.add(DomConstants.ClassName.TabDropdownList);
        this._tabDropdownContainerElement.style.display = 'none';
        this._element.appendChild(this._tabsContainerElement);
        this._element.appendChild(this._controlsContainerElement);
        this._element.appendChild(this._tabDropdownContainerElement);

        this._element.addEventListener('click', this._clickListener, { passive: true });
        this._element.addEventListener('touchstart', this._touchStartListener, { passive: true });

        globalThis.document.addEventListener('mouseup', this._documentMouseUpListener, { passive: true });

        this._tabControlOffset = this._layoutManager.layoutConfig.settings.tabControlOffset;
        this.createControls(closeEvent);
    }

    /**
     * Destroys the entire header
     * @internal
     */
    destroy(): void {
        this.emit('destroy');

        this._dockEvent = undefined;
        this._popoutEvent = undefined;
        this._maximiseToggleEvent = undefined;
        this._clickEvent = undefined;
        this._touchStartEvent = undefined;
        this._componentRemoveEvent = undefined;
        this._componentFocusEvent = undefined;
        this._componentDragStartEvent = undefined;

        for (let i = 0; i < this._tabs.length; i++) {
            this._tabs[i].destroy();
        }
        globalThis.document.removeEventListener('mouseup', this._documentMouseUpListener);
        this._element.remove();
    }

    /**
     * Creates a new tab and associates it with a contentItem
     * @param index - The position of the tab
     */
    createTab(componentItem: ComponentItem, index: number): void {
        //If there's already a tab relating to the
        //content item, don't do anything
        for (let i = 0; i < this._tabs.length; i++) {
            if (this._tabs[i].componentItem === componentItem) {
                return;
            }
        }

        const tab = new Tab(this._layoutManager,
            componentItem,
            (item) => this.handleTabCloseEvent(item),
            (item) => this.handleTabFocusEvent(item),
            (x, y, dragListener, item) => this.handleTabDragStartEvent(x, y, dragListener, item));

        if (this._tabs.length === 0) {
            this._tabs.push(tab);
            this._tabsContainerElement.appendChild(tab.element);
            return;
        }

        if (index === undefined) {
            index = this._tabs.length;
        }

        if (index > 0) {
            this._tabs[index - 1].element.insertAdjacentElement('afterend', tab.element);
        } else {
            this._tabs[0].element.insertAdjacentElement('beforebegin', tab.element);
        }

        this._tabs.splice(index, 0, tab);
        this.updateTabSizes();
    }

    /**
     * Finds a tab based on the contentItem its associated with and removes it.
     * @param componentItem -
     */
    removeTab(componentItem: ContentItem): void {
        for (let i = 0; i < this._tabs.length; i++) {
            if (this._tabs[i].componentItem === componentItem) {
                const tab = this._tabs[i];
                if (componentItem === this._activeComponentItem) {
                    this._activeComponentItem = null;
                }
                tab.destroy();
                this._tabs.splice(i, 1);
                this.notifyStateChanged();
                return;
            }
        }

        throw new Error('contentItem is not controlled by this header');
    }

    /**
     * Caution: Will not change Stack ActiveContentItem
     * @deprecated use {@link (Stack:class).setActiveComponentItem}
     */
    setActiveContentItem(item: ContentItem): void {
        if (!ContentItem.isComponentItem(item)) {
            throw new Error('Header.setActiveContentItem: item is not a ComponentItem');
        } else {
            this.setActiveComponentItem(item);
        }
    }
    /**
     * The programmatical equivalent of clicking a Tab.
     * @internal
     */
    setActiveComponentItem(item: ComponentItem): void {
        if (this._activeComponentItem !== item) {
            let activeIndex = -1;
            for (let i = 0; i < this._tabs.length; i++) {
                const isActive = this._tabs[i].componentItem === item;
                this._tabs[i].setActive(isActive);
                if (isActive === true) {
                    this._activeComponentItem = item;
                    activeIndex = i;
                }
            }

            if (activeIndex < 0) {
                throw new AssertError('HSACI56632');
            } else {
                if (this._layoutManager.layoutConfig.settings.reorderOnTabMenuClick) {
                    /**
                     * If the tab selected was in the dropdown, move everything down one to make way for this one to be the first.
                     * This will make sure the most used tabs stay visible.
                     */
                    if (this._lastVisibleTabIndex !== -1 && activeIndex > this._lastVisibleTabIndex) {
                        const activeTab = this._tabs[activeIndex];
                        for (let j = activeIndex; j > 0; j--) {
                            this._tabs[j] = this._tabs[j - 1];
                        }
                        this._tabs[0] = activeTab;
                    }
                }

                this.updateTabSizes();
                this.notifyStateChanged();
            }
        }
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
                    const tab = this._tabs[i];
                    const item = tab.componentItem;
                    if (!item.isClosable) {
                        isClosable = false;
                        break;
                    }
                }
            }

            if (this._closeButton !== null) {
                setElementDisplayVisibility(this._closeButton.element, isClosable);
            }
        }

        this._canRemoveComponent = isClosable || this._tabs.length > 1;
    }


    /**
     * Programmatically set ability to dock.
     * @param isDockable - Whether to enable/disable ability to dock.
     * @returns Whether the action was successful
     * @internal
     */
    setDockable(isDockable: boolean): boolean {
        if (this._dockButton !== null && this._dockEnabled) {
            setElementDisplayVisibility(this._dockButton.element, isDockable);
            return true;
        }
        return false;
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
    updateTabSizes(showTabMenu?: boolean): void {
        if (this._tabs.length === 0) {
            return;
        }

        //Show the menu based on function argument
        if (this._tabDropdownButton === null) {
            throw new UnexpectedNullError('HUTSTN13311');
        }
        setElementDisplayVisibility(this._tabDropdownButton.element, showTabMenu === true);

        const headerHeight = this._show ? this._layoutManager.layoutConfig.dimensions.headerHeight : 0;

        if (this._leftRightSided) {
            this._element.style.height = '';
            this._element.style.width = numberToPixels(headerHeight);
        } else {
            this._element.style.width = '';
            this._element.style.height = numberToPixels(headerHeight);
        }
        let availableWidth = this._element.offsetWidth - this._controlsContainerElement.offsetWidth - this._tabControlOffset;
        let cumulativeTabWidth = 0;
        let tabOverlapAllowanceExceeded = false;
        const tabOverlapAllowance = this._layoutManager.layoutConfig.settings.tabOverlapAllowance;
        const activeIndex = (this._activeComponentItem ? this._tabs.indexOf(this._activeComponentItem.tab) : 0);
        const activeTab = this._tabs[activeIndex];
        if (this._leftRightSided) {
            availableWidth = this._element.offsetHeight - this._controlsContainerElement.offsetHeight - this._tabControlOffset;
        }
        this._lastVisibleTabIndex = -1;

        for (let i = 0; i < this._tabs.length; i++) {
            const tabElement = this._tabs[i].element;

            //Put the tab in the tabContainer so its true width can be checked
            if (tabElement.parentElement !== this._tabsContainerElement) {
                this._tabsContainerElement.appendChild(tabElement);
            }
            const tabMarginRightPixels = getComputedStyle(activeTab.element).marginRight;
            const tabMarginRight = pixelsToNumber(tabMarginRightPixels);
            const tabWidth = tabElement.offsetWidth + tabMarginRight;

            cumulativeTabWidth += tabWidth;

            //Include the active tab's width if it isn't already
            //This is to ensure there is room to show the active tab
            let visibleTabWidth = 0;
            if (activeIndex <= i) {
                visibleTabWidth = cumulativeTabWidth;
            } else {
                const activeTabMarginRightPixels = getComputedStyle(activeTab.element).marginRight;
                const activeTabMarginRight = pixelsToNumber(activeTabMarginRightPixels);
                visibleTabWidth = cumulativeTabWidth + activeTab.element.offsetWidth + activeTabMarginRight;
            }

            // If the tabs won't fit, check the overlap allowance.
            if (visibleTabWidth > availableWidth) {

                //Once allowance is exceeded, all remaining tabs go to menu.
                if (!tabOverlapAllowanceExceeded) {

                    //No overlap for first tab or active tab
                    //Overlap spreads among non-active, non-first tabs
                    let overlap: number;
                    if (activeIndex > 0 && activeIndex <= i) {
                        overlap = (visibleTabWidth - availableWidth) / (i - 1);
                    } else {
                        overlap = (visibleTabWidth - availableWidth) / i;
                    }

                    //Check overlap against allowance.
                    if (overlap < tabOverlapAllowance) {
                        for (let j = 0; j <= i; j++) {
                            const marginLeft = (j !== activeIndex && j !== 0) ? '-' + numberToPixels(overlap) : '';
                            this._tabs[j].element.style.zIndex = numberToPixels(i - j);
                            this._tabs[j].element.style.marginLeft = marginLeft;
                        }
                        this._lastVisibleTabIndex = i;
                        if (tabElement.parentElement !== this._tabsContainerElement) {
                            this._tabsContainerElement.appendChild(tabElement);
                        }
                    } else {
                        tabOverlapAllowanceExceeded = true;
                    }

                } else if (i === activeIndex) {
                    //Active tab should show even if allowance exceeded. (We left room.)
                    tabElement.style.zIndex = 'auto';
                    tabElement.style.marginLeft = '';
                    if (tabElement.parentElement !== this._tabsContainerElement) {
                        this._tabsContainerElement.appendChild(tabElement);
                    }
                }

                if (tabOverlapAllowanceExceeded && i !== activeIndex) {
                    if (showTabMenu) {
                        //Tab menu already shown, so we just add to it.
                        tabElement.style.zIndex = 'auto';
                        tabElement.style.marginLeft = '';
                        
                        if (tabElement.parentElement !== this._tabDropdownContainerElement) {
                            this._tabDropdownContainerElement.appendChild(tabElement);
                        }
                    } else {
                        //We now know the tab menu must be shown, so we have to recalculate everything.
                        this.updateTabSizes(true);
                        return;
                    }
                }

            } else {
                this._lastVisibleTabIndex = i;
                tabElement.style.zIndex = 'auto';
                tabElement.style.marginLeft = '';
                if (tabElement.parentElement !== this._tabsContainerElement) {
                    this._tabsContainerElement.appendChild(tabElement);
                }
            }
        }
    }

    /** @internal */
    private handleTabCloseEvent(componentItem: ComponentItem) {
        if (this._canRemoveComponent) {
            if (this._componentRemoveEvent === undefined) {
                throw new UnexpectedUndefinedError('HHTCE22294');
            } else {
                this._componentRemoveEvent(componentItem);
            }
        }
    }

    /** @internal */
    private handleTabFocusEvent(componentItem: ComponentItem) {
        if (this._componentFocusEvent === undefined) {
            throw new UnexpectedUndefinedError('HHTAE22294');
        } else {
            this._componentFocusEvent(componentItem);
        }
    }

    /** @internal */
    private handleTabDragStartEvent(x: number, y: number, dragListener: DragListener, componentItem: ComponentItem) {
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

    /**
     * Creates the popout, maximise and close buttons in the header's top right corner
     * @internal
     */
    private createControls(closeEvent: Header.CloseEvent) {
        /**
         * Dropdown to show additional tabs.
         */
        this._tabDropdownButton = new HeaderButton(this, this._tabDropdownLabel, DomConstants.ClassName.TabDropdown,
            () => this.showAdditionalTabsDropdown()
        );
        setElementDisplayVisibility(this._tabDropdownButton.element, false);

        if (this._dockEnabled) {
            this._dockButton = new HeaderButton(this, this._dockLabel, DomConstants.ClassName.Dock, () => this.handleButtonDockEvent());
        }

        /**
         * Popout control to launch component in new window.
         */
        if (this._popoutEnabled) {
            new HeaderButton(this, this._popoutLabel, DomConstants.ClassName.Popout, () => this.handleButtonPopoutEvent());
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
    }

    /**
     * Shows drop down for additional tabs when there are too many to display.
     * @internal
     */
    private showAdditionalTabsDropdown() {
        this._tabDropdownContainerElement.style.display = '';
    }

    /**
     * Hides drop down for additional tabs when there are too many to display.
     * @internal
     */
    private hideAdditionalTabsDropdown() {
        this._tabDropdownContainerElement.style.display = 'none';
    }

    /** @internal */
    private handleButtonDockEvent() {
        if (this._dockEvent === undefined) {
            throw new UnexpectedUndefinedError('HHBDE17834');
        } else {
            this._dockEvent();
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
            if (this._activeComponentItem === null) {
                throw new UnexpectedNullError('HOPC70222');
            } else {
                this._activeComponentItem.popout();
            }
        }
    }

    /** @internal */
    private handleButtonMaximiseToggleEvent(ev: Event) {
        if (this._maximiseToggleEvent === undefined) {
            throw new UnexpectedUndefinedError('HHBMTE16834');
        } else {
            this._maximiseToggleEvent(ev);
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

    /** @internal */
    private notifyStateChanged() {
        if (this._stateChangedEvent === undefined) {
            throw new UnexpectedUndefinedError('HNSCBE66834');
        } else {
            this._stateChangedEvent();
        }
    }
}

/** @public */
export namespace Header {
    /** @internal */
    export type CloseEvent = (this: void) => void;
    /** @internal */
    export type DockEvent = (this: void) => void;
    /** @internal */
    export type PopoutEvent = (this: void) => void;
    /** @internal */
    export type MaximiseToggleEvent = (this: void, ev: Event) => void;
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
        dockEnabled: boolean;
        dockLabel: string;
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