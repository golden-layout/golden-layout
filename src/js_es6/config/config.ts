import { AssertError, UnreachableCaseError } from '../errors/internal-error';
import { JsonValue, Side } from '../utils/types';
import { deepExtendValue } from '../utils/utils';

/** @public */
export interface ItemConfig {
    // see UserItemConfig for comments
    readonly type: ItemConfig.Type;
    content: readonly ItemConfig[];
    width: number;
    readonly minWidth: number;
    height: number;
    readonly minHeight: number;
    // id no longer specifies whether an Item is maximised.  This is now done by HeaderItemConfig.maximised
    id: string | string[];
    readonly isClosable: boolean;
    title: string;
    readonly reorderEnabled: boolean; // Takes precedence over LayoutConfig.reorderEnabled. Should be settings.reorderEnabled
}

/** @public */
export namespace ItemConfig {
    export type Type = 'ground' | 'row' | 'column' | 'stack' | 'component' | 'react-component';

    export namespace Type {
        export const ground = 'ground';
        export const row = 'row';
        export const column = 'column';
        export const stack = 'stack';
        export const component = 'component';
        export const reactComponent = 'react-component';
    }

    export type HeightOrWidthPropertyName = 'height' | 'width';

    /** @internal */
    export const defaults: ItemConfig = {
        type: ItemConfig.Type.ground, // not really default but need something
        content: [],
        width: 50,
        minWidth: 0,
        height: 50,
        minHeight: 0,
        id: '',
        isClosable: true,
        reorderEnabled: true,
        title: '',
    } as const;

    /** Creates a copy of the original ItemConfig using an alternative content if specified */
    export function createCopy(original: ItemConfig, content?: ItemConfig[]): ItemConfig {
        switch (original.type) {
            case ItemConfig.Type.ground:
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                return RowOrColumnItemConfig.createCopy(original as RowOrColumnItemConfig,
                    content as RowOrColumnItemConfig.ChildItemConfig[]);

            case ItemConfig.Type.stack:
                return StackItemConfig.createCopy(original as StackItemConfig, content as ComponentItemConfig[]);

            case ItemConfig.Type.component:
                return SerialisableComponentConfig.createCopy(original as SerialisableComponentConfig);

            case ItemConfig.Type.reactComponent:
                return ReactComponentConfig.createCopy(original as ReactComponentConfig);

            default:
                throw new UnreachableCaseError('CICC91354', original.type, 'Invalid Config Item type specified');
        }
    }

    export function createDefault(type: Type): ItemConfig {
        switch (type) {
            case ItemConfig.Type.ground:
                throw new AssertError('CICCDR91562'); // Get default root from LayoutConfig
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                return RowOrColumnItemConfig.createDefault(type);

            case ItemConfig.Type.stack:
                return StackItemConfig.createDefault();

            case ItemConfig.Type.component:
                return SerialisableComponentConfig.createDefault();

            case ItemConfig.Type.reactComponent:
                return ReactComponentConfig.createDefault();

            default:
                throw new UnreachableCaseError('CICCDD91563', type, 'Invalid Config Item type specified');
        }
    }

    export function idEqualsOrContainsId(id: string | string[], otherId: string): boolean {
        if (id instanceof Array) {
            return id.includes(otherId);
        } else {
            return id === otherId;
        }
    }

    export function isComponentItem(itemConfig: ItemConfig): itemConfig is ComponentItemConfig {
        return itemConfig.type === ItemConfig.Type.component || itemConfig.type === ItemConfig.Type.reactComponent;
    }

    export function isStackItem(itemConfig: ItemConfig): itemConfig is StackItemConfig {
        return itemConfig.type === ItemConfig.Type.stack;
    }

    export function isGroundItem(itemConfig: ItemConfig): itemConfig is GroundItemConfig {
        return itemConfig.type === ItemConfig.Type.ground;
    }
}

// Stack or Component
/** @public */
export interface HeaderedItemConfig extends ItemConfig {
    header: HeaderedItemConfig.Header | undefined; // undefined means get header settings from LayoutConfig
    maximised: boolean;
}

/** @public */
export namespace HeaderedItemConfig {
    export const defaultMaximised = false;

