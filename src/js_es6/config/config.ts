import { Json } from '../utils/utils';

export interface ItemConfig {
    /**
     * The type of the item. Possible values are 'row', 'column', 'stack', 'component' and 'react-component'.
     */
    type: ItemConfig.Type;

    /**
     * An array of configurations for items that will be created as children of this item.
     */
    content?: ItemConfig[];

    /**
     * The width of this item, relative to the other children of its parent in percent
     */
    width?: number;

    /**
     * The height of this item, relative to the other children of its parent in percent
     */
    height?: number;

    /**
     * A String or an Array of Strings. Used to retrieve the item using item.getItemsById()
     */
    id?: string | string[];

    /**
     * Determines if the item is closable. If false, the x on the items tab will be hidden and container.close()
     * will return false
     * Default: true
     */
    isClosable?: boolean;

    /**
     * The title of the item as displayed on its tab and on popout windows
     * Default: componentName or ''
     */
    title?: string;

    /**
     * Default: true
     */
    reorderEnabled: boolean;
}

export namespace ItemConfig {
    export const enum Type {
        'row',
        'column',
        'stack',
        'component',
        'react-component'
    }

    export const defaults: ItemConfig = {
        type: Type.stack, // not really default but need something
        isClosable: true,
        reorderEnabled: true,
        title: ''
    }
}

export interface ComponentConfig extends ItemConfig {
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    componentName: string;
}

export namespace ComponentConfig {
    export function isReact(config: ComponentConfig): config is ReactComponentConfig {
        return config.type === ItemConfig.Type["react-component"];
    }
    export function isJson(config: ComponentConfig): config is JsonComponentConfig {
        return config.type === ItemConfig.Type.component;
    }
}

export interface JsonComponentConfig extends ComponentConfig {
    /**
     * A serialisable object. Will be passed to the component constructor function and will be the value returned by
     * container.getState().
     */
    componentState?: Json;
}

export interface ReactComponentConfig extends ComponentConfig {
    /**
     * Properties that will be passed to the component and accessible using this.props.
     */
    props?: unknown;
}

export interface ItemRootConfig {
    content?: ItemConfig[];
}

export interface PopoutConfig extends ItemRootConfig {
    parentId: string;
    indexInParent: number;
    dimensions: PopoutConfig.Dimensions;
}

export namespace PopoutConfig {
    export interface Dimensions {
        width: number | null,
        height: number | null,
        left: number | null,
        top: number | null,
    }
}

export interface Config extends ItemRootConfig {
    componentName: string;
    openPopouts: PopoutConfig[];
    dimensions?: Config.Dimensions;
    settings?: Config.Settings;
    labels?: Config.Labels;
}

export interface ExtendibleConfig extends Config {
    [name: string]: unknown;
}

export namespace Config {
    export interface Settings {
        /**
         * Turns headers on or off. If false, the layout will be displayed with splitters only.
         * Default: true
         */
        hasHeaders?: boolean;

        /**
         * Constrains the area in which items can be dragged to the layout's container. Will be set to false
         * automatically when layout.createDragSource() is called.
         * Default: true
         */
        constrainDragToContainer?: boolean;

        /**
         * If true, the user can re-arrange the layout by dragging items by their tabs to the desired location.
         * Default: true
         */
        reorderEnabled?: boolean;

        /**
         * If true, the user can select items by clicking on their header. This sets the value of layout.selectedItem to
         * the clicked item, highlights its header and the layout emits a 'selectionChanged' event.
         * Default: false
         */
        selectionEnabled?: boolean;

        /**
         * Decides what will be opened in a new window if the user clicks the popout icon. If true the entire stack will
         * be transferred to the new window, if false only the active component will be opened.
         * Default: false
         */
        popoutWholeStack?: boolean;

        /**
         * Specifies if an error is thrown when a popout is blocked by the browser (e.g. by opening it programmatically).
         * If false, the popout call will fail silently.
         * Default: true
         */
        blockedPopoutsThrowError?: boolean;

        /**
         * Specifies if all popouts should be closed when the page that created them is closed. Popouts don't have a
         * strong dependency on their parent and can exist on their own, but can be quite annoying to close by hand. In
         * addition, any changes made to popouts won't be stored after the parent is closed.
         * Default: true
         */
        closePopoutsOnUnload?: boolean;

