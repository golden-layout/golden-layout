import { ConfigurationError } from '../errors/external-error';
import { AssertError, UnreachableCaseError } from '../errors/internal-error';
import { JsonValue, Side } from '../utils/types';
import {
    ComponentItemConfig,
    Config,
    HeaderedItemConfig,
    ItemConfig,
    ManagerConfig,
    PopoutManagerConfig,
    ReactComponentConfig,
    RowOrColumnItemConfig,
    RowOrColumnOrStackParentItemConfig,
    SerialisableComponentConfig,
    StackItemConfig
} from './config';

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
    reorderEnabled?: boolean;  // Takes precedence over UserManagerConfig.reorderEnabled. Should be settings.reorderEnabled
}

export namespace UserItemConfig {
    export function resolve(user: UserItemConfig): ItemConfig {
        switch (user.type) {
            case ItemConfig.Type.root:
                throw new ConfigurationError('UserItemConfig cannot specify type root', JSON.stringify(user));
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                return UserRowOrColumnItemConfig.resolve(user as UserRowOrColumnItemConfig);

            case ItemConfig.Type.stack:
                return UserStackItemConfig.resolve(user as UserStackItemConfig);

            case ItemConfig.Type.component:
                return UserSerialisableComponentConfig.resolve(user as UserSerialisableComponentConfig);

            case ItemConfig.Type.reactComponent:
                return UserReactComponentConfig.resolve(user as UserReactComponentConfig);

            default:
                throw new UnreachableCaseError('UCUICR55499', user.type);
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
    export function isJson(config: UserItemConfig): config is UserSerialisableComponentConfig {
        return config.type === ItemConfig.Type.component;
    }
    export function isReact(config: UserItemConfig): config is UserReactComponentConfig {
        return config.type === ItemConfig.Type.reactComponent;
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
                    show: userHeader?.show ?? (hasHeaders === undefined ? undefined : hasHeaders ? ManagerConfig.Header.defaults.show : false),
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

export interface UserStackItemConfig extends UserHeaderedItemConfig {
    type: ItemConfig.Type.stack;
    content: UserComponentItemConfig[];
    /** The index of the item in content which is to be active*/
    activeItemIndex?: number;
}

export namespace UserStackItemConfig {
    export function resolve(user: UserStackItemConfig): StackItemConfig {
        const result: StackItemConfig = {
            type: ItemConfig.Type.stack,
            content: resolveContent(user.content),
            width: user.width ?? ItemConfig.defaults.width,
            minWidth: user.minWidth ?? ItemConfig.defaults.minWidth,
            height: user.height ?? ItemConfig.defaults.height,
            minHeight: user.minHeight ?? ItemConfig.defaults.minHeight,
            id: user.id ?? ItemConfig.defaults.id,
            isClosable: user.isClosable ?? ItemConfig.defaults.isClosable,
            reorderEnabled: user.reorderEnabled ?? ItemConfig.defaults.reorderEnabled,
            title: user.title ?? ItemConfig.defaults.title,
            activeItemIndex: user.activeItemIndex ?? StackItemConfig.defaultActiveItemIndex,
            header: UserHeaderedItemConfig.Header.resolve(user.header, user.hasHeaders),
        };
        return result;
    }

    export function resolveContent(content: UserComponentItemConfig[] | undefined): ComponentItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const result = new Array<ComponentItemConfig>(count);
            for (let i = 0; i < count; i++) {
                const userChildItemConfig = content[i];
                const itemConfig = UserItemConfig.resolve(userChildItemConfig);
                if (!ItemConfig.isComponentItem(itemConfig)) {
                    throw new AssertError('UCUSICRC91114', JSON.stringify(itemConfig));
                } else {
                    result[i] = itemConfig;
                }
            }
            return result;
        }
    }
}

export interface UserComponentItemConfig extends UserHeaderedItemConfig {
    readonly content: [];
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    componentName: string;
}

export interface UserSerialisableComponentConfig extends UserComponentItemConfig {
    type: ItemConfig.Type.component;
    /**
     * A serialisable object. Will be passed to the component constructor function and will be the value returned by
     * container.getState().
     */
    componentState?: JsonValue;
}

export namespace UserSerialisableComponentConfig {
    export function resolve(user: UserSerialisableComponentConfig): SerialisableComponentConfig {
        if (user.componentName === undefined) {
            throw new Error('UserJsonComponentConfig.componentName is undefined');
        } else {
            const result: SerialisableComponentConfig = {
                type: user.type,
                content: [],
                width: user.width ?? ItemConfig.defaults.width,
                minWidth: user.minWidth ?? ItemConfig.defaults.minWidth,
                height: user.height ?? ItemConfig.defaults.height,
                minHeight: user.minHeight ?? ItemConfig.defaults.minHeight,
                id: user.id ?? ItemConfig.defaults.id,
                isClosable: user.isClosable ?? ItemConfig.defaults.isClosable,
                reorderEnabled: user.reorderEnabled ?? ItemConfig.defaults.reorderEnabled,
                title: user.title ?? user.componentName,
                header: UserHeaderedItemConfig.Header.resolve(user.header, user.hasHeaders),
                componentName: user.componentName,
                componentState: user.componentState ?? {},
            };
            return result;
        }
    }
}

export interface UserReactComponentConfig extends UserComponentItemConfig {
    type: ItemConfig.Type.reactComponent;
    component?: string;
    /**
     * Properties that will be passed to the component and accessible using this.props.
     */
    props?: JsonValue;
}

export namespace UserReactComponentConfig {
    export function resolve(user: UserReactComponentConfig): ReactComponentConfig {
        if (user.component === undefined) {
            throw new Error('UserReactComponentConfig.componentName is undefined');
        } else {
            const result: ReactComponentConfig = {
                type: ItemConfig.Type.reactComponent,
                content: [],
                width: user.width ?? ItemConfig.defaults.width,
                minWidth: user.minWidth ?? ItemConfig.defaults.minWidth,
                height: user.height ?? ItemConfig.defaults.height,
                minHeight: user.minHeight ?? ItemConfig.defaults.minHeight,
                id: user.id ?? ItemConfig.defaults.id,
                isClosable: user.isClosable ?? ItemConfig.defaults.isClosable,
                reorderEnabled: user.reorderEnabled ?? ItemConfig.defaults.reorderEnabled,
                title: user.title ?? user.componentName,
                header: UserHeaderedItemConfig.Header.resolve(user.header, user.hasHeaders),
                componentName: ReactComponentConfig.REACT_COMPONENT_ID,
                component: user.component,
                props: user.props,
            };
            return result;
        }
    }
}

// RowOrColumn
export interface UserRowOrColumnOrStackParentItemConfig extends UserItemConfig {
    content: (UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig)[];
}

export namespace UserRowOrColumnOrStackParentItemConfig {
    export type ChildItemConfig = UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig;

    export function isChildItemConfig(itemConfig: UserItemConfig): itemConfig is ChildItemConfig {
        switch (itemConfig.type) {
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
            case ItemConfig.Type.stack:
            case ItemConfig.Type.reactComponent:
            case ItemConfig.Type.component:
                return true;
            case ItemConfig.Type.root:
                return false;
            default:
                throw new UnreachableCaseError('UROCOSPCICIC13687', itemConfig.type);
        }
    }

    export function resolveContent(content: ChildItemConfig[] | undefined): RowOrColumnOrStackParentItemConfig.ChildItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const result = new Array<RowOrColumnOrStackParentItemConfig.ChildItemConfig>(count);
            for (let i = 0; i < count; i++) {
                const userChildItemConfig = content[i];
                if (!UserRowOrColumnOrStackParentItemConfig.isChildItemConfig(userChildItemConfig)) {
                    throw new ConfigurationError('ItemConfig is not Row, Column or Stack', userChildItemConfig);
                } else {
                    const childItemConfig = UserItemConfig.resolve(userChildItemConfig);
                    if (!RowOrColumnOrStackParentItemConfig.isChildItemConfig(childItemConfig)) {
                        throw new AssertError('UROCOSPIC99512', JSON.stringify(childItemConfig));
                    } else {
                        result[i] = childItemConfig;
                    }
                }
            }
            return result;
        }
    }
}

