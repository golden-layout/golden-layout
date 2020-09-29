import { JsonValue, Side } from '../utils/types';
import { Config, HeaderedItemConfig, ItemConfig, JsonComponentConfig, ManagerConfig, PopoutManagerConfig, ReactComponentConfig, StackItemConfig } from './config';

export interface UserItemConfig {
    /**
     * The type of the item. Possible values are 'row', 'column', 'stack', 'component' and 'react-component'.
     */
    type: ItemConfig.Type;

    /**
     * An array of configurations for items that will be created as children of this item.
     */
    content?: UserItemConfig[];

    /**
     * The width of this item, relative to the other children of its parent in percent
     */
    width?: number;

    /**
     * The minimum width of this item in pixels
     * CAUTION - Not tested - do not use
     */
    minWidth?: number;

    /**
     * The height of this item, relative to the other children of its parent in percent
     */
    height?: number;

    /**
     * The minimum height of this item in pixels
     * CAUTION - Not tested - do not use
     */
    minHeight?: number;

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
    reorderEnabled?: boolean;

    activeItemIndex?: number;
}

export namespace UserItemConfig {
    export function resolve(user: UserItemConfig): ItemConfig {
        switch (user.type) {
            case ItemConfig.Type.root:
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                const result: ItemConfig = {
                    type: user.type,
                    content: UserItemConfig.resolveContent(user.content),
                    width: user.width ?? defaults.width,
                    minWidth: user.width ?? defaults.minWidth,
                    height: user.height ?? defaults.height,
                    minHeight: user.height ?? defaults.minHeight,
                    id: user.id ?? defaults.id,
                    isClosable: user.isClosable ?? defaults.isClosable,
                    reorderEnabled: user.reorderEnabled ?? defaults.reorderEnabled,
                    title: user.title ?? defaults.title,
                    activeItemIndex: user.activeItemIndex ?? defaults.activeItemIndex,
                }
                return result;

            case ItemConfig.Type.stack:
                return UserStackItemConfig.resolve(user as UserHeaderedItemConfig);

            case ItemConfig.Type.component:
                return UserJsonComponentConfig.resolve(user as UserJsonComponentConfig);

            case ItemConfig.Type['react-component']:
                return UserReactComponentConfig.resolve(user as UserReactComponentConfig);

            default:
                const neverUserType: never = user.type;
                throw new Error(`UserItemConfig.resolve: Unreachable Type: ${neverUserType}`);
        }
    }

    export function resolveContent(content: UserItemConfig[] | undefined): ItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const result = new Array<ItemConfig>(count);
            for (let i = 0; i < count; i++) {
                result[i] = UserItemConfig.resolve(content[i]);
            }
            return result;
        }
    }

    export const defaults: ItemConfig = {
        type: ItemConfig.Type.stack, // not really default but need something
        content: [],
        width: 50,
        minWidth: 0,
        height: 50,
        minHeight: 0,
        id: '',
        isClosable: true,
        reorderEnabled: true,
        title: '',
        activeItemIndex: -1,
    }

    export function isRoot(config: UserItemConfig): config is UserItemConfig {
        return config.type === ItemConfig.Type.root;
    }
    export function isRow(config: UserItemConfig): config is UserItemConfig {
        return config.type === ItemConfig.Type.row;
    }
    export function isColumn(config: UserItemConfig): config is UserItemConfig {
        return config.type === ItemConfig.Type.column;
    }
    export function isStack(config: UserItemConfig): config is UserItemConfig {
        return config.type === ItemConfig.Type.stack;
    }
    export function isJson(config: UserItemConfig): config is UserJsonComponentConfig {
        return config.type === ItemConfig.Type.component;
    }
    export function isReact(config: UserItemConfig): config is UserReactComponentConfig {
        return config.type === ItemConfig.Type["react-component"];
    }
}

// Stack or Component
export interface UserHeaderedItemConfig extends UserItemConfig {
    /** @deprecated use Header.show instead */
    hasHeaders?: boolean;
    header?: UserHeaderedItemConfig.Header;
}

