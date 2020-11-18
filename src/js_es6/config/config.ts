import { AssertError, UnreachableCaseError } from '../errors/internal-error';
import { JsonValue, Side } from '../utils/types';
import { deepExtendValue } from '../utils/utils';

export interface ItemConfig {
    // see UserItemConfig for comments
    readonly type: ItemConfig.Type;
    content: readonly ItemConfig[];
    width: number;
    readonly minWidth: number;
    height: number;
    readonly minHeight: number;
    // Currently id has 2 purposes. It can be used by user to identify Items and it is also used to track which Item is maximised
    // This is confusing
    // It should be refactored to only exist for User purposes
    // A new property "maximised: true | undefined" should be added to track which Item is maximised
    id: string | string[];
    readonly isClosable: boolean;
    title: string;
    readonly reorderEnabled: boolean; // Takes precedence over ManagerConfig.reorderEnabled. Should be settings.reorderEnabled
}

export namespace ItemConfig {
    export const enum Type {
        root = 'root',
        row = 'row',
        column = 'column',
        stack = 'stack',
        component = 'component',
        reactComponent = 'react-component',
    }

    export type HeightOrWidthPropertyName = 'height' | 'width';

    export const defaults: ItemConfig = {
        type: ItemConfig.Type.root, // not really default but need something
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
            case ItemConfig.Type.root:
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                return RowOrColumnOrStackParentItemConfig.createCopy(original as RowOrColumnOrStackParentItemConfig,
                    content as RowOrColumnOrStackParentItemConfig.ChildItemConfig[]);

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
            case ItemConfig.Type.root:
                throw new AssertError('CICCDR91562'); // Get default root from ManagerConfig
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
                return RowOrColumnOrStackParentItemConfig.createDefault(type);

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

    export function isRoot(itemConfig: ItemConfig): itemConfig is RootItemConfig {
        return itemConfig.type === ItemConfig.Type.root;
    }

    export function isComponentItem(itemConfig: ItemConfig): itemConfig is ComponentItemConfig {
        return itemConfig.type === ItemConfig.Type.component || itemConfig.type === ItemConfig.Type.reactComponent;
    }
}

// Stack or Component
export interface HeaderedItemConfig extends ItemConfig {
    header: HeaderedItemConfig.Header | undefined; // undefined means get header settings from ManagerConfig
}

export namespace HeaderedItemConfig {
    export interface Header {
        // undefined means get property value from ManagerConfig
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

export interface StackItemConfig extends HeaderedItemConfig {
    readonly type: ItemConfig.Type.stack;
    readonly content: ComponentItemConfig[];
    activeItemIndex: number;
}

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
            isClosable: ItemConfig.defaults.isClosable,
            reorderEnabled: ItemConfig.defaults.reorderEnabled,
            title: ItemConfig.defaults.title,
            activeItemIndex: defaultActiveItemIndex,
            header: undefined,
        }
        return result;
    }
}

export interface ComponentItemConfig extends HeaderedItemConfig {
    readonly content: [];
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    readonly componentName: string;
}

export namespace ComponentItemConfig {
    export function isReact(config: ComponentItemConfig): config is ReactComponentConfig {
        return config.type === ItemConfig.Type.reactComponent;
    }
    export function isSerialisable(config: ComponentItemConfig): config is SerialisableComponentConfig {
        return config.type === ItemConfig.Type.component;
    }
}

export interface SerialisableComponentConfig extends ComponentItemConfig {
    // see UserJsonComponentConfig for comments
    readonly type: ItemConfig.Type.component;
    componentState: JsonValue;
}

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

export interface ReactComponentConfig extends ComponentItemConfig {
    // see UserReactComponentConfig for comments
    readonly type: ItemConfig.Type.reactComponent;
    readonly component: string;
    props?: unknown;
}

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

/** Base for Root or RowOrColumn ItemConfigs */
export interface RowOrColumnOrStackParentItemConfig extends ItemConfig {
    /** Note that Root and RowOrColumn ItemConfig contents, can contain ComponentItem itemConfigs.  However
     * when ContentItems are created, these ComponentItem itemConfigs will create a Stack with a child ComponentItem.
     */
    readonly content: readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
}

export namespace RowOrColumnOrStackParentItemConfig {
    export type ChildItemConfig = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

