import { HeaderButton } from '../controls/HeaderButton';
import { Tab } from '../controls/Tab';
import { UnexpectedNullError } from '../errors/error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { Stack } from '../items/Stack';
import { LayoutManager } from '../LayoutManager';
import { EventEmitter } from '../utils/EventEmitter';
import { Side } from '../utils/types';
import {
    createTemplateHtmlElement,
    fnBind, numberToPixels
} from '../utils/utils';

const _template = 
        '<div class="lm_header"> ' +
        '<ul class="lm_tabs"></ul> ' +
        '<ul class="lm_controls"></ul> ' +
        '<ul class="lm_tabdropdown_list"></ul> ' +
        '</div>';

/**
 * This class represents a header above a Stack ContentItem.
 *
 * @param {lm.LayoutManager} layoutManager
 * @param {AbstractContentItem} parent
 */
export class Header extends EventEmitter {
    readonly tabs: Tab[];
    readonly tabsMarkedForRemoval: Tab[];
    private _lastVisibleTabIndex: number;
    private _tabControlOffset: number;
    private _canDestroy: boolean;

    private _headerClickListener = (ev: MouseEvent) => this._onHeaderClick(ev);
    private _headerTouchStartListener = (ev: TouchEvent) => this._onHeaderTouchStart(ev);
    private _documentMouseUpListener = (ev: MouseEvent) => this.hideAdditionalTabsDropdown(ev);
    tabDropdownContainerElement: HTMLElement;
    tabsContainerElement: HTMLElement;
    controlsContainerElement: HTMLElement;
    closeButton: HeaderButton | null;
    dockButton: HeaderButton | null;
    tabDropdownButton: HeaderButton | null;

    protected get canDestroy(): boolean { return this._canDestroy; }

    activeContentItem: AbstractContentItem | null;
    element: HTMLElement;

    constructor(public layoutManager: LayoutManager, private parent: Stack, private _headerSettings: Header.Settings) {

        super();
        
        this.element = createTemplateHtmlElement(_template, 'div');

        if (this.layoutManager.config.settings.selectionEnabled === true) {
            this.element.classList.add('lm_selectable');
            this.element.addEventListener('click', this._headerClickListener);
            this.element.addEventListener('touchstart', this._headerTouchStartListener);
        }

        const tabsContainerElement = this.element.querySelector('.lm_tabs');
        if (tabsContainerElement === null) {
            throw new UnexpectedNullError('HCT21223');
        } else {
            this.tabsContainerElement = tabsContainerElement as HTMLElement;
            const tabDropdownContainerElement = this.element.querySelector('.lm_tabdropdown_list');
            if (tabDropdownContainerElement === null) {
                throw new UnexpectedNullError('HCTD21224');
            } else {
                this.tabDropdownContainerElement = tabDropdownContainerElement as HTMLElement;
                this.tabDropdownContainerElement.style.display = 'none';
                const controlsContainerElement = this.element.querySelector('.lm_controls');
                if (controlsContainerElement === null) {
                    throw new UnexpectedNullError('HCC21222');
                } else {
                    this.controlsContainerElement = controlsContainerElement as HTMLElement;
                    this.parent = parent;
                    this.parent.on('resize', this.updateTabSizes);
                    this.tabs = [];
                    this.tabsMarkedForRemoval = [];
                    this.activeContentItem = null;
                    this.closeButton = null;
                    this.dockButton = null;
                    this.tabDropdownButton = null;
                    globalThis.document.addEventListener('mouseup', this._documentMouseUpListener);

                    this._lastVisibleTabIndex = -1;
                    this._tabControlOffset = this.layoutManager.config.settings.tabControlOffset;
                    this._createControls();
                }
            }
        }
    }