namespace UserHeaderedItemConfig {
    export interface Header {
        show?: false | Side;
        popout?: false | string;
        dock?: false | string;
        maximise?: false | string;
        close?: string;
        minimise?: string;
        tabDropdown?: false | string;
    }

    export namespace Header {
        export function resolve(userHeader: Header | undefined, hasHeaders: boolean | undefined): HeaderedItemConfig.Header | undefined {
            if (userHeader === undefined && hasHeaders === undefined) {
                return undefined;
            } else {
                const result: HeaderedItemConfig.Header = {
                    show: userHeader?.show ?? hasHeaders === undefined ? undefined : hasHeaders ? UserManagerConfig.Header.defaults.show : false,
                    popout: userHeader?.popout,
                    dock: userHeader?.dock,
                    maximise: userHeader?.maximise,
                    close: userHeader?.close,
                    minimise: userHeader?.minimise,
                    tabDropdown: userHeader?.tabDropdown,
                }
                return result;
            }
        }
    }
}

export type UserStackItemConfig = UserHeaderedItemConfig

export namespace UserStackItemConfig {
    export function resolve(user: UserStackItemConfig): StackItemConfig {
        const result: StackItemConfig = {
            type: user.type,
            content: UserItemConfig.resolveContent(user.content),
            width: user.width ?? UserItemConfig.defaults.width,
            minWidth: user.minWidth ?? UserItemConfig.defaults.minWidth,
            height: user.height ?? UserItemConfig.defaults.height,
            minHeight: user.minHeight ?? UserItemConfig.defaults.minHeight,
            id: user.id ?? UserItemConfig.defaults.id,
            isClosable: user.isClosable ?? UserItemConfig.defaults.isClosable,
            reorderEnabled: user.reorderEnabled ?? UserItemConfig.defaults.reorderEnabled,
            title: user.title ?? UserItemConfig.defaults.title,
            activeItemIndex: user.activeItemIndex ?? UserItemConfig.defaults.activeItemIndex,
            header: UserHeaderedItemConfig.Header.resolve(user.header, user.hasHeaders),
        };
        return result;
    }
}

export interface UserComponentConfig extends UserHeaderedItemConfig {
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    componentName: string;
}

export interface UserJsonComponentConfig extends UserComponentConfig {
    /**
     * A serialisable object. Will be passed to the component constructor function and will be the value returned by
     * container.getState().
     */
    componentState?: JsonValue;
}

export namespace UserJsonComponentConfig {
    export function resolve(user: UserJsonComponentConfig): JsonComponentConfig {
        if (user.componentName === undefined) {
            throw new Error('UserJsonComponentConfig.componentName is undefined');
        } else {
            const result: JsonComponentConfig = {
                type: user.type,
                content: UserItemConfig.resolveContent(user.content),
                width: user.width ?? UserItemConfig.defaults.width,
                minWidth: user.minWidth ?? UserItemConfig.defaults.minWidth,
                height: user.height ?? UserItemConfig.defaults.height,
                minHeight: user.minHeight ?? UserItemConfig.defaults.minHeight,
                id: user.id ?? UserItemConfig.defaults.id,
                isClosable: user.isClosable ?? UserItemConfig.defaults.isClosable,
                reorderEnabled: user.reorderEnabled ?? UserItemConfig.defaults.reorderEnabled,
                title: user.title ?? user.componentName,
                activeItemIndex: user.activeItemIndex ?? UserItemConfig.defaults.activeItemIndex,
                header: UserHeaderedItemConfig.Header.resolve(user.header, user.hasHeaders),
                componentName: user.componentName,
                componentState: user.componentState ?? {},
            };
            return result;
        }
    }
}

export interface UserReactComponentConfig extends UserComponentConfig {
    /**
     * Properties that will be passed to the component and accessible using this.props.
     */
    props?: unknown;
}