export interface UserRowOrColumnItemConfig extends UserRowOrColumnOrStackParentItemConfig {
    type: ItemConfig.Type.row | ItemConfig.Type.column;
}

export namespace UserRowOrColumnItemConfig {
    export function resolve(user: UserRowOrColumnItemConfig): RowOrColumnItemConfig {
        const result: RowOrColumnItemConfig = {
            type: user.type,
            content: UserRowOrColumnOrStackParentItemConfig.resolveContent(user.content),
            width: user.width ?? ItemConfig.defaults.width,
            minWidth: user.width ?? ItemConfig.defaults.minWidth,
            height: user.height ?? ItemConfig.defaults.height,
            minHeight: user.height ?? ItemConfig.defaults.minHeight,
            id: user.id ?? ItemConfig.defaults.id,
            isClosable: user.isClosable ?? ItemConfig.defaults.isClosable,
            reorderEnabled: user.reorderEnabled ?? ItemConfig.defaults.reorderEnabled,
            title: user.title ?? ItemConfig.defaults.title,
        }
        return result;
    }
}

export interface UserManagerConfig {
    content?: (UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig)[];
    openPopouts?: UserPopoutManagerConfig[];
    dimensions?: UserManagerConfig.Dimensions;
    settings?: UserManagerConfig.Settings;
    /** @deprecated use header instead */
    labels?: UserManagerConfig.Labels;
    header?: UserManagerConfig.Header;
    /** @deprecated to be replaced in future (see comments in ManagerConfig) */
    maximisedItemId?: string | null,
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
         * Can be overridden by UserItemConfig.reorderEnabled for specific ItemConfigs
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
                constrainDragToContainer: user?.constrainDragToContainer ?? ManagerConfig.Settings.defaults.constrainDragToContainer,
                reorderEnabled: user?.reorderEnabled ?? ManagerConfig.Settings.defaults.reorderEnabled,
                selectionEnabled: user?.selectionEnabled ?? ManagerConfig.Settings.defaults.selectionEnabled,
                popoutWholeStack: user?.popoutWholeStack ?? ManagerConfig.Settings.defaults.popoutWholeStack,
                blockedPopoutsThrowError: user?.blockedPopoutsThrowError ?? ManagerConfig.Settings.defaults.blockedPopoutsThrowError,
                closePopoutsOnUnload: user?.closePopoutsOnUnload ?? ManagerConfig.Settings.defaults.closePopoutsOnUnload,
                showPopoutIcon: user?.showPopoutIcon ?? ManagerConfig.Settings.defaults.showPopoutIcon,
                showMaximiseIcon: user?.showMaximiseIcon ?? ManagerConfig.Settings.defaults.showMaximiseIcon,
                showCloseIcon: user?.showCloseIcon ?? ManagerConfig.Settings.defaults.showCloseIcon,
                responsiveMode: user?.responsiveMode ?? ManagerConfig.Settings.defaults.responsiveMode,
                tabOverlapAllowance: user?.tabOverlapAllowance ?? ManagerConfig.Settings.defaults.tabOverlapAllowance,
                reorderOnTabMenuClick: user?.reorderOnTabMenuClick ?? ManagerConfig.Settings.defaults.reorderOnTabMenuClick,
                tabControlOffset: user?.tabControlOffset ?? ManagerConfig.Settings.defaults.tabControlOffset,
            }
            return result;
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
                borderWidth: user?.borderWidth ?? ManagerConfig.Dimensions.defaults.borderWidth,
                borderGrabWidth: user?.borderGrabWidth ?? ManagerConfig.Dimensions.defaults.borderGrabWidth,
                minItemHeight: user?.minItemHeight ?? ManagerConfig.Dimensions.defaults.minItemHeight,
                minItemWidth: user?.minItemWidth ?? ManagerConfig.Dimensions.defaults.minItemWidth,
                headerHeight: user?.headerHeight ?? ManagerConfig.Dimensions.defaults.headerHeight,
                dragProxyWidth: user?.dragProxyWidth ?? ManagerConfig.Dimensions.defaults.dragProxyWidth,
                dragProxyHeight: user?.dragProxyHeight ?? ManagerConfig.Dimensions.defaults.dragProxyHeight,
            }
            return result;
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
                    show = userSettings.hasHeaders ? ManagerConfig.Header.defaults.show : false;
                } else {
                    show = ManagerConfig.Header.defaults.show;
                }
            }
            const result: ManagerConfig.Header = {
                show,
                popout: userHeader?.popout ?? (userLabels?.popout ?? ManagerConfig.Header.defaults.popout),
                dock: userHeader?.popin ?? (userLabels?.popin ?? ManagerConfig.Header.defaults.dock),
                maximise: userHeader?.maximise ?? (userLabels?.maximise ?? ManagerConfig.Header.defaults.maximise),
                close: userHeader?.close ?? (userLabels?.close ?? ManagerConfig.Header.defaults.close),
                minimise: userHeader?.minimise ?? (userLabels?.minimise ?? ManagerConfig.Header.defaults.minimise),
                tabDropdown: userHeader?.tabDropdown ?? (userLabels?.tabDropdown ?? ManagerConfig.Header.defaults.tabDropdown),
            }
            return result;
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
    /** The id of the element the item will be appended to on popIn 
    * If null, append to topmost layout element 
    */
    parentId: string | null | undefined;
    /** The position of this element within its parent
    * If null, position is last
    */
    indexInParent: number | null | undefined;
    /** @deprecated use {@link window} */
    dimensions: UserPopoutManagerConfig.Dimensions | undefined; // for backwards compatibility
    window: UserPopoutManagerConfig.Window | undefined;
}