    export function isChildItemConfig(itemConfig: ItemConfig): itemConfig is ChildItemConfig {
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
                throw new UnreachableCaseError('CROCOSPCICIC13687', itemConfig.type);
        }
    }

    export function createCopy(original: RowOrColumnOrStackParentItemConfig, content?: ChildItemConfig[]): RowOrColumnOrStackParentItemConfig {
        const result: RowOrColumnOrStackParentItemConfig = {
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

    export function createDefault(type: ItemConfig.Type): RowOrColumnOrStackParentItemConfig {
        const result: RowOrColumnOrStackParentItemConfig = {
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

export interface RowOrColumnItemConfig extends RowOrColumnOrStackParentItemConfig {
    readonly type: ItemConfig.Type.row | ItemConfig.Type.column;
}

export interface RootItemConfig extends RowOrColumnOrStackParentItemConfig {
    readonly type: ItemConfig.Type.root;
}

export interface ManagerConfig {
    readonly content: readonly (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
    readonly openPopouts: PopoutManagerConfig[];
    readonly dimensions: ManagerConfig.Dimensions;
    readonly settings: ManagerConfig.Settings;
    readonly header: ManagerConfig.Header;
    // maximisedItemId should be removed in future
    // Instead LayoutManager should scan Config Items for first Item with property maximised = true
    // when it first loads config
    // See comments on property "id" in ItemConfig
    readonly maximisedItemId: string | null;
}

export namespace ManagerConfig {
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
        export const enum ResponsiveMode {
            none = 'none',
            always = 'always',
            onload = 'onload',
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

        export const defaults: ManagerConfig.Dimensions = {
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

        export const defaults: ManagerConfig.Header = {
            show: Side.top,
            popout: 'open in new window',
            dock: 'dock',
            maximise: 'maximise',
            minimise: 'minimise',
            close: 'close',
            tabDropdown: 'additional tabs'
        } as const;
    }

    export function isPopout(config: ManagerConfig): config is PopoutManagerConfig {
        return 'parentId' in config;
    }

    export function createCopy(config: ManagerConfig): ManagerConfig {
        if (isPopout(config)) {
            return PopoutManagerConfig.createCopy(config);
        } else {
            return Config.createCopy(config as Config);
        }
    }

    export function createRootItemConfig(managerConfig: ManagerConfig, 
        content?: RowOrColumnOrStackParentItemConfig.ChildItemConfig[]
    ): RootItemConfig {
        return {
            type: ItemConfig.Type.root,
            content: content ?? managerConfig.content,
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

    export function copyOpenPopouts(original: PopoutManagerConfig[]): PopoutManagerConfig[] {
        const count = original.length;
        const result = new Array<PopoutManagerConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = PopoutManagerConfig.createCopy(original[i]);
        }
        return result;
    }
}

export interface PopoutManagerConfig extends ManagerConfig {
    readonly parentId: string | null;
    readonly indexInParent: number | null;
    readonly window: PopoutManagerConfig.Window;
}

export namespace PopoutManagerConfig {
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

        export const defaults: PopoutManagerConfig.Window = {
            width: null,
            height: null,
            left: null,
            top: null,
        } as const;
    }

    export function createCopy(original: PopoutManagerConfig): PopoutManagerConfig {
        const result: PopoutManagerConfig = {
            content: RowOrColumnOrStackParentItemConfig.copyContent(original.content),
            openPopouts: ManagerConfig.copyOpenPopouts(original.openPopouts),
            settings: ManagerConfig.Settings.createCopy(original.settings),
            dimensions: ManagerConfig.Dimensions.createCopy(original.dimensions),
            header: ManagerConfig.Header.createCopy(original.header),
            maximisedItemId: original.maximisedItemId,
            parentId: original.parentId,
            indexInParent: original.indexInParent,
            window: PopoutManagerConfig.Window.createCopy(original.window),
        }
        return result;
    }
}

export interface Config extends ManagerConfig {
    readonly resolved: true,
}

export namespace Config {

    export function createCopy(original: Config): Config {
        const result: Config = {
            resolved: original.resolved,
            content: RowOrColumnOrStackParentItemConfig.copyContent(original.content),
            openPopouts: ManagerConfig.copyOpenPopouts(original.openPopouts),
            settings: ManagerConfig.Settings.createCopy(original.settings),
            dimensions: ManagerConfig.Dimensions.createCopy(original.dimensions),
            header: ManagerConfig.Header.createCopy(original.header),
            maximisedItemId: original.maximisedItemId,
        }
        return result;
    }
}