export namespace UserReactComponentConfig {
    export function resolve(user: UserReactComponentConfig): ReactComponentConfig {
        if (user.componentName === undefined) {
            throw new Error('UserReactComponentConfig.componentName is undefined');
        } else {
            const result: ReactComponentConfig = {
                type: ItemConfig.Type["react-component"],
                content: UserItemConfig.resolveContent(user.content),
                width: user.width ?? UserItemConfig.defaults.width,
                minWidth: user.minWidth ?? UserItemConfig.defaults.minWidth,
                height: user.height ?? UserItemConfig.defaults.height,
                minHeight: user.minHeight ?? UserItemConfig.defaults.minHeight,
                id: user.id ?? UserItemConfig.defaults.id,
                isClosable: user.isClosable ?? UserItemConfig.defaults.isClosable,
                reorderEnabled: user.reorderEnabled ?? UserItemConfig.defaults.reorderEnabled,
                title: user.title ?? user.componentName,
                activeItemIndex: user.activeItemIndex ?? UserItemConfig.defaults.activeItemIndex,
                header: UserHeaderedItemConfig.Header.resolve(user.header, user.hasHeaders),
                componentName: ReactComponentConfig.REACT_COMPONENT_ID,
                props: user.props,
            };
            return result;
        }
    }
}

export interface UserManagerConfig {
    content?: UserItemConfig[];
    openPopouts?: UserPopoutManagerConfig[];
    dimensions?: UserManagerConfig.Dimensions;
    settings?: UserManagerConfig.Settings;
    /** @deprecated use header instead */
    labels?: UserManagerConfig.Labels;
    header?: UserManagerConfig.Header;
}

export namespace UserManagerConfig {
    export interface Settings {
        /**
         * @deprecated use Header.show instead
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
        responsiveMode?: ManagerConfig.Settings.ResponsiveMode;

        /**
         * Specifies Maximum pixel overlap per tab.
         * Default: 0
         */
        tabOverlapAllowance?: number;

        /**
         * 
         * Default: true
         */
        reorderOnTabMenuClick?: boolean;

        /**
         * @default Settings.tabControlOffset
         * Default: 10
         */
        tabControlOffset?: number;
    }

    export namespace Settings {
        export function resolve(user: Settings | undefined): ManagerConfig.Settings {
            const result: ManagerConfig.Settings = {
                constrainDragToContainer: user?.constrainDragToContainer ?? defaults.constrainDragToContainer,
                reorderEnabled: user?.reorderEnabled ?? defaults.reorderEnabled,
                selectionEnabled: user?.selectionEnabled ?? defaults.selectionEnabled,
                popoutWholeStack: user?.popoutWholeStack ?? defaults.popoutWholeStack,
                blockedPopoutsThrowError: user?.blockedPopoutsThrowError ?? defaults.blockedPopoutsThrowError,
                closePopoutsOnUnload: user?.closePopoutsOnUnload ?? defaults.closePopoutsOnUnload,
                showPopoutIcon: user?.showPopoutIcon ?? defaults.showPopoutIcon,
                showMaximiseIcon: user?.showMaximiseIcon ?? defaults.showMaximiseIcon,
                showCloseIcon: user?.showCloseIcon ?? defaults.showCloseIcon,
                responsiveMode: user?.responsiveMode ?? defaults.responsiveMode,
                tabOverlapAllowance: user?.tabOverlapAllowance ?? defaults.tabOverlapAllowance,
                reorderOnTabMenuClick: user?.reorderOnTabMenuClick ?? defaults.reorderOnTabMenuClick,
                tabControlOffset: user?.tabControlOffset ?? defaults.tabControlOffset,
            }
            return result;
        }

