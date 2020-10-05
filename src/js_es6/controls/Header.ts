import { StackItemConfig } from '../config/config';
import { HeaderButton } from '../controls/HeaderButton';
import { Tab } from '../controls/Tab';
import { UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { Component } from '../items/Component';
import { LayoutManager } from '../LayoutManager';
import { EventEmitter } from '../utils/EventEmitter';
import { Side } from '../utils/types';
import { createTemplateHtmlElement, numberToPixels, pixelsToNumber, setElementDisplayVisibility } from '../utils/utils';

const _template = 
    '<div class="lm_header"> ' +
    '<ul class="lm_tabs"></ul> ' +
    '<ul class="lm_controls"></ul> ' +
    '<ul class="lm_tabdropdown_list"></ul> ' +
    '</div>';

/**
 * This class represents a header above a Stack ContentItem.
 */
export class Header extends EventEmitter implements Tab.Header, HeaderButton.Header {
    private _element: HTMLElement;
    readonly tabs: Tab[];
    readonly tabsMarkedForRemoval: Tab[];
    private _lastVisibleTabIndex: number;
    private _tabControlOffset: number;
    private _canDestroy: boolean;

    private _show: boolean;
    private _side: Side;
    private _leftRightSided: boolean;
    private _popoutEnabled: boolean;
    private _popoutLabel: string;
    private _dockEnabled: boolean;
    private _dockLabel: string;
    private _maximiseEnabled: boolean;
    private _maximiseLabel: string;
    private _minimiseEnabled: boolean;
    private _minimiseLabel: string;
    private _closeEnabled: boolean;
    private _closeLabel: string;
    private _tabDropdownEnabled: boolean;
    private _tabDropdownLabel: string;

    private _headerClickListener = (ev: MouseEvent) => this.onHeaderClick(ev);
    private _headerTouchStartListener = (ev: TouchEvent) => this.onHeaderTouchStart(ev);
    private _documentMouseUpListener = () => this.hideAdditionalTabsDropdown();
    private _tabDropdownContainerElement: HTMLElement;
    private _tabsContainerElement: HTMLElement;
    private _closeButton: HeaderButton | null;
    private _dockButton: HeaderButton | null;
    private _tabDropdownButton: HeaderButton | null;

    readonly controlsContainerElement: HTMLElement;
    activeContentItem: Component | null;

    get parent(): Header.Parent { return this._parent; }
    get canDestroy(): boolean { return this._canDestroy; }
    get element(): HTMLElement { return this._element; }
    get show(): boolean { return this._show; }
    get side(): Side { return this._side; }
    get leftRightSided(): boolean { return this._leftRightSided; }
    get dockEnabled(): boolean { return this._dockEnabled; }

    constructor(public layoutManager: LayoutManager, private _parent: Header.Parent,
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

        if (this.layoutManager.config.settings.selectionEnabled === true) {
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
                    this.controlsContainerElement = controlsContainerElement as HTMLElement;
                    this._parent = _parent;
                    this._parent.on('resize', this.updateTabSizes);
                    this.tabs = [];
                    this.tabsMarkedForRemoval = [];
                    this.activeContentItem = null;
                    this._closeButton = null;
                    this._dockButton = null;
                    this._tabDropdownButton = null;
                    globalThis.document.addEventListener('mouseup', this._documentMouseUpListener);

                    this._lastVisibleTabIndex = -1;
                    this._tabControlOffset = this.layoutManager.config.settings.tabControlOffset;
                    this.createControls(closeEvent);
                }
            }
        }
    }

    /**
     * Creates a new tab and associates it with a contentItem
     *
     * @param    component
     * @param    index The position of the tab
     */
    createTab(component: Component, index: number): void {
        //If there's already a tab relating to the
        //content item, don't do anything
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].component === component) {
                return;
            }
        }

        const tab = new Tab(component, this);

        if (this.tabs.length === 0) {
            this.tabs.push(tab);
            this._tabsContainerElement.appendChild(tab.element);
            return;
        }

        if (index === undefined) {
            index = this.tabs.length;
        }

        if (index > 0) {
            this.tabs[index - 1].element.insertAdjacentElement('afterend', tab.element);
        } else {
            this.tabs[0].element.insertAdjacentElement('beforebegin', tab.element);
        }

        this.tabs.splice(index, 0, tab);
        this.updateTabSizes();
    }

    /**
     * Finds a tab based on the contentItem its associated with and removes it.
     *
     * @param    {AbstractContentItem} contentItem
     */
    removeTab(contentItem: AbstractContentItem): void {
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].component === contentItem) {
                this.tabs[i]._$destroy();
                this.tabs.splice(i, 1);
                return;
            }
        }

        for (let i = 0; i < this.tabsMarkedForRemoval.length; i++) {
            if (this.tabsMarkedForRemoval[i].component === contentItem) {
                this.tabsMarkedForRemoval[i]._$destroy();
                this.tabsMarkedForRemoval.splice(i, 1);
                return;
            }
        }


        throw new Error('contentItem is not controlled by this header');
    }

    /**
     * Finds a tab based on the contentItem its associated with and marks it
     * for removal, hiding it too.
     */
    hideTab(contentItem: AbstractContentItem): void {
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].component === contentItem) {
                this.tabs[i].element.style.display = 'none';
                this.tabsMarkedForRemoval.push(this.tabs[i])
                this.tabs.splice(i, 1);
                return;
            }
        }        

        throw new Error('contentItem is not controlled by this header');
    }

    /**
     * The programmatical equivalent of clicking a Tab.
     */
    setActiveContentItem(contentItem: Component): void {
        if (this.activeContentItem === contentItem) return;

        for (let i = 0; i < this.tabs.length; i++) {
            const isActive = this.tabs[i].component === contentItem;
            this.tabs[i].setActive(isActive);
            if (isActive === true) {
                this.activeContentItem = contentItem;
                this._parent.stackConfig.activeItemIndex = i;
            }
        }

        if (this.layoutManager.config.settings.reorderOnTabMenuClick) {
            /**
             * If the tab selected was in the dropdown, move everything down one to make way for this one to be the first.
             * This will make sure the most used tabs stay visible.
             */
            if (this._lastVisibleTabIndex !== -1 && this._parent.stackConfig.activeItemIndex > this._lastVisibleTabIndex) {
                const activeTab = this.tabs[this._parent.stackConfig.activeItemIndex];
                for (let j = this._parent.stackConfig.activeItemIndex; j > 0; j--) {
                    this.tabs[j] = this.tabs[j - 1];
                }
                this.tabs[0] = activeTab;
                this._parent.stackConfig.activeItemIndex = 0;
            }
        }

        this.updateTabSizes();
        this._parent.emitBubblingEvent('stateChanged');
    }

    setSide(value: Side): void {
        this._side = value;
        this._leftRightSided = [Side.right, Side.left].includes(this._side);
    }

    /**
     * Programmatically set closability.
     *
     * @param isClosable Whether to enable/disable closability.
     *
     * @returns Whether the action was successful
     */
    setClosable(isClosable: boolean): boolean {
        this._canDestroy = isClosable || this.tabs.length > 1;
        if (this._closeButton !== null && this.isClosable()) {
            setElementDisplayVisibility(this._closeButton.element, isClosable);
            return true;
        }

        return false;
    }

    /**
     * Checks whether the header is closable based on the parent config and
     * the global config.
     *
     * @returns Whether the header is closable.
     */
    isClosable(): boolean {
        return this._parent.config.isClosable && this.layoutManager.config.settings.showCloseIcon;
    }

    /**
     * Programmatically set ability to dock.
     * @param isDockable Whether to enable/disable ability to dock.
     * @returns Whether the action was successful
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
     */
    destroy(): void {
        this.emit('destroy');

        for (let i = 0; i < this.tabs.length; i++) {
            this.tabs[i]._$destroy();
        }
        globalThis.document.removeEventListener('mouseup', this._documentMouseUpListener);
        this._element.remove();
    }

    /**
     * Creates the popout, maximise and close buttons in the header's top right corner
     */
    private createControls(closeEvent: Header.CloseEvent) {
        /**
         * Dropdown to show additional tabs.
         */
        this._tabDropdownButton = new HeaderButton(this, this._tabDropdownLabel, 'lm_tabdropdown', () => this.showAdditionalTabsDropdown);
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
            const maximiseButton = new HeaderButton(this, this._maximiseLabel, 'lm_maximise', () => this._parent.toggleMaximise());

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
     */
    private showAdditionalTabsDropdown() {
        this._tabDropdownContainerElement.style.display = '';
    }

    /**
     * Hides drop down for additional tabs when there are too many to display.
     */
    private hideAdditionalTabsDropdown() {
        this._tabDropdownContainerElement.style.display = 'none';
    }

    private onDockClick() {
        this._parent.dock();
    }

    private onPopoutClick() {
        if (this.layoutManager.config.settings.popoutWholeStack) {
            this._parent.popout();
        } else {
            if (this.activeContentItem === null) {
                throw new UnexpectedNullError('HOPC70222');
            } else {
                this.activeContentItem.popout();
            }
        }
    }

    /**
     * Invoked when the header's background is clicked (not it's tabs or controls)
     */
    private onHeaderClick(event: MouseEvent) {
        if (event.target === this._element.childNodes[0]) {
            this._parent.select();
        }
    }

    /**
     * Invoked when the header's background is touched (not it's tabs or controls)
     */
    private onHeaderTouchStart(event: TouchEvent) {
        if (event.target === this._element.childNodes[0]) {
            this._parent.select();
        }
    }

    /**
     * Pushes the tabs to the tab dropdown if the available space is not sufficient
     */
    private updateTabSizes(showTabMenu?: boolean) {
        if (this.tabs.length === 0) {
            return;
        }

        //Show the menu based on function argument
        if (this._tabDropdownButton === null) {
            throw new UnexpectedNullError('HUTSTN13311');
        }
        setElementDisplayVisibility(this._tabDropdownButton.element, showTabMenu === true);

        if (this._leftRightSided) {
            this._element.style.height = '';
            this._element.style.width = numberToPixels(this.layoutManager.config.dimensions.headerHeight);
        } else {
            this._element.style.width = '';
            this._element.style.height = numberToPixels(this.layoutManager.config.dimensions.headerHeight);
        }
        let availableWidth = this._element.offsetWidth - this.controlsContainerElement.offsetWidth - this._tabControlOffset;
        let cumulativeTabWidth = 0;
        let tabOverlapAllowanceExceeded = false;
        const tabOverlapAllowance = this.layoutManager.config.settings.tabOverlapAllowance;
        const activeIndex = (this.activeContentItem ? this.tabs.indexOf(this.activeContentItem.tab as Tab) : 0);
        const activeTab = this.tabs[activeIndex];
        if (this._leftRightSided) {
            availableWidth = this._element.offsetHeight - this.controlsContainerElement.offsetHeight - this._tabControlOffset;
        }
        this._lastVisibleTabIndex = -1;

        for (let i = 0; i < this.tabs.length; i++) {
            const tabElement = this.tabs[i].element;

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
                            this.tabs[j].element.style.zIndex = numberToPixels(i - j);
                            this.tabs[j].element.style.marginLeft = marginLeft;
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

    // Stack
    export interface Parent extends Tab.Header.Parent {
        readonly stackConfig: StackItemConfig;
        dock(): void;
        toggleMaximise(): void;
    }
}