export namespace UserPopoutManagerConfig {
    // Previous versions kept window information in Dimensions key.  Only use for backwards compatibility
    /** @deprecated use {@link Window} */
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
    }

    export namespace Window {
        export function resolve(userWindow: Window | undefined,
            userDimensions: Dimensions | undefined): PopoutManagerConfig.Window
        {
            let result: PopoutManagerConfig.Window;
            const defaults = PopoutManagerConfig.Window.defaults;
            if (userWindow !== undefined) {
                result = {
                    width: userWindow.width ?? defaults.width,
                    height: userWindow.height ?? defaults.height,
                    left: userWindow.left ?? defaults.left,
                    top: userWindow.top ?? defaults.top,
                }
            } else {
                result = {
                    width: userDimensions?.width ?? defaults.width,
                    height: userDimensions?.height ?? defaults.height,
                    left: userDimensions?.left ?? defaults.left,
                    top: userDimensions?.top ?? defaults.top,
                }
            }
            return result;
        }
    }

    export function resolve(user: UserPopoutManagerConfig): PopoutManagerConfig {
        const config: PopoutManagerConfig = {
            content: UserRowOrColumnOrStackParentItemConfig.resolveContent(user.content),
            openPopouts: UserManagerConfig.resolveOpenPopouts(user.openPopouts),
            settings: UserManagerConfig.Settings.resolve(user.settings),
            dimensions: UserManagerConfig.Dimensions.resolve(user.dimensions),
            header: UserManagerConfig.Header.resolve(user.header, user.settings, user.labels),
            maximisedItemId: user.maximisedItemId === undefined ? null : user.maximisedItemId,
            parentId: user.parentId ?? null,
            indexInParent: user.indexInParent ?? null,
            window: UserPopoutManagerConfig.Window.resolve(user.window, user.dimensions),
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
            content: UserRowOrColumnOrStackParentItemConfig.resolveContent(user.content),
            openPopouts: UserManagerConfig.resolveOpenPopouts(user.openPopouts),
            dimensions: UserManagerConfig.Dimensions.resolve(user.dimensions),
            settings: UserManagerConfig.Settings.resolve(user.settings),
            header: UserManagerConfig.Header.resolve(user.header, user.settings, user.labels),
            maximisedItemId: user.maximisedItemId === undefined ? null : user.maximisedItemId,
        } 
        return config;
    }

    /** Shallow transformation of Config to UserConfig */
    export function fromConfig(config: Config): UserConfig {
        const content = config.content.slice() as (UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig)[];
        const userConfig: UserConfig = {
            content,
            openPopouts: config.openPopouts as unknown as UserPopoutManagerConfig[],
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