    export interface Header {
        // undefined means get property value from LayoutConfig
        readonly show: false | Side | undefined;
        readonly popout: false | string | undefined;
        readonly dock: false | string | undefined;
        readonly maximise: false | string | undefined;
        readonly close: string | undefined;
        readonly minimise: string | undefined;
        readonly tabDropdown: false | string | undefined;
    }

    export namespace Header {
        export function createCopy(original: Header | undefined, show?: false | Side): Header | undefined {
            if (original === undefined) {
                return undefined;
            } else {
                return {
                    show: show ?? original.show,
                    popout: original.popout,
                    dock: original.dock,
                    close: original.close,
                    maximise: original.maximise,
                    minimise: original.minimise,
                    tabDropdown: original.tabDropdown,
                }
            }
        }
    }
}

/** @public */
export interface StackItemConfig extends HeaderedItemConfig {
    readonly type: 'stack';
    readonly content: ComponentItemConfig[];
    activeItemIndex: number;
}

/** @public */
export namespace StackItemConfig {
    export const defaultActiveItemIndex = 0;

    export function createCopy(original: StackItemConfig, content?: ComponentItemConfig[]): StackItemConfig {
        const result: StackItemConfig = {
            type: original.type,
            content: content !== undefined ? copyContent(content) : copyContent(original.content),
            width: original.width,
            minWidth: original.minWidth,
            height: original.height,
            minHeight: original.minHeight,
            id: original.id,
            maximised: original.maximised,
            isClosable: original.isClosable,
            reorderEnabled: original.reorderEnabled,
            title: original.title,
            activeItemIndex: original.activeItemIndex,
            header: HeaderedItemConfig.Header.createCopy(original.header),
        }
        return result;
    }

    export function copyContent(original: ComponentItemConfig[]): ComponentItemConfig[] {
        const count = original.length;
        const result = new Array<ComponentItemConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = ItemConfig.createCopy(original[i]) as ComponentItemConfig;
        }
        return result;
    }

    export function createDefault(): StackItemConfig {
        const result: StackItemConfig = {
            type: ItemConfig.Type.stack,
            content: [],
            width: ItemConfig.defaults.width,
            minWidth: ItemConfig.defaults.minWidth,
            height: ItemConfig.defaults.height,
            minHeight: ItemConfig.defaults.minHeight,
            id: ItemConfig.defaults.id,
            maximised: HeaderedItemConfig.defaultMaximised,
            isClosable: ItemConfig.defaults.isClosable,
            reorderEnabled: ItemConfig.defaults.reorderEnabled,
            title: ItemConfig.defaults.title,
            activeItemIndex: defaultActiveItemIndex,
            header: undefined,
        }
        return result;
    }
}

/** @public */
export interface ComponentItemConfig extends HeaderedItemConfig {
    readonly content: [];
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    readonly componentName: string;
}

/** @public */
export namespace ComponentItemConfig {
    export function isReact(config: ComponentItemConfig): config is ReactComponentConfig {
        return config.type === ItemConfig.Type.reactComponent;
    }
    export function isSerialisable(config: ComponentItemConfig): config is SerialisableComponentConfig {
        return config.type === ItemConfig.Type.component;
    }
}

/** @public */
export interface SerialisableComponentConfig extends ComponentItemConfig {
    // see UserJsonComponentConfig for comments
    readonly type: 'component';
    componentState?: JsonValue;
}

/** @public */
export namespace SerialisableComponentConfig {
    export function createCopy(original: SerialisableComponentConfig): SerialisableComponentConfig {
        const result: SerialisableComponentConfig = {
            type: original.type,
            content: [],
            width: original.width,
            minWidth: original.minWidth,
            height: original.height,
            minHeight: original.minHeight,
            id: original.id,
            maximised: original.maximised,
            isClosable: original.isClosable,
            reorderEnabled: original.reorderEnabled,
            title: original.title,
            header: HeaderedItemConfig.Header.createCopy(original.header),
            componentName: original.componentName,
            componentState: deepExtendValue(undefined, original.componentState) as JsonValue,
        }
        return result;
    }

    export function createDefault(): SerialisableComponentConfig {
        const result: SerialisableComponentConfig = {
            type: ItemConfig.Type.component,
            content: [],
            width: ItemConfig.defaults.width,
            minWidth: ItemConfig.defaults.minWidth,
            height: ItemConfig.defaults.height,
            minHeight: ItemConfig.defaults.minHeight,
            id: ItemConfig.defaults.id,
            maximised: HeaderedItemConfig.defaultMaximised,
            isClosable: ItemConfig.defaults.isClosable,
            reorderEnabled: ItemConfig.defaults.reorderEnabled,
            title: ItemConfig.defaults.title,
            header: undefined,
            componentName: '',
            componentState: {},
        }
        return result;
    }
}