    /**
     * Creates a new tab and associates it with a contentItem
     *
     * @param    contentItem
     * @param    index The position of the tab
     */
    createTab(contentItem: AbstractContentItem, index: number): void {
        //If there's already a tab relating to the
        //content item, don't do anything
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].contentItem === contentItem) {
                return;
            }
        }

        const tab = new Tab(this, contentItem);

        if (this.tabs.length === 0) {
            this.tabs.push(tab);
            this.tabsContainerElement.append(tab.element);
            return;
        }

        if (index === undefined) {
            index = this.tabs.length;
        }

        if (index > 0) {
            this.tabs[index - 1].element.after(tab.element);
        } else {
            this.tabs[0].element.before(tab.element);
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
            if (this.tabs[i].contentItem === contentItem) {
                this.tabs[i]._$destroy();
                this.tabs.splice(i, 1);
                return;
            }
        }

        for (let i = 0; i < this.tabsMarkedForRemoval.length; i++) {
            if (this.tabsMarkedForRemoval[i].contentItem === contentItem) {
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
            if (this.tabs[i].contentItem === contentItem) {
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
    setActiveContentItem(contentItem: AbstractContentItem): void {
        if (this.activeContentItem === contentItem) return;

        for (let i = 0; i < this.tabs.length; i++) {
            const isActive = this.tabs[i].contentItem === contentItem;
            this.tabs[i].setActive(isActive);
            if (isActive === true) {
                this.activeContentItem = contentItem;
                this.parent.config.activeItemIndex = i;
            }
        }

        if (this.layoutManager.config.settings.reorderOnTabMenuClick) {
            /**
             * If the tab selected was in the dropdown, move everything down one to make way for this one to be the first.
             * This will make sure the most used tabs stay visible.
             */
            if (this._lastVisibleTabIndex !== -1 && this.parent.config.activeItemIndex > this._lastVisibleTabIndex) {
                const activeTab = this.tabs[this.parent.config.activeItemIndex];
                for (let j = this.parent.config.activeItemIndex; j > 0; j--) {
                    this.tabs[j] = this.tabs[j - 1];
                }
                this.tabs[0] = activeTab;
                this.parent.config.activeItemIndex = 0;
            }
        }

        this.updateTabSizes();
        this.parent.emitBubblingEvent('stateChanged');
    }

    /**
     * Programmatically operate with header position.
     *
     * @param position one of ('top','left','right','bottom') to set or empty to get it.
     *
     * @returns previous header position
     */
    position(position: Side): Side {
        const previous = this._headerSettings.show;
        if (this.parent._docker && this.parent._docker.docked)
            throw new Error('Can\'t change header position in docked stack');
        if (previous && !this.parent._side)
            previous = 'top';
        if (position !== undefined && this._headerSettings.show != position) {
            this._headerSettings.show = position;
            this.parent.config.header ? this.parent.config.header.show = position : this.parent.config.header = { show: position };
            this.parent._setupHeaderPosition();
        }
        return previous;
    }

    /**
     * Programmatically set closability.
     *
     * @package private
     * @param {Boolean} isClosable Whether to enable/disable closability.
     *
     * @returns {Boolean} Whether the action was successful
     */
    _$setClosable(isClosable: boolean) {
        this._canDestroy = isClosable || this.tabs.length > 1;
        if (this.closeButton && this.isClosable()) {
            this.closeButton.element[isClosable ? "show" : "hide"]();
            return true;
        }

        return false;
    }

    /**
     * Programmatically set ability to dock.
     *
     * @package private
     * @param {Boolean} isDockable Whether to enable/disable ability to dock.
     *
     * @returns {Boolean} Whether the action was successful
     */
    _setDockable(isDockable) {
        if (this.dockButton && this.parent._header && this.parent._header.dock) {
            this.dockButton.element.toggle(!!isDockable);
            return true;
        }
        return false;
    }

    /**
     * Destroys the entire header
     */
    _$destroy(): void {
        this.emit('destroy');

        for (let i = 0; i < this.tabs.length; i++) {
            this.tabs[i]._$destroy();
        }
        globalThis.document.removeEventListener('mouseup', this._documentMouseUpListener);
        this.element.remove();
    }

    /**
     * get settings from header
     *
     * @returns {string} when exists
     */
    _getHeaderSetting(name) {
        if (name in this.parent._header)
            return this.parent._header[name];
    }

    /**
     * Creates the popout, maximise and close buttons in the header's top right corner
     *
     * @returns {void}
     */
    _createControls() {
        var closeStack,
            popout,
            label,
            maximiseLabel,
            minimiseLabel,
            maximise,
            maximiseButton,
            tabDropdownLabel,
            showTabDropdown;

        /**
         * Dropdown to show additional tabs.
         */
        showTabDropdown = fnBind(this.showAdditionalTabsDropdown, this);
        tabDropdownLabel = this.layoutManager.config.header.tabDropdown;
        this.tabDropdownButton = new HeaderButton(this, tabDropdownLabel, 'lm_tabdropdown', showTabDropdown);
        this.tabDropdownButton.element.hide();

        if (this.parent._header && this.parent._header.dock) {
            var button = fnBind(this.parent.dock, this.parent);
            label = this._getHeaderSetting('dock');
            this.dockButton = new HeaderButton(this, label, 'lm_dock', button);
        }

        /**
         * Popout control to launch component in new window.
         */
        const popoutButtonLabel = this._headerSettings.popoutLabel;
        if (popoutButtonLabel !== undefined) {
            popout = fnBind(this._onPopoutClick, this);
            new HeaderButton(this, popoutButtonLabel, 'lm_popout', popout);
        }

        /**
         * Maximise control - set the component to the full size of the layout
         */
        if (this._getHeaderSetting('maximise')) {
            maximise = fnBind(this.parent.toggleMaximise, this.parent);
            maximiseLabel = this._getHeaderSetting('maximise');
            minimiseLabel = this._getHeaderSetting('minimise');
            maximiseButton = new HeaderButton(this, maximiseLabel, 'lm_maximise', maximise);

            this.parent.on('maximised', function() {
                maximiseButton.element.attr('title', minimiseLabel);
            });

            this.parent.on('minimised', function() {
                maximiseButton.element.attr('title', maximiseLabel);
            });
        }

        /**
         * Close button
         */
        if (this.isClosable()) {
            closeStack = fnBind(this.parent.remove, this.parent);
            label = this._getHeaderSetting('close');
            this.closeButton = new HeaderButton(this, label, 'lm_close', closeStack);
        }
    }

    /**
     * Shows drop down for additional tabs when there are too many to display.
     */
    private showAdditionalTabsDropdown() {
        this.tabDropdownContainerElement.style.display = '';
    }

    /**
     * Hides drop down for additional tabs when there are too many to display.
     */
    private hideAdditionalTabsDropdown(ev: MouseEvent) {
        this.tabDropdownContainerElement.style.display = 'none';
    }

    /**
     * Checks whether the header is closable based on the parent config and
     * the global config.
     *
     * @returns Whether the header is closable.
     */
    isClosable(): boolean {
        return this.parent.config.isClosable && this.layoutManager.config.settings.showCloseIcon;
    }

    private _onPopoutClick(): void {
        if (this.layoutManager.config.settings.popoutWholeStack === true) {
            this.parent.popout();
        } else {
            this.activeContentItem.popout();
        }
    }

    /**
     * Invoked when the header's background is clicked (not it's tabs or controls)
     */
    private _onHeaderClick(event: MouseEvent) {
        if (event.target === this.element.childNodes[0]) {
            this.parent.select();
        }
    }

    /**
     * Invoked when the header's background is touched (not it's tabs or controls)
     */
    private _onHeaderTouchStart(event: TouchEvent) {
        if (event.target === this.element.childNodes[0]) {
            this.parent.select();
        }
    }

    /**
     * Pushes the tabs to the tab dropdown if the available space is not sufficient
     *
     * @returns {void}
     */
    private updateTabSizes(showTabMenu?: boolean) {
        if (this.tabs.length === 0) {
            return;
        }

        //Show the menu based on function argument
        this.tabDropdownButton.element.toggle(showTabMenu === true);

        var size = function(val) {
            return val ? 'width' : 'height';
        };
        this.element.css(size(!this.parent._sided), '');
        this.element[size(this.parent._sided)](this.layoutManager.config.dimensions.headerHeight);
        var availableWidth = this.element.outerWidth() - this.controlsContainerElement.outerWidth() - this._tabControlOffset,
            cumulativeTabWidth = 0,
            visibleTabWidth = 0,
            tabElement,
            i,
            j,
            marginLeft,
            overlap = 0,
            tabWidth,
            tabOverlapAllowance = this.layoutManager.config.settings.tabOverlapAllowance,
            tabOverlapAllowanceExceeded = false,
            activeIndex = (this.activeContentItem ? this.tabs.indexOf(this.activeContentItem.tab) : 0),
            activeTab = this.tabs[activeIndex];
        if (this.parent._sided)
            availableWidth = this.element.outerHeight() - this.controlsContainerElement.outerHeight() - this._tabControlOffset;
        this._lastVisibleTabIndex = -1;

        for (i = 0; i < this.tabs.length; i++) {
            tabElement = this.tabs[i].element;

            //Put the tab in the tabContainer so its true width can be checked
            this.tabsContainerElement.append(tabElement);
            tabWidth = tabElement.outerWidth() + parseInt(tabElement.css('margin-right'), 10);

            cumulativeTabWidth += tabWidth;

            //Include the active tab's width if it isn't already
            //This is to ensure there is room to show the active tab
            if (activeIndex <= i) {
                visibleTabWidth = cumulativeTabWidth;
            } else {
                visibleTabWidth = cumulativeTabWidth + activeTab.element.outerWidth() + parseInt(activeTab.element.css('margin-right'), 10);
            }

            // If the tabs won't fit, check the overlap allowance.
            if (visibleTabWidth > availableWidth) {

                //Once allowance is exceeded, all remaining tabs go to menu.
                if (!tabOverlapAllowanceExceeded) {

                    //No overlap for first tab or active tab
                    //Overlap spreads among non-active, non-first tabs
                    if (activeIndex > 0 && activeIndex <= i) {
                        overlap = (visibleTabWidth - availableWidth) / (i - 1);
                    } else {
                        overlap = (visibleTabWidth - availableWidth) / i;
                    }

                    //Check overlap against allowance.
                    if (overlap < tabOverlapAllowance) {
                        for (j = 0; j <= i; j++) {
                            marginLeft = (j !== activeIndex && j !== 0) ? '-' + numberToPixels(overlap) : '';
                            this.tabs[j].element.css({
                                'z-index': i - j,
                                'margin-left': marginLeft
                            });
                        }
                        this._lastVisibleTabIndex = i;
                        this.tabsContainerElement.append(tabElement);
                    } else {
                        tabOverlapAllowanceExceeded = true;
                    }

                } else if (i === activeIndex) {
                    //Active tab should show even if allowance exceeded. (We left room.)
                    tabElement.css({
                        'z-index': 'auto',
                        'margin-left': ''
                    });
                    this.tabsContainerElement.append(tabElement);
                }

                if (tabOverlapAllowanceExceeded && i !== activeIndex) {
                    if (showTabMenu) {
                        //Tab menu already shown, so we just add to it.
                        tabElement.css({
                            'z-index': 'auto',
                            'margin-left': ''
                        });
                        
                        this.tabDropdownContainerElement.append(tabElement);
                    } else {
                        //We now know the tab menu must be shown, so we have to recalculate everything.
                        this.updateTabSizes(true);
                        return;
                    }
                }

            } else {
                this._lastVisibleTabIndex = i;
                tabElement.css({
                    'z-index': 'auto',
                    'margin-left': ''
                });
                this.tabsContainerElement.append(tabElement);
            }
        }

    }
}

export namespace Header {
    export interface Settings {
        show: false | Side;
        popoutLabel: string | undefined;
        dockLabel: string | undefined;
        maximiseLabel: string | undefined;
        minimiseLabel: string | undefined;
        closeLabel: string | undefined;
        tabDropdownLabel: string | undefined;
    }

    export namespace Settings {
        export function resolveLabel(value: string | false): string | undefined {
            if (typeof value === 'boolean') {
                return undefined;
            } else {
                return value;
            }
        }
    }
}