        /**
         * Specifies if the popout icon should be displayed in the header-bar.
         * Default: true
         */
        showPopoutIcon?: boolean;

        /**
         * Specifies if the maximise icon should be displayed in the header-bar.
         * Default: true
         */
        showMaximiseIcon?: boolean;

        /**
         * Specifies if the close icon should be displayed in the header-bar.
         * Default: true
         */
        showCloseIcon?: boolean;

        /**
         * Specifies Responsive Mode (more info needed).
         * Default: onload
         */
        responsiveMode: Settings.ResponsiveMode;

        /**
         * Specifies Maximum pixel overlap per tab.
         * Default: 0
         */
        tabOverlapAllowance: number;

        /**
         * 
         * Default: true
         */
        reorderOnTabMenuClick: boolean;

        /**
         * @default Settings.tabControlOffset
         * Default: 10
         */
        tabControlOffset: number;
    }

    export namespace Settings {
        export const enum ResponsiveMode {
            'none',
            'always',
            'onload',
        }

        export const defaults: Settings = {
            hasHeaders: true,
            constrainDragToContainer: true,
            reorderEnabled: true,
            selectionEnabled: false,
            popoutWholeStack: false,
            blockedPopoutsThrowError: true,
            closePopoutsOnUnload: true,
            showPopoutIcon: true,
            showMaximiseIcon: true,
            showCloseIcon: true,
            responsiveMode: Settings.ResponsiveMode.onload,
            tabOverlapAllowance: 0,
            reorderOnTabMenuClick: true,
            tabControlOffset: 10
        }
    }

    export interface Dimensions {
        /**
         * The width of the borders between the layout items in pixel. Please note: The actual draggable area is wider
         * than the visible one, making it safe to set this to small values without affecting usability.
         * Default: 5
         */
        borderWidth?: number;

        /**
         * Default: 15
         */
        borderGrabWidth?: number,

        /**
         * The minimum height an item can be resized to (in pixel).
         * Default: 10
         */
        minItemHeight?: number;

        /**
         * The minimum width an item can be resized to (in pixel).
         * Default: 10
         */
        minItemWidth?: number;

        /**
         * The height of the header elements in pixel. This can be changed, but your theme's header css needs to be
         * adjusted accordingly.
         * Default: 20
         */
        headerHeight?: number;

        /**
         * The width of the element that appears when an item is dragged (in pixel).
         * Default: 300
         */
        dragProxyWidth?: number;

        /**
         * The height of the element that appears when an item is dragged (in pixel).
         * Default: 200
         */
        dragProxyHeight?: number;
    }

    export namespace Dimensions {
        export const defaults: Dimensions = {
            borderWidth: 5,
            borderGrabWidth: 15,
            minItemHeight: 10,
            minItemWidth: 10,
            headerHeight: 20,
            dragProxyWidth: 300,
            dragProxyHeight: 200
        }
    }

    export interface Labels {
        /**
         * The tooltip text that appears when hovering over the close icon.
         * Default: 'close'
         */
        close?: string;

        /**
         * The tooltip text that appears when hovering over the maximise icon.
         * Default: 'maximise'
         */
        maximise?: string;

        /**
         * The tooltip text that appears when hovering over the minimise icon.
         * Default: 'minimise'
         */
        minimise?: string;

        /**
         * The tooltip text that appears when hovering over the popin icon.
         * Default: 'pop in'
         */
        popin?: string;

        /**
         * The tooltip text that appears when hovering over the popout icon.
         * Default: 'open in new window'
         */
        popout?: string;

        /**
         * 
         * Default: 'additional tabs'
         */
        tabDropdown?: string;
    }

    export namespace Labels {
        export const defaults: Labels = {
            close: 'close',
            maximise: 'maximise',
            minimise: 'minimise',
            popout: 'open in new window',
            popin: 'pop in',
            tabDropdown: 'additional tabs'
        }
    }

    export const defaultConfig: Config = {
        componentName: '',
        openPopouts: [],
        settings: Settings.defaults,
        dimensions: Dimensions.defaults,
        labels: Labels.defaults,
    };
}