/** @public */
export interface ReactComponentConfig extends ComponentItemConfig {
    // see UserReactComponentConfig for comments
    readonly type: 'react-component';
    readonly component: string;
    props?: unknown;
}

/** @public */
export namespace ReactComponentConfig {
    export const REACT_COMPONENT_ID = 'lm-react-component'

    export function createCopy(original: ReactComponentConfig): ReactComponentConfig {
        const result: ReactComponentConfig = {
            type: original.type,
            content: [],
            width: original.width,
            minWidth: original.minWidth,
            height: original.height,
            minHeight: original.minHeight,
            id: original.id,
            maximised: original.maximised,
            isClosable: original.isClosable,
            reorderEnabled: original.reorderEnabled,
            title: original.title,
            header: HeaderedItemConfig.Header.createCopy(original.header),
            componentName: REACT_COMPONENT_ID,
            component: original.component,
            props: deepExtendValue(undefined, original.props) as JsonValue,
        }
        return result;
    }

    export function createDefault(): ReactComponentConfig {
        const result: ReactComponentConfig = {
            type: ItemConfig.Type.reactComponent,
            content: [],
            width: ItemConfig.defaults.width,
            minWidth: ItemConfig.defaults.minWidth,
            height: ItemConfig.defaults.height,
            minHeight: ItemConfig.defaults.minHeight,
            id: ItemConfig.defaults.id,
            maximised: HeaderedItemConfig.defaultMaximised,
            isClosable: ItemConfig.defaults.isClosable,
            reorderEnabled: ItemConfig.defaults.reorderEnabled,
            title: ItemConfig.defaults.title,
            header: undefined,
            componentName: '',
            component: '',
            props: undefined,
        }
        return result;
    }
}

/** Base for Root or RowOrColumn ItemConfigs
 * @public
 */
export interface RowOrColumnItemConfig extends ItemConfig {
    readonly type: 'row' | 'column';
    /** Note that RowOrColumn ItemConfig contents, can contain ComponentItem itemConfigs.  However
     * when ContentItems are created, these ComponentItem itemConfigs will create a Stack with a child ComponentItem.
     */
    readonly content: readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
}

/** @public */
export namespace RowOrColumnItemConfig {
    export type ChildItemConfig = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

    export function isChildItemConfig(itemConfig: ItemConfig): itemConfig is ChildItemConfig {
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
                throw new UnreachableCaseError('CROCOSPCICIC13687', itemConfig.type);
        }
    }

    export function createCopy(original: RowOrColumnItemConfig, content?: ChildItemConfig[]): RowOrColumnItemConfig {
        const result: RowOrColumnItemConfig = {
            type: original.type,
            content: content !== undefined ? copyContent(content) : copyContent(original.content),
            width: original.width,
            minWidth: original.minWidth,
            height: original.height,
            minHeight: original.minHeight,
            id: original.id,
            isClosable: original.isClosable,
            reorderEnabled: original.reorderEnabled,
            title: original.title,
        }
        return result;
    }

    export function copyContent(original: readonly ChildItemConfig[]): ChildItemConfig[] {
        const count = original.length;
        const result = new Array<ChildItemConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = ItemConfig.createCopy(original[i]) as ChildItemConfig;
        }
        return result;
    }

    export function createDefault(type: 'row' | 'column'): RowOrColumnItemConfig {
        const result: RowOrColumnItemConfig = {
            type,
            content: [],
            width: ItemConfig.defaults.width,
            minWidth: ItemConfig.defaults.minWidth,
            height: ItemConfig.defaults.height,
            minHeight: ItemConfig.defaults.minHeight,
            id: ItemConfig.defaults.id,
            isClosable: ItemConfig.defaults.isClosable,
            reorderEnabled: ItemConfig.defaults.reorderEnabled,
            title: ItemConfig.defaults.title,
        }
        return result;
    }
}