        export const defaults: ManagerConfig.Settings = {
            constrainDragToContainer: true,
            reorderEnabled: true,
            selectionEnabled: false,
            popoutWholeStack: false,
            blockedPopoutsThrowError: true,
            closePopoutsOnUnload: true,
            showPopoutIcon: true,
            showMaximiseIcon: true,
            showCloseIcon: true,
            responsiveMode: ManagerConfig.Settings.ResponsiveMode.onload,
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
        export function resolve(user: Dimensions | undefined): ManagerConfig.Dimensions {
            const result: ManagerConfig.Dimensions = {
                borderWidth: user?.borderWidth ?? defaults.borderWidth,
                borderGrabWidth: user?.borderGrabWidth ?? defaults.borderGrabWidth,
                minItemHeight: user?.minItemHeight ?? defaults.minItemHeight,
                minItemWidth: user?.minItemWidth ?? defaults.minItemWidth,
                headerHeight: user?.headerHeight ?? defaults.headerHeight,
                dragProxyWidth: user?.dragProxyWidth ?? defaults.dragProxyWidth,
                dragProxyHeight: user?.dragProxyHeight ?? defaults.dragProxyHeight,
            }
            return result;
        }

        export const defaults: ManagerConfig.Dimensions = {
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
         * @deprecated use Header.close instead
         */
        close?: string;

        /**
         * @deprecated use Header.maximise instead
         */
        maximise?: string;

        /**
         * @deprecated use Header.minimise instead
         */
        minimise?: string;

        /**
         * @deprecated use Header.popin instead
         */
        popin?: string;

        /**
         * @deprecated use Header.popout instead
         */
        popout?: string;

        /**
         * @deprecated use Header.tabDropdown instead
         */
        tabDropdown?: string;
    }

    export interface Header {
        /**
         * Specifies whether header should be displayed, and if so, on which side.
         * If false, the layout will be displayed with splitters only.
         * Default: 'top'
         */
        show?: false | Side;
        /**
         * The tooltip text that appears when hovering over the popout icon or false if popout button not displayed.
         * Default: 'open in new window'
         */
        popout?: false | string;
        /**
         * The tooltip text that appears when hovering over the popin icon.
         * Default: 'pop in'
         */
        popin?: string;
        /**
         * The tooltip text that appears when hovering over the maximise icon or false if maximised button not displayed.
         * Default: 'maximise'
         */
        maximise?: false | string;
        /**
         * The tooltip text that appears when hovering over the close icon.
         * Default: 'close'
         */
        close?: string;
        /**
         * The tooltip text that appears when hovering over the minimise icon.
         * Default: 'minimise'
         */
        minimise?: string;
        /**
         * 
         * Default: 'additional tabs'
         */
        tabDropdown?: string;
    }

    export namespace Header {
        export function resolve(userHeader: Header | undefined,
            userSettings: UserManagerConfig.Settings | undefined, userLabels: UserManagerConfig.Labels | undefined
        ): ManagerConfig.Header {
            let show: false | Side;
            if (userHeader?.show !== undefined) {
                show = userHeader.show;
            } else {
                if (userSettings !== undefined && userSettings.hasHeaders !== undefined) {
                    show = userSettings.hasHeaders ? defaults.show : false;
                } else {
                    show = defaults.show;
                }
            }
            const result: ManagerConfig.Header = {
                show,
                popout: userHeader?.popout ?? userLabels?.popout ?? defaults.popout,
                dock: userHeader?.popin ?? userLabels?.popin ?? defaults.dock,
                maximise: userHeader?.maximise ?? userLabels?.maximise ?? defaults.maximise,
                close: userHeader?.close ?? userLabels?.close ?? defaults.close,
                minimise: userHeader?.minimise ?? userLabels?.minimise ?? defaults.minimise,
                tabDropdown: userHeader?.tabDropdown ?? userLabels?.tabDropdown ?? defaults.tabDropdown,
            }
            return result;
        }

        export const defaults: ManagerConfig.Header = {
            show: Side.top,
            popout: 'open in new window',
            dock: 'dock',
            maximise: 'maximise',
            minimise: 'minimise',
            close: 'close',
            tabDropdown: 'additional tabs'
        }
    }

    export function resolveOpenPopouts(userPopoutConfigs: UserPopoutManagerConfig[] | undefined): PopoutManagerConfig[] {
        if (userPopoutConfigs === undefined) {
            return [];
        } else {
            const count = userPopoutConfigs.length;
            const result = new Array<PopoutManagerConfig>(count);
            for (let i = 0; i < count; i++) {
                result[i] = UserPopoutManagerConfig.resolve(userPopoutConfigs[i]);
            }
            return result;
        }
    }
}

export interface UserPopoutManagerConfig extends UserManagerConfig {
    parentId: string;
    indexInParent: number;
    dimensions: UserPopoutManagerConfig.Dimensions; // for backwards compatibility
    window: UserPopoutManagerConfig.Window;
    /** @ deprecated use Window.maximised */
    maximisedItemId?: string | null,
}

export namespace UserPopoutManagerConfig {
    // Previous versions kept window information in Dimensions key.  Only use for backwards compatibility
    /** @deprecated use Window */
    export interface Dimensions extends UserManagerConfig.Dimensions {
        /** @deprecated use Window.width */
        width: number | null,
        /** @deprecated use Window.height */
        height: number | null,
        /** @deprecated use Window.left */
        left: number | null,
        /** @deprecated use Window.top */
        top: number | null,
    }

