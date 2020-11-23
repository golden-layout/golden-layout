import { ConfigurationError } from '../errors/external-error';
import { AssertError, UnreachableCaseError } from '../errors/internal-error';
import { JsonValue, Side } from '../utils/types';
import {
    ComponentItemConfig,
    HeaderedItemConfig,
    ItemConfig,
    LayoutConfig,
    PopoutLayoutConfig,
    ReactComponentConfig,
    RootItemConfig,
    RowOrColumnItemConfig,
    SerialisableComponentConfig,
    StackItemConfig
} from './config';

/** @public */
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
    reorderEnabled?: boolean;  // Takes precedence over UserLayoutConfig.reorderEnabled. Should be settings.reorderEnabled
}

/** @public */
export namespace UserItemConfig {
    export function resolve(user: UserItemConfig): ItemConfig {
        switch (user.type) {
            case ItemConfig.Type.ground:
                throw new ConfigurationError('UserItemConfig cannot specify type ground', JSON.stringify(user));
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

    export function isGround(config: UserItemConfig): config is UserItemConfig {
        return config.type === ItemConfig.Type.ground;
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
/** @public */
export interface UserHeaderedItemConfig extends UserItemConfig {
    /** @deprecated use {@link (UserHeaderedItemConfig:namespace).(Header:interface).show} instead */
    hasHeaders?: boolean;
    header?: UserHeaderedItemConfig.Header;
    maximised?: boolean;
}

/** @public */
export namespace UserHeaderedItemConfig {
    const legacyMaximisedId = '__glMaximised';

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
                    show: userHeader?.show ?? (hasHeaders === undefined ? undefined : hasHeaders ? LayoutConfig.Header.defaults.show : false),
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

    export function resolveIdAndMaximised(config: UserHeaderedItemConfig): { id: string | string[], maximised: boolean} {
        let id = config.id;
        let legacyMaximised = false;
        if (id === undefined) {
            id = ItemConfig.defaults.id;
        } else {
            if (Array.isArray(id)) {
                const idx = id.findIndex((id) => id === legacyMaximisedId)
                if (idx > 0) {
                    legacyMaximised = true;
                    id = id.splice(idx, 1);
                }
            }
        }

        let maximised: boolean;
        if (config.maximised !== undefined) {
            maximised = config.maximised;
        } else {
            maximised = legacyMaximised;
        }

        return { id, maximised }
    }
}

/** @public */
export interface UserStackItemConfig extends UserHeaderedItemConfig {
    type: 'stack';
    content: UserComponentItemConfig[];
    /** The index of the item in content which is to be active*/
    activeItemIndex?: number;
}

/** @public */
export namespace UserStackItemConfig {
    export function resolve(user: UserStackItemConfig): StackItemConfig {
        const { id, maximised } = UserHeaderedItemConfig.resolveIdAndMaximised(user);
        const result: StackItemConfig = {
            type: ItemConfig.Type.stack,
            content: resolveContent(user.content),
            width: user.width ?? ItemConfig.defaults.width,
            minWidth: user.minWidth ?? ItemConfig.defaults.minWidth,
            height: user.height ?? ItemConfig.defaults.height,
            minHeight: user.minHeight ?? ItemConfig.defaults.minHeight,
            id,
            maximised,
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

/** @public */
export interface UserComponentItemConfig extends UserHeaderedItemConfig {
    readonly content?: [];
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    componentName: string;
}

/** @public */
export interface UserSerialisableComponentConfig extends UserComponentItemConfig {
    type: 'component';
    /**
     * A serialisable object. Will be passed to the component constructor function and will be the value returned by
     * container.getState().
     */
    componentState?: JsonValue;
}

/** @public */
export namespace UserSerialisableComponentConfig {
    export function resolve(user: UserSerialisableComponentConfig): SerialisableComponentConfig {
        if (user.componentName === undefined) {
            throw new Error('UserJsonComponentConfig.componentName is undefined');
        } else {
            const { id, maximised } = UserHeaderedItemConfig.resolveIdAndMaximised(user);
            const result: SerialisableComponentConfig = {
                type: user.type,
                content: [],
                width: user.width ?? ItemConfig.defaults.width,
                minWidth: user.minWidth ?? ItemConfig.defaults.minWidth,
                height: user.height ?? ItemConfig.defaults.height,
                minHeight: user.minHeight ?? ItemConfig.defaults.minHeight,
                id,
                maximised,
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

/** @public */
export interface UserReactComponentConfig extends UserComponentItemConfig {
    type: 'react-component';
    component?: string;
    /**
     * Properties that will be passed to the component and accessible using this.props.
     */
    props?: JsonValue;
}

/** @public */
export namespace UserReactComponentConfig {
    export function resolve(user: UserReactComponentConfig): ReactComponentConfig {
        if (user.component === undefined) {
            throw new Error('UserReactComponentConfig.componentName is undefined');
        } else {
            const { id, maximised } = UserHeaderedItemConfig.resolveIdAndMaximised(user);
            const result: ReactComponentConfig = {
                type: ItemConfig.Type.reactComponent,
                content: [],
                width: user.width ?? ItemConfig.defaults.width,
                minWidth: user.minWidth ?? ItemConfig.defaults.minWidth,
                height: user.height ?? ItemConfig.defaults.height,
                minHeight: user.minHeight ?? ItemConfig.defaults.minHeight,
                id,
                maximised,
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
/** @public */
export interface UserRowOrColumnItemConfig extends UserItemConfig {
    type: 'row' | 'column';
    content: (UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig)[];
}

/** @public */
export namespace UserRowOrColumnItemConfig {
    export type ChildItemConfig = UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig;

    export function isChildItemConfig(itemConfig: UserItemConfig): itemConfig is ChildItemConfig {
        switch (itemConfig.type) {
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
            case ItemConfig.Type.stack:
            case ItemConfig.Type.reactComponent:
            case ItemConfig.Type.component:
                return true;
            case ItemConfig.Type.ground:
                return false;
            default:
                throw new UnreachableCaseError('UROCOSPCICIC13687', itemConfig.type);
        }
    }

    export function resolve(user: UserRowOrColumnItemConfig): RowOrColumnItemConfig {
        const result: RowOrColumnItemConfig = {
            type: user.type,
            content: UserRowOrColumnItemConfig.resolveContent(user.content),
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
    export function resolveContent(content: ChildItemConfig[] | undefined): RowOrColumnItemConfig.ChildItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const result = new Array<RowOrColumnItemConfig.ChildItemConfig>(count);
            for (let i = 0; i < count; i++) {
                const userChildItemConfig = content[i];
                if (!UserRowOrColumnItemConfig.isChildItemConfig(userChildItemConfig)) {
                    throw new ConfigurationError('ItemConfig is not Row, Column or Stack', userChildItemConfig);
                } else {
                    const childItemConfig = UserItemConfig.resolve(userChildItemConfig);
                    if (!RowOrColumnItemConfig.isChildItemConfig(childItemConfig)) {
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

/** @public */
export type UserRootItemConfig = UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig;

/** @public */
export namespace UserRootItemConfig {
    export function isUserRootItemConfig(itemConfig: UserItemConfig): itemConfig is UserRootItemConfig {
        switch (itemConfig.type) {
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
            case ItemConfig.Type.stack:
            case ItemConfig.Type.reactComponent:
            case ItemConfig.Type.component:
                return true;
            case ItemConfig.Type.ground:
                return false;
            default:
                throw new UnreachableCaseError('URICIR23687', itemConfig.type);
        }
    }

    export function resolve(user: UserRootItemConfig): RootItemConfig {
        const result = UserItemConfig.resolve(user);
        if (!RootItemConfig.isRootItemConfig(result)) {
            throw new ConfigurationError('ItemConfig is not Row, Column or Stack', JSON.stringify(user));
        } else {
            return result;
        }
    }
}

/** @public */
export interface UserLayoutConfig {
    root: UserRootItemConfig;
    /** @deprecated Use {@link (UserLayoutConfig:interface).root} */
    content?: (UserRowOrColumnItemConfig | UserStackItemConfig | UserComponentItemConfig)[];
    openPopouts?: UserPopoutLayoutConfig[];
    dimensions?: UserLayoutConfig.Dimensions;
    settings?: UserLayoutConfig.Settings;
    /** @deprecated use {@link (UserLayoutConfig:interface).header} instead */
    labels?: UserLayoutConfig.Labels;
    header?: UserLayoutConfig.Header;
    /** @deprecated to be replaced in future (see comments in LayoutConfig) */
    maximisedItemId?: string | null,
}

/** Use to specify LayoutConfig with defaults or deserialise a LayoutConfig.
 * Deserialisation will handle backwards compatibility.
 * Note that LayoutConfig should be used for serialisation (not UserLayoutConfig)
 * @public
 */
export namespace UserLayoutConfig {
    export interface Settings {
        /**
         * @deprecated use ${@link (UserLayoutConfig:namespace).(Header:interface).show} instead
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
        responsiveMode?: LayoutConfig.Settings.ResponsiveMode;

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
         * Default: 10
         */
        tabControlOffset?: number;
    }

    export namespace Settings {
        export function resolve(user: Settings | undefined): LayoutConfig.Settings {
            const result: LayoutConfig.Settings = {
                constrainDragToContainer: user?.constrainDragToContainer ?? LayoutConfig.Settings.defaults.constrainDragToContainer,
                reorderEnabled: user?.reorderEnabled ?? LayoutConfig.Settings.defaults.reorderEnabled,
                selectionEnabled: user?.selectionEnabled ?? LayoutConfig.Settings.defaults.selectionEnabled,
                popoutWholeStack: user?.popoutWholeStack ?? LayoutConfig.Settings.defaults.popoutWholeStack,
                blockedPopoutsThrowError: user?.blockedPopoutsThrowError ?? LayoutConfig.Settings.defaults.blockedPopoutsThrowError,
                closePopoutsOnUnload: user?.closePopoutsOnUnload ?? LayoutConfig.Settings.defaults.closePopoutsOnUnload,
                showPopoutIcon: user?.showPopoutIcon ?? LayoutConfig.Settings.defaults.showPopoutIcon,
                showMaximiseIcon: user?.showMaximiseIcon ?? LayoutConfig.Settings.defaults.showMaximiseIcon,
                showCloseIcon: user?.showCloseIcon ?? LayoutConfig.Settings.defaults.showCloseIcon,
                responsiveMode: user?.responsiveMode ?? LayoutConfig.Settings.defaults.responsiveMode,
                tabOverlapAllowance: user?.tabOverlapAllowance ?? LayoutConfig.Settings.defaults.tabOverlapAllowance,
                reorderOnTabMenuClick: user?.reorderOnTabMenuClick ?? LayoutConfig.Settings.defaults.reorderOnTabMenuClick,
                tabControlOffset: user?.tabControlOffset ?? LayoutConfig.Settings.defaults.tabControlOffset,
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
        export function resolve(user: Dimensions | undefined): LayoutConfig.Dimensions {
            const result: LayoutConfig.Dimensions = {
                borderWidth: user?.borderWidth ?? LayoutConfig.Dimensions.defaults.borderWidth,
                borderGrabWidth: user?.borderGrabWidth ?? LayoutConfig.Dimensions.defaults.borderGrabWidth,
                minItemHeight: user?.minItemHeight ?? LayoutConfig.Dimensions.defaults.minItemHeight,
                minItemWidth: user?.minItemWidth ?? LayoutConfig.Dimensions.defaults.minItemWidth,
                headerHeight: user?.headerHeight ?? LayoutConfig.Dimensions.defaults.headerHeight,
                dragProxyWidth: user?.dragProxyWidth ?? LayoutConfig.Dimensions.defaults.dragProxyWidth,
                dragProxyHeight: user?.dragProxyHeight ?? LayoutConfig.Dimensions.defaults.dragProxyHeight,
            }
            return result;
        }
    }

    export interface Labels {
        /**
         * @deprecated use {@link (UserLayoutConfig:namespace).(Header:interface).close} instead
         */
        close?: string;

        /**
         * @deprecated use {@link (UserLayoutConfig:namespace).(Header:interface).maximise} instead
         */
        maximise?: string;

        /**
         * @deprecated use {@link (UserLayoutConfig:namespace).(Header:interface).minimise} instead
         */
        minimise?: string;

        /**
         * @deprecated use {@link (UserLayoutConfig:namespace).(Header:interface).popin} instead
         */
        popin?: string;

        /**
         * @deprecated use {@link (UserLayoutConfig:namespace).(Header:interface).popout} instead
         */
        popout?: string;

        /**
         * @deprecated use {@link (UserLayoutConfig:namespace).(Header:interface).tabDropdown} instead
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
            userSettings: UserLayoutConfig.Settings | undefined, userLabels: UserLayoutConfig.Labels | undefined
        ): LayoutConfig.Header {
            let show: false | Side;
            if (userHeader?.show !== undefined) {
                show = userHeader.show;
            } else {
                if (userSettings !== undefined && userSettings.hasHeaders !== undefined) {
                    show = userSettings.hasHeaders ? LayoutConfig.Header.defaults.show : false;
                } else {
                    show = LayoutConfig.Header.defaults.show;
                }
            }
            const result: LayoutConfig.Header = {
                show,
                popout: userHeader?.popout ?? (userLabels?.popout ?? LayoutConfig.Header.defaults.popout),
                dock: userHeader?.popin ?? (userLabels?.popin ?? LayoutConfig.Header.defaults.dock),
                maximise: userHeader?.maximise ?? (userLabels?.maximise ?? LayoutConfig.Header.defaults.maximise),
                close: userHeader?.close ?? (userLabels?.close ?? LayoutConfig.Header.defaults.close),
                minimise: userHeader?.minimise ?? (userLabels?.minimise ?? LayoutConfig.Header.defaults.minimise),
                tabDropdown: userHeader?.tabDropdown ?? (userLabels?.tabDropdown ?? LayoutConfig.Header.defaults.tabDropdown),
            }
            return result;
        }
    }

    export function isPopout(config: UserLayoutConfig): config is UserPopoutLayoutConfig {
        return 'parentId' in config || 'indexInParent' in config || 'window' in config;
    }

    export function resolve(user: UserLayoutConfig): LayoutConfig {
        if (isPopout(user)) {
            return UserPopoutLayoutConfig.resolve(user);
        } else {
            let userRoot: UserRootItemConfig;
            if (user.root !== undefined) {
                userRoot = user.root;
            } else {
                if (user.content !== undefined && user.content.length > 0) {
                    userRoot = user.content[0];
                } else {
                    throw new ConfigurationError('UserLayoutConfig must specify root', JSON.stringify(user));
                }
            }
            const config: LayoutConfig = {
                resolved: true,
                root: UserRootItemConfig.resolve(userRoot),
                openPopouts: UserLayoutConfig.resolveOpenPopouts(user.openPopouts),
                dimensions: UserLayoutConfig.Dimensions.resolve(user.dimensions),
                settings: UserLayoutConfig.Settings.resolve(user.settings),
                header: UserLayoutConfig.Header.resolve(user.header, user.settings, user.labels),
            } 
            return config;
        }
    }

    export function fromLayoutConfig(config: LayoutConfig): UserLayoutConfig {
        const copiedConfig = LayoutConfig.createCopy(config);
        const result: UserLayoutConfig = {
            root: copiedConfig.root as UserRootItemConfig,
            openPopouts: copiedConfig.openPopouts as unknown as UserPopoutLayoutConfig[],
            dimensions: copiedConfig.dimensions,
            settings: copiedConfig.settings,
            header: copiedConfig.header,
        };
        return result;
    }

    export function isUserLayoutConfig(configOrUserConfig: LayoutConfig | UserLayoutConfig): configOrUserConfig is UserLayoutConfig {
        const config = configOrUserConfig as LayoutConfig;
        return config.resolved === undefined || !config.resolved;
    }

    export function resolveOpenPopouts(userPopoutConfigs: UserPopoutLayoutConfig[] | undefined): PopoutLayoutConfig[] {
        if (userPopoutConfigs === undefined) {
            return [];
        } else {
            const count = userPopoutConfigs.length;
            const result = new Array<PopoutLayoutConfig>(count);
            for (let i = 0; i < count; i++) {
                result[i] = UserPopoutLayoutConfig.resolve(userPopoutConfigs[i]);
            }
            return result;
        }
    }
}

/** @public */
export interface UserPopoutLayoutConfig extends UserLayoutConfig {
    /** The id of the element the item will be appended to on popIn 
    * If null, append to topmost layout element 
    */
    parentId: string | null | undefined;
    /** The position of this element within its parent
    * If null, position is last
    */
    indexInParent: number | null | undefined;
    /** @deprecated use {@link (UserPopoutLayoutConfig:interface).window} */
    dimensions: UserPopoutLayoutConfig.Dimensions | undefined; // for backwards compatibility
    window: UserPopoutLayoutConfig.Window | undefined;
}

/** @public */
export namespace UserPopoutLayoutConfig {
    // Previous versions kept window information in Dimensions key.  Only use for backwards compatibility
    /** @deprecated use {@link (UserPopoutLayoutConfig:namespace).(Window:interface)} */
    export interface Dimensions extends UserLayoutConfig.Dimensions {
        /** @deprecated use {@link (UserPopoutLayoutConfig:namespace).(Window:interface).width} */
        width: number | null,
        /** @deprecated use {@link (UserPopoutLayoutConfig:namespace).(Window:interface).height} */
        height: number | null,
        /** @deprecated use {@link (UserPopoutLayoutConfig:namespace).(Window:interface).left} */
        left: number | null,
        /** @deprecated use {@link (UserPopoutLayoutConfig:namespace).(Window:interface).top} */
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
            userDimensions: Dimensions | undefined): PopoutLayoutConfig.Window
        {
            let result: PopoutLayoutConfig.Window;
            const defaults = PopoutLayoutConfig.Window.defaults;
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

    export function resolve(user: UserPopoutLayoutConfig): PopoutLayoutConfig {
        let userRoot: UserRootItemConfig;
        if (user.root !== undefined) {
            userRoot = user.root;
        } else {
            if (user.content !== undefined && user.content.length > 0) {
                userRoot = user.content[0];
            } else {
                throw new ConfigurationError('UserPopoutLayoutConfig must specify root', JSON.stringify(user));
            }
        }

        const config: PopoutLayoutConfig = {
            root: UserRootItemConfig.resolve(userRoot),
            openPopouts: UserLayoutConfig.resolveOpenPopouts(user.openPopouts),
            settings: UserLayoutConfig.Settings.resolve(user.settings),
            dimensions: UserLayoutConfig.Dimensions.resolve(user.dimensions),
            header: UserLayoutConfig.Header.resolve(user.header, user.settings, user.labels),
            parentId: user.parentId ?? null,
            indexInParent: user.indexInParent ?? null,
            window: UserPopoutLayoutConfig.Window.resolve(user.window, user.dimensions),
            resolved: true,
        } 
        return config;
    }
}