/** 
 * RootItemConfig is the topmost ItemConfig specified by the user.
 * Note that it does not have a corresponding contentItem.  It specifies the one and only child of the Ground ContentItem
 * Note that RootItemConfig can be an ComponentItem itemConfig.  However when the Ground ContentItem's child is created
 * a ComponentItem itemConfig will create a Stack with a child ComponentItem.
 * @public
*/
export type RootItemConfig = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

/** @public */
export namespace RootItemConfig {
    export function createCopy(config: RootItemConfig): RootItemConfig {
        return ItemConfig.createCopy(config) as RootItemConfig;
    }

    export function isRootItemConfig(itemConfig: ItemConfig): itemConfig is RootItemConfig {
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
                throw new UnreachableCaseError('CROCOSPCICIC13687', itemConfig.type);
        }
    }
}

/** @internal */
export interface GroundItemConfig extends ItemConfig {
    readonly type: 'ground';
    width: 100,
    minWidth: 0,
    height: 100,
    minHeight: 0,
    id: '',
    isClosable: false,
    title: '',
    reorderEnabled: false,
}

/** @internal */
export namespace GroundItemConfig {
    export function create(content: RootItemConfig):GroundItemConfig {
        return {
            type: ItemConfig.Type.ground,
            content: [content],
            width: 100,
            minWidth: 0,
            height: 100,
            minHeight: 0,
            id: '',
            isClosable: false,
            title: '',
            reorderEnabled: false,
        }
    }
}

/** @public */
export interface LayoutConfig {
    readonly root: RootItemConfig;
    readonly openPopouts: PopoutLayoutConfig[];
    readonly dimensions: LayoutConfig.Dimensions;
    readonly settings: LayoutConfig.Settings;
    readonly header: LayoutConfig.Header;
    readonly resolved: true,
}

/** @public */
export namespace LayoutConfig {
    export interface Settings {
        // see UserConfig.Settings for comments
        readonly constrainDragToContainer: boolean;
        readonly reorderEnabled: boolean; // also in ItemConfig which takes precedence
        readonly selectionEnabled: boolean;
        readonly popoutWholeStack: boolean;
        readonly blockedPopoutsThrowError: boolean;
        readonly closePopoutsOnUnload: boolean;
        readonly showPopoutIcon: boolean;
        readonly showMaximiseIcon: boolean;
        readonly showCloseIcon: boolean;
        readonly responsiveMode: Settings.ResponsiveMode;
        readonly tabOverlapAllowance: number;
        readonly reorderOnTabMenuClick: boolean;
        readonly tabControlOffset: number;
    }

    export namespace Settings {
        export type ResponsiveMode = 'none' | 'always' | 'onload';
        export namespace ResponsiveMode {
            export const none = 'none';
            export const always = 'always';
            export const onload = 'onload';
        }

        /** @internal */
        export const defaults: LayoutConfig.Settings = {
            constrainDragToContainer: true,
            reorderEnabled: true,
            selectionEnabled: false,
            popoutWholeStack: false,
            blockedPopoutsThrowError: true,
            closePopoutsOnUnload: true,
            showPopoutIcon: true,
            showMaximiseIcon: true,
            showCloseIcon: true,
            responsiveMode: LayoutConfig.Settings.ResponsiveMode.onload,
            tabOverlapAllowance: 0,
            reorderOnTabMenuClick: true,
            tabControlOffset: 10
        } as const;

        export function createCopy(original: Settings): Settings {
            return {
                constrainDragToContainer: original.constrainDragToContainer,
                reorderEnabled: original.reorderEnabled,
                selectionEnabled: original.selectionEnabled,
                popoutWholeStack: original.popoutWholeStack,
                blockedPopoutsThrowError: original.blockedPopoutsThrowError,
                closePopoutsOnUnload: original.closePopoutsOnUnload,
                showPopoutIcon: original.showPopoutIcon,
                showMaximiseIcon: original.showMaximiseIcon,
                showCloseIcon: original.showCloseIcon,
                responsiveMode: original.responsiveMode,
                tabOverlapAllowance: original.tabOverlapAllowance,
                reorderOnTabMenuClick: original.reorderOnTabMenuClick,
                tabControlOffset: original.tabControlOffset,
            }
        }
    }

