import { HeaderButton } from '../controls/HeaderButton';
import { Tab } from '../controls/Tab';
import { UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { ComponentItem } from '../items/ComponentItem';
import { Stack } from '../items/Stack';
import { LayoutManager } from '../LayoutManager';
import { EventEmitter } from '../utils/EventEmitter';
import { Side } from '../utils/types';
import { createTemplateHtmlElement, numberToPixels, pixelsToNumber, setElementDisplayVisibility } from '../utils/utils';

/** @internal */
const _template = 
    '<div class="lm_header"> ' +
    '<ul class="lm_tabs"></ul> ' +
    '<ul class="lm_controls"></ul> ' +
    '<ul class="lm_tabdropdown_list"></ul> ' +
    '</div>';

/**
 * This class represents a header above a Stack ContentItem.
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
    private readonly _tabsMarkedForRemoval: Tab[] = [];

    /** @internal */
    private readonly _headerClickListener = (ev: MouseEvent) => this.onHeaderClick(ev);
    /** @internal */
    private readonly _headerTouchStartListener = (ev: TouchEvent) => this.onHeaderTouchStart(ev);
    /** @internal */
    private readonly _documentMouseUpListener = () => this.hideAdditionalTabsDropdown();

    /** @internal */
    private _lastVisibleTabIndex = -1;
    /** @internal */
    private _canDestroy: boolean;
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
    private _activeContentItem: ComponentItem | null = null;

    /** @internal */
    get canDestroy(): boolean { return this._canDestroy; }
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
    get activeContentItem(): ComponentItem | null { return this._activeContentItem; }
    get element(): HTMLElement { return this._element; }
    get tabsContainerElement(): HTMLElement { return this._tabsContainerElement; }
    /** @deprecated use {$@link tabsContainerElement} */
    get tabsContainer(): HTMLElement { return this._tabsContainerElement; }
    get controlsContainerElement(): HTMLElement { return this._controlsContainerElement; }
    /** @deprecated use {$@link controlsContainerElement} */
    get controlsContainer(): HTMLElement { return this._controlsContainerElement; }

    /** @internal */
    constructor(private _layoutManager: LayoutManager, private _parent: Stack,
        settings: Header.Settings, closeEvent: Header.CloseEvent) {

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

        this._element = createTemplateHtmlElement(_template);

        if (this._layoutManager.config.settings.selectionEnabled === true) {
            this._element.classList.add('lm_selectable');
            this._element.addEventListener('click', this._headerClickListener);
            this._element.addEventListener('touchstart', this._headerTouchStartListener);
        }

        const tabsContainerElement = this._element.querySelector('.lm_tabs');
        if (tabsContainerElement === null) {
            throw new UnexpectedNullError('HCT21223');
        } else {
            this._tabsContainerElement = tabsContainerElement as HTMLElement;
            const tabDropdownContainerElement = this._element.querySelector('.lm_tabdropdown_list');
            if (tabDropdownContainerElement === null) {
                throw new UnexpectedNullError('HCTD21224');
            } else {
                this._tabDropdownContainerElement = tabDropdownContainerElement as HTMLElement;
                this._tabDropdownContainerElement.style.display = 'none';
                const controlsContainerElement = this._element.querySelector('.lm_controls');
                if (controlsContainerElement === null) {
                    throw new UnexpectedNullError('HCC21222');
                } else {
                    this._controlsContainerElement = controlsContainerElement as HTMLElement;
                    this._parent = _parent;
                    this._parent.on('resize', () => this.updateTabSizes());
                    globalThis.document.addEventListener('mouseup', this._documentMouseUpListener);

                    this._tabControlOffset = this._layoutManager.config.settings.tabControlOffset;
                    this.createControls(closeEvent);
                }
            }
        }
    }

    /**
     * Creates a new tab and associates it with a contentItem
     * @param index The position of the tab
     */
    createTab(component: ComponentItem, index: number): void {
        //If there's already a tab relating to the
        //content item, don't do anything
        for (let i = 0; i < this._tabs.length; i++) {
            if (this._tabs[i].componentItem === component) {
                return;
            }
        }

        const tab = new Tab(component, this);

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
     * @param    {AbstractContentItem} contentItem
     */
    removeTab(contentItem: AbstractContentItem): void {
        for (let i = 0; i < this._tabs.length; i++) {
            if (this._tabs[i].componentItem === contentItem) {
                this._tabs[i].destroy();
                this._tabs.splice(i, 1);
                return;
            }
        }

        for (let i = 0; i < this._tabsMarkedForRemoval.length; i++) {
            if (this._tabsMarkedForRemoval[i].componentItem === contentItem) {
                this._tabsMarkedForRemoval[i].destroy();
                this._tabsMarkedForRemoval.splice(i, 1);
                return;
            }
        }


        throw new Error('contentItem is not controlled by this header');
    }

    /**
     * Finds a tab based on the contentItem its associated with and marks it
     * for removal, hiding it too.
     * @internal
     */
    hideTab(contentItem: AbstractContentItem): void {
        for (let i = 0; i < this._tabs.length; i++) {
            if (this._tabs[i].componentItem === contentItem) {
                this._tabs[i].element.style.display = 'none';
                this._tabsMarkedForRemoval.push(this._tabs[i])
                this._tabs.splice(i, 1);
                return;
            }
        }        

        throw new Error('contentItem is not controlled by this header');
    }

    /**
     * The programmatical equivalent of clicking a Tab.
     */
    setActiveContentItem(contentItem: ComponentItem): void {
        if (this._activeContentItem === contentItem) return;

        for (let i = 0; i < this._tabs.length; i++) {
            const isActive = this._tabs[i].componentItem === contentItem;
            this._tabs[i].setActive(isActive);
            if (isActive === true) {
                this._activeContentItem = contentItem;
                this._parent.stackConfig.activeItemIndex = i;
            }
        }

        if (this._layoutManager.config.settings.reorderOnTabMenuClick) {
            /**
             * If the tab selected was in the dropdown, move everything down one to make way for this one to be the first.
             * This will make sure the most used tabs stay visible.
             */
            if (this._lastVisibleTabIndex !== -1 && this._parent.stackConfig.activeItemIndex > this._lastVisibleTabIndex) {
                const activeTab = this._tabs[this._parent.stackConfig.activeItemIndex];
                for (let j = this._parent.stackConfig.activeItemIndex; j > 0; j--) {
                    this._tabs[j] = this._tabs[j - 1];
                }
                this._tabs[0] = activeTab;
                this._parent.stackConfig.activeItemIndex = 0;
            }
        }

        this.updateTabSizes();
        this._parent.emitBubblingEvent('stateChanged');
    }

    /** @internal */
    setSide(value: Side): void {
        this._side = value;
        this._leftRightSided = [Side.right, Side.left].includes(this._side);
    }

    /**
     * Programmatically set closability.
     * @param isClosable Whether to enable/disable closability.
     * @returns Whether the action was successful
     * @internal
     */
    setClosable(isClosable: boolean): boolean {
        this._canDestroy = isClosable || this._tabs.length > 1;
        if (this._closeButton !== null && this.isClosable()) {
            setElementDisplayVisibility(this._closeButton.element, isClosable);
            return true;
        }

        return false;
    }

    /**
     * Checks whether the header is closable based on the parent config and
     * the global config.
     * @returns Whether the header is closable.
     * @internal
     */
    isClosable(): boolean {
        return this._parent.config.isClosable && this._layoutManager.config.settings.showCloseIcon;
    }

    /**
     * Programmatically set ability to dock.
     * @param isDockable Whether to enable/disable ability to dock.
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

    /**
     * Destroys the entire header
     * @internal
     */
    destroy(): void {
        this.emit('destroy');

        for (let i = 0; i < this._tabs.length; i++) {
            this._tabs[i].destroy();
        }
        globalThis.document.removeEventListener('mouseup', this._documentMouseUpListener);
        this._element.remove();
    }

    /**
     * Creates the popout, maximise and close buttons in the header's top right corner
     * @internal
     */
    private createControls(closeEvent: Header.CloseEvent) {
        /**
         * Dropdown to show additional tabs.
         */
        this._tabDropdownButton = new HeaderButton(this, this._tabDropdownLabel, 'lm_tabdropdown', () => this.showAdditionalTabsDropdown());
        setElementDisplayVisibility(this._tabDropdownButton.element, false);

        if (this._dockEnabled) {
            this._dockButton = new HeaderButton(this, this._dockLabel, 'lm_dock', () => this.onDockClick());
        }

        /**
         * Popout control to launch component in new window.
         */
        if (this._popoutEnabled) {
            new HeaderButton(this, this._popoutLabel, 'lm_popout', () => this.onPopoutClick());
        }

        /**
         * Maximise control - set the component to the full size of the layout
         */
        if (this._maximiseEnabled) {
            const maximiseButton = new HeaderButton(this, this._maximiseLabel, 'lm_maximise', (ev) => this._parent.toggleMaximise(ev));

            this._parent.on('maximised', () => maximiseButton.element.setAttribute('title', this._minimiseLabel) );
            this._parent.on('minimised', () => maximiseButton.element.setAttribute('title', this._maximiseLabel) );
        }

        /**
         * Close button
         */
        if (this.isClosable()) {
            this._closeButton = new HeaderButton(this, this._closeLabel, 'lm_close', closeEvent);
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
    private onDockClick() {
        this._parent.dock();
    }

    /** @internal */
    private onPopoutClick() {
        if (this._layoutManager.config.settings.popoutWholeStack) {
            this._parent.popout();
        } else {
            if (this._activeContentItem === null) {
                throw new UnexpectedNullError('HOPC70222');
            } else {
                this._activeContentItem.popout();
            }
        }
    }

    /**
     * Invoked when the header's background is clicked (not it's tabs or controls)
     * @internal
     */
    private onHeaderClick(event: MouseEvent) {
        if (event.target === this._element.childNodes[0]) {
            this._parent.select();
        }
    }

    /**
     * Invoked when the header's background is touched (not it's tabs or controls)
     * @internal
     */
    private onHeaderTouchStart(event: TouchEvent) {
        if (event.target === this._element.childNodes[0]) {
            this._parent.select();
        }
    }

    /**
     * Pushes the tabs to the tab dropdown if the available space is not sufficient
     * @internal
     */
    private updateTabSizes(showTabMenu?: boolean) {
        if (this._tabs.length === 0) {
            return;
        }

        //Show the menu based on function argument
        if (this._tabDropdownButton === null) {
            throw new UnexpectedNullError('HUTSTN13311');
        }
        setElementDisplayVisibility(this._tabDropdownButton.element, showTabMenu === true);

        if (this._leftRightSided) {
            this._element.style.height = '';
            this._element.style.width = numberToPixels(this._layoutManager.config.dimensions.headerHeight);
        } else {
            this._element.style.width = '';
            this._element.style.height = numberToPixels(this._layoutManager.config.dimensions.headerHeight);
        }
        let availableWidth = this._element.offsetWidth - this._controlsContainerElement.offsetWidth - this._tabControlOffset;
        let cumulativeTabWidth = 0;
        let tabOverlapAllowanceExceeded = false;
        const tabOverlapAllowance = this._layoutManager.config.settings.tabOverlapAllowance;
        const activeIndex = (this._activeContentItem ? this._tabs.indexOf(this._activeContentItem.tab as Tab) : 0);
        const activeTab = this._tabs[activeIndex];
        if (this._leftRightSided) {
            availableWidth = this._element.offsetHeight - this._controlsContainerElement.offsetHeight - this._tabControlOffset;
        }
        this._lastVisibleTabIndex = -1;

        for (let i = 0; i < this._tabs.length; i++) {
            const tabElement = this._tabs[i].element;

            //Put the tab in the tabContainer so its true width can be checked
            this._tabsContainerElement.appendChild(tabElement);
            const tabWidth = tabElement.offsetWidth + pixelsToNumber(tabElement.style.marginRight);

            cumulativeTabWidth += tabWidth;

            //Include the active tab's width if it isn't already
            //This is to ensure there is room to show the active tab
            let visibleTabWidth = 0;
            if (activeIndex <= i) {
                visibleTabWidth = cumulativeTabWidth;
            } else {
                visibleTabWidth = cumulativeTabWidth + activeTab.element.offsetWidth + pixelsToNumber(activeTab.element.style.marginRight);
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
                        this._tabsContainerElement.appendChild(tabElement);
                    } else {
                        tabOverlapAllowanceExceeded = true;
                    }

                } else if (i === activeIndex) {
                    //Active tab should show even if allowance exceeded. (We left room.)
                    tabElement.style.zIndex = 'auto';
                    tabElement.style.marginLeft = '';
                    this._tabsContainerElement.appendChild(tabElement);
                }

                if (tabOverlapAllowanceExceeded && i !== activeIndex) {
                    if (showTabMenu) {
                        //Tab menu already shown, so we just add to it.
                        tabElement.style.zIndex = 'auto';
                        tabElement.style.marginLeft = '';
                        
                        this._tabDropdownContainerElement.appendChild(tabElement);
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
                this._tabsContainerElement.appendChild(tabElement);
            }
        }

    }
}

/** @internal */
export namespace Header {
    export type CloseEvent = (this: void) => void;

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