    export interface Window {
        width?: number,
        height?: number,
        left?: number,
        top?: number,
        maximised?: boolean;
    }

    export namespace Window {
        export function resolve(userWindow: Window | undefined,
            userDimensions: Dimensions | undefined,
            maximisedItemId: string | null | undefined): PopoutManagerConfig.Window
        {
            let result: PopoutManagerConfig.Window;
            if (userWindow !== undefined) {
                result = {
                    width: userWindow.width ?? defaults.width,
                    height: userWindow.height ?? defaults.height,
                    left: userWindow.left ?? defaults.left,
                    top: userWindow.top ?? defaults.top,
                    maximised: userWindow.maximised ?? defaults.maximised,
                }
            } else {
                result = {
                    width: userDimensions?.width ?? defaults.width,
                    height: userDimensions?.height ?? defaults.height,
                    left: userDimensions?.left ?? defaults.left,
                    top: userDimensions?.top ?? defaults.top,
                    maximised: maximisedItemId === undefined ? defaults.maximised : maximisedItemId === '__glMaximised',
                }
            }
            return result;
        }

        export const defaults: PopoutManagerConfig.Window = {
            width: null,
            height: null,
            left: null,
            top: null,
            maximised: false,
        }
    }

    export function resolve(user: UserPopoutManagerConfig): PopoutManagerConfig {
        const config: PopoutManagerConfig = {
            content: UserItemConfig.resolveContent(user.content),
            openPopouts: UserManagerConfig.resolveOpenPopouts(user.openPopouts),
            settings: UserManagerConfig.Settings.resolve(user.settings),
            dimensions: UserManagerConfig.Dimensions.resolve(user.dimensions),
            header: UserManagerConfig.Header.resolve(user.header, user.settings, user.labels),
            parentId: user.parentId,
            indexInParent: user.indexInParent,
            window: UserPopoutManagerConfig.Window.resolve(user.window, user.dimensions, user.maximisedItemId),
        } 
        return config;
    }
}

/** Use to specify Config with defaults or deserialise a Config.
 * Deserialisation will handle backwards compatibility.
 * Note that Config should be used for serialisation (not UserConfig)
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UserConfig extends UserManagerConfig {
}

export namespace UserConfig {
    export function resolve(user: UserConfig): Config {
        const config: Config = {
            resolved: true,
            content: UserItemConfig.resolveContent(user.content),
            openPopouts: UserManagerConfig.resolveOpenPopouts(user.openPopouts),
            dimensions: UserManagerConfig.Dimensions.resolve(user.dimensions),
            settings: UserManagerConfig.Settings.resolve(user.settings),
            header: UserManagerConfig.Header.resolve(user.header, user.settings, user.labels),
        } 
        return config;
    }

    export const defaultConfig: Config = {
        resolved: true,
        content: [],
        openPopouts: [],
        settings: UserManagerConfig.Settings.defaults,
        dimensions: UserManagerConfig.Dimensions.defaults,
        header: UserManagerConfig.Header.defaults,
    };

    /** Shallow transformation of Config to UserConfig */
    export function fromConfig(config: Config): UserConfig {
        const userConfig: UserConfig = {
            content: config.content,
            openPopouts: config.openPopouts as UserPopoutManagerConfig[],
            dimensions: config.dimensions,
            settings: config.settings,
            header: config.header,
        };
        return userConfig;
    }

    export function isUserConfig(configOrUserConfig: Config | UserConfig): configOrUserConfig is UserConfig {
        const config = configOrUserConfig as Config;
        return config.resolved === undefined || !config.resolved;
    }
}