    export interface Dimensions {
        // see UserConfig.Dimensions for comments
        readonly borderWidth: number;
        readonly borderGrabWidth: number,
        readonly minItemHeight: number;
        readonly minItemWidth: number;
        readonly headerHeight: number;
        readonly dragProxyWidth: number;
        readonly dragProxyHeight: number;
    }

    export namespace Dimensions {
        export function createCopy(original: Dimensions): Dimensions {
            return {
                borderWidth: original.borderWidth,
                borderGrabWidth: original.borderGrabWidth,
                minItemHeight: original.minItemHeight,
                minItemWidth: original.minItemWidth,
                headerHeight: original.headerHeight,
                dragProxyWidth: original.dragProxyWidth,
                dragProxyHeight: original.dragProxyHeight,
            }
        }

        /** @internal */
        export const defaults: LayoutConfig.Dimensions = {
            borderWidth: 5,
            borderGrabWidth: 15,
            minItemHeight: 10,
            minItemWidth: 10,
            headerHeight: 20,
            dragProxyWidth: 300,
            dragProxyHeight: 200
        } as const;
    }

    export interface Header {
        readonly show: false | Side;
        readonly popout: false | string;
        readonly dock: string;
        readonly maximise: false | string;
        readonly minimise: string;
        readonly close: string;
        readonly tabDropdown: string;
    }

    export namespace Header {
        export function createCopy(original: Header): Header {
            return {
                show: original.show,
                popout: original.popout,
                dock: original.dock,
                close: original.close,
                maximise: original.maximise,
                minimise: original.minimise,
                tabDropdown: original.tabDropdown,
            }
        }

        /** @internal */
        export const defaults: LayoutConfig.Header = {
            show: Side.top,
            popout: 'open in new window',
            dock: 'dock',
            maximise: 'maximise',
            minimise: 'minimise',
            close: 'close',
            tabDropdown: 'additional tabs'
        } as const;
    }

    export function isPopout(config: LayoutConfig): config is PopoutLayoutConfig {
        return 'parentId' in config;
    }

    export function createCopy(config: LayoutConfig): LayoutConfig {
        if (isPopout(config)) {
            return PopoutLayoutConfig.createCopy(config);
        } else {
            const result: LayoutConfig = {
                root: RootItemConfig.createCopy(config.root),
                openPopouts: LayoutConfig.copyOpenPopouts(config.openPopouts),
                settings: LayoutConfig.Settings.createCopy(config.settings),
                dimensions: LayoutConfig.Dimensions.createCopy(config.dimensions),
                header: LayoutConfig.Header.createCopy(config.header),
                resolved: config.resolved,
            }
            return result;
        }
    }

    export function copyOpenPopouts(original: PopoutLayoutConfig[]): PopoutLayoutConfig[] {
        const count = original.length;
        const result = new Array<PopoutLayoutConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = PopoutLayoutConfig.createCopy(original[i]);
        }
        return result;
    }
}

/** @public */
export interface PopoutLayoutConfig extends LayoutConfig {
    readonly parentId: string | null;
    readonly indexInParent: number | null;
    readonly window: PopoutLayoutConfig.Window;
}

/** @public */
export namespace PopoutLayoutConfig {
    export interface Window {
        readonly width: number | null,
        readonly height: number | null,
        readonly left: number | null,
        readonly top: number | null,
    }

    export namespace Window {
        export function createCopy(original: Window): Window {
            return {
                width: original.width,
                height: original.height,
                left: original.left,
                top: original.top,
            }
        }

        /** @internal */
        export const defaults: PopoutLayoutConfig.Window = {
            width: null,
            height: null,
            left: null,
            top: null,
        } as const;
    }

    export function createCopy(original: PopoutLayoutConfig): PopoutLayoutConfig {
        const result: PopoutLayoutConfig = {
            root: RootItemConfig.createCopy(original.root),
            openPopouts: LayoutConfig.copyOpenPopouts(original.openPopouts),
            settings: LayoutConfig.Settings.createCopy(original.settings),
            dimensions: LayoutConfig.Dimensions.createCopy(original.dimensions),
            header: LayoutConfig.Header.createCopy(original.header),
            parentId: original.parentId,
            indexInParent: original.indexInParent,
            window: PopoutLayoutConfig.Window.createCopy(original.window),
            resolved: original.resolved,
        }
        return result;
    }
}

/** @public @deprecated - use {@link (LayoutConfig:interface)} */
export type Config = LayoutConfig;
