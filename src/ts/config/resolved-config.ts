import { AssertError, UnreachableCaseError } from '../errors/internal-error';
import { ConfigMinifier } from '../utils/config-minifier';
import { ItemType, JsonValue, ResponsiveMode, Side } from '../utils/types';
import { deepExtendValue } from '../utils/utils';

/** @public */
export interface ResolvedItemConfig {
    // see ItemConfig for comments
    readonly type: ItemType;
    readonly content: readonly ResolvedItemConfig[];
    readonly width: number;
    readonly minWidth: number;
    readonly height: number;
    readonly minHeight: number;
    // id no longer specifies whether an Item is maximised.  This is now done by HeaderItemConfig.maximised
    readonly id: string;
    readonly isClosable: boolean;
}

/** @public */
export namespace ResolvedItemConfig {
    export const defaults: ResolvedItemConfig = {
        type: ItemType.ground, // not really default but need something
        content: [],
        width: 50,
        minWidth: 0,
        height: 50,
        minHeight: 0,
        id: '',
        isClosable: true,
    } as const;

    /** Creates a copy of the original ResolvedItemConfig using an alternative content if specified */
    export function createCopy(original: ResolvedItemConfig, content?: ResolvedItemConfig[]): ResolvedItemConfig {
        switch (original.type) {
            case ItemType.ground:
            case ItemType.row:
            case ItemType.column:
                return ResolvedRowOrColumnItemConfig.createCopy(original as ResolvedRowOrColumnItemConfig,
                    content as ResolvedRowOrColumnItemConfig.ChildItemConfig[]);

            case ItemType.stack:
                return ResolvedStackItemConfig.createCopy(original as ResolvedStackItemConfig, content as ResolvedComponentItemConfig[]);

            case ItemType.component:
                return ResolvedComponentItemConfig.createCopy(original as ResolvedComponentItemConfig);

            default:
                throw new UnreachableCaseError('CICC91354', original.type, 'Invalid Config Item type specified');
        }
    }

    export function createDefault(type: ItemType): ResolvedItemConfig {
        switch (type) {
            case ItemType.ground:
                throw new AssertError('CICCDR91562'); // Get default root from LayoutConfig
            case ItemType.row:
            case ItemType.column:
                return ResolvedRowOrColumnItemConfig.createDefault(type);

            case ItemType.stack:
                return ResolvedStackItemConfig.createDefault();

            case ItemType.component:
                return ResolvedComponentItemConfig.createDefault();

            default:
                throw new UnreachableCaseError('CICCDD91563', type, 'Invalid Config Item type specified');
        }
    }

    export function isComponentItem(itemConfig: ResolvedItemConfig): itemConfig is ResolvedComponentItemConfig {
        return itemConfig.type === ItemType.component;
    }

    export function isStackItem(itemConfig: ResolvedItemConfig): itemConfig is ResolvedStackItemConfig {
        return itemConfig.type === ItemType.stack;
    }

    /** @internal */
    export function isGroundItem(itemConfig: ResolvedItemConfig): itemConfig is ResolvedGroundItemConfig {
        return itemConfig.type === ItemType.ground;
    }
}

// Stack or Component
/** @public */
export interface ResolvedHeaderedItemConfig extends ResolvedItemConfig {
    header: ResolvedHeaderedItemConfig.Header | undefined; // undefined means get header settings from LayoutConfig
    readonly maximised: boolean;
}

/** @public */
export namespace ResolvedHeaderedItemConfig {
    export const defaultMaximised = false;

    export interface Header {
        // undefined means get property value from LayoutConfig
        readonly show: false | Side | undefined;
        readonly popout: false | string | undefined;
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
export interface ResolvedStackItemConfig extends ResolvedHeaderedItemConfig {
    readonly type: 'stack';
    readonly content: ResolvedComponentItemConfig[];
    /** The index of the active item in the Stack.  Only undefined if the Stack is empty. */
    readonly activeItemIndex: number | undefined;
}

/** @public */
export namespace ResolvedStackItemConfig {
    export const defaultActiveItemIndex = 0;

    export function createCopy(original: ResolvedStackItemConfig, content?: ResolvedComponentItemConfig[]): ResolvedStackItemConfig {
        const result: ResolvedStackItemConfig = {
            type: original.type,
            content: content !== undefined ? copyContent(content) : copyContent(original.content),
            width: original.width,
            minWidth: original.minWidth,
            height: original.height,
            minHeight: original.minHeight,
            id: original.id,
            maximised: original.maximised,
            isClosable: original.isClosable,
            activeItemIndex: original.activeItemIndex,
            header: ResolvedHeaderedItemConfig.Header.createCopy(original.header),
        }
        return result;
    }

    export function copyContent(original: ResolvedComponentItemConfig[]): ResolvedComponentItemConfig[] {
        const count = original.length;
        const result = new Array<ResolvedComponentItemConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = ResolvedItemConfig.createCopy(original[i]) as ResolvedComponentItemConfig;
        }
        return result;
    }

    export function createDefault(): ResolvedStackItemConfig {
        const result: ResolvedStackItemConfig = {
            type: ItemType.stack,
            content: [],
            width: ResolvedItemConfig.defaults.width,
            minWidth: ResolvedItemConfig.defaults.minWidth,
            height: ResolvedItemConfig.defaults.height,
            minHeight: ResolvedItemConfig.defaults.minHeight,
            id: ResolvedItemConfig.defaults.id,
            maximised: ResolvedHeaderedItemConfig.defaultMaximised,
            isClosable: ResolvedItemConfig.defaults.isClosable,
            activeItemIndex: defaultActiveItemIndex,
            header: undefined,
        }
        return result;
    }
}

/** @public */
export interface ResolvedComponentItemConfig extends ResolvedHeaderedItemConfig {
    // see ComponentItemConfig for comments
    readonly type: 'component';
    readonly content: [];
    readonly title: string;
    readonly reorderEnabled: boolean; // Takes precedence over LayoutConfig.reorderEnabled.
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    readonly componentType: JsonValue;
    readonly componentState?: JsonValue;
}

/** @public */
export namespace ResolvedComponentItemConfig {
    export const defaultReorderEnabled = true;

    export function resolveComponentTypeName(itemConfig: ResolvedComponentItemConfig): string | undefined {
        const componentType = itemConfig.componentType;
        if (typeof componentType === 'string') {
            return componentType;
        } else {
            return undefined;
        }
    }

    export function createCopy(original: ResolvedComponentItemConfig): ResolvedComponentItemConfig {
        const result: ResolvedComponentItemConfig = {
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
            header: ResolvedHeaderedItemConfig.Header.createCopy(original.header),
            componentType: original.componentType,
            componentState: deepExtendValue(undefined, original.componentState) as JsonValue,
        }
        return result;
    }

    export function createDefault(componentType: JsonValue = '', componentState?: JsonValue, title = ''): ResolvedComponentItemConfig {
        const result: ResolvedComponentItemConfig = {
            type: ItemType.component,
            content: [],
            width: ResolvedItemConfig.defaults.width,
            minWidth: ResolvedItemConfig.defaults.minWidth,
            height: ResolvedItemConfig.defaults.height,
            minHeight: ResolvedItemConfig.defaults.minHeight,
            id: ResolvedItemConfig.defaults.id,
            maximised: ResolvedHeaderedItemConfig.defaultMaximised,
            isClosable: ResolvedItemConfig.defaults.isClosable,
            reorderEnabled: ResolvedComponentItemConfig.defaultReorderEnabled,
            title,
            header: undefined,
            componentType,
            componentState,
        }
        return result;
    }

    export function copyComponentType(componentType: JsonValue): JsonValue {
        return deepExtendValue({}, componentType) as JsonValue
    }
}

/** Base for Root or RowOrColumn ItemConfigs
 * @public
 */
export interface ResolvedRowOrColumnItemConfig extends ResolvedItemConfig {
    readonly type: 'row' | 'column';
    /** Note that RowOrColumn ResolvedItemConfig contents, can contain ComponentItem itemConfigs.  However
     * when ContentItems are created, these ComponentItem itemConfigs will create a Stack with a child ComponentItem.
     */
    readonly content: readonly (ResolvedRowOrColumnItemConfig | ResolvedStackItemConfig | ResolvedComponentItemConfig)[];
}

/** @public */
export namespace ResolvedRowOrColumnItemConfig {
    export type ChildItemConfig = ResolvedRowOrColumnItemConfig | ResolvedStackItemConfig | ResolvedComponentItemConfig;

    export function isChildItemConfig(itemConfig: ResolvedItemConfig): itemConfig is ChildItemConfig {
        switch (itemConfig.type) {
            case ItemType.row:
            case ItemType.column:
            case ItemType.stack:
            case ItemType.component:
                return true;
            case ItemType.ground:
                return false;
            default:
                throw new UnreachableCaseError('CROCOSPCICIC13687', itemConfig.type);
        }
    }

    export function createCopy(original: ResolvedRowOrColumnItemConfig, content?: ChildItemConfig[]): ResolvedRowOrColumnItemConfig {
        const result: ResolvedRowOrColumnItemConfig = {
            type: original.type,
            content: content !== undefined ? copyContent(content) : copyContent(original.content),
            width: original.width,
            minWidth: original.minWidth,
            height: original.height,
            minHeight: original.minHeight,
            id: original.id,
            isClosable: original.isClosable,
        }
        return result;
    }

    export function copyContent(original: readonly ChildItemConfig[]): ChildItemConfig[] {
        const count = original.length;
        const result = new Array<ChildItemConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = ResolvedItemConfig.createCopy(original[i]) as ChildItemConfig;
        }
        return result;
    }

    export function createDefault(type: 'row' | 'column'): ResolvedRowOrColumnItemConfig {
        const result: ResolvedRowOrColumnItemConfig = {
            type,
            content: [],
            width: ResolvedItemConfig.defaults.width,
            minWidth: ResolvedItemConfig.defaults.minWidth,
            height: ResolvedItemConfig.defaults.height,
            minHeight: ResolvedItemConfig.defaults.minHeight,
            id: ResolvedItemConfig.defaults.id,
            isClosable: ResolvedItemConfig.defaults.isClosable,
        }
        return result;
    }
}

/**
 * RootItemConfig is the topmost ResolvedItemConfig specified by the user.
 * Note that it does not have a corresponding contentItem.  It specifies the one and only child of the Ground ContentItem
 * Note that RootItemConfig can be an ComponentItem itemConfig.  However when the Ground ContentItem's child is created
 * a ComponentItem itemConfig will create a Stack with a child ComponentItem.
 * @public
*/
export type ResolvedRootItemConfig = ResolvedRowOrColumnItemConfig | ResolvedStackItemConfig | ResolvedComponentItemConfig;

/** @public */
export namespace ResolvedRootItemConfig {
    export function createCopy(config: ResolvedRootItemConfig): ResolvedRootItemConfig {
        return ResolvedItemConfig.createCopy(config) as ResolvedRootItemConfig;
    }

    export function isRootItemConfig(itemConfig: ResolvedItemConfig): itemConfig is ResolvedRootItemConfig {
        switch (itemConfig.type) {
            case ItemType.row:
            case ItemType.column:
            case ItemType.stack:
            case ItemType.component:
                return true;
            case ItemType.ground:
                return false;
            default:
                throw new UnreachableCaseError('CROCOSPCICIC13687', itemConfig.type);
        }
    }
}

/** @internal */
export interface ResolvedGroundItemConfig extends ResolvedItemConfig {
    readonly type: 'ground';
    readonly width: 100,
    readonly minWidth: 0,
    readonly height: 100,
    readonly minHeight: 0,
    readonly id: '',
    readonly isClosable: false,
    readonly title: '',
    readonly reorderEnabled: false,
}

/** @internal */
export namespace ResolvedGroundItemConfig {
    export function create(rootItemConfig: ResolvedRootItemConfig | undefined):ResolvedGroundItemConfig {
        const content = rootItemConfig === undefined ? [] : [rootItemConfig];
        return {
            type: ItemType.ground,
            content,
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
export interface ResolvedLayoutConfig {
    readonly root: ResolvedRootItemConfig | undefined;
    readonly openPopouts: ResolvedPopoutLayoutConfig[];
    readonly dimensions: ResolvedLayoutConfig.Dimensions;
    readonly settings: ResolvedLayoutConfig.Settings;
    readonly header: ResolvedLayoutConfig.Header;
    readonly resolved: true,
}

/** @public */
export namespace ResolvedLayoutConfig {
    export interface Settings {
        // see Config.Settings for comments
        readonly constrainDragToContainer: boolean;
        readonly reorderEnabled: boolean; // also in ResolvedItemConfig which takes precedence
        readonly popoutWholeStack: boolean;
        readonly blockedPopoutsThrowError: boolean;
        readonly closePopoutsOnUnload: boolean;
        readonly responsiveMode: ResponsiveMode;
        readonly tabOverlapAllowance: number;
        readonly reorderOnTabMenuClick: boolean;
        readonly tabControlOffset: number;
        readonly popInOnClose: boolean;
    }

    export namespace Settings {
        export const defaults: ResolvedLayoutConfig.Settings = {
            constrainDragToContainer: true,
            reorderEnabled: true,
            popoutWholeStack: false,
            blockedPopoutsThrowError: true,
            closePopoutsOnUnload: true,
            responsiveMode: ResponsiveMode.none, // was onload
            tabOverlapAllowance: 0,
            reorderOnTabMenuClick: true,
            tabControlOffset: 10,
            popInOnClose: false,
        } as const;

        export function createCopy(original: Settings): Settings {
            return {
                constrainDragToContainer: original.constrainDragToContainer,
                reorderEnabled: original.reorderEnabled,
                popoutWholeStack: original.popoutWholeStack,
                blockedPopoutsThrowError: original.blockedPopoutsThrowError,
                closePopoutsOnUnload: original.closePopoutsOnUnload,
                responsiveMode: original.responsiveMode,
                tabOverlapAllowance: original.tabOverlapAllowance,
                reorderOnTabMenuClick: original.reorderOnTabMenuClick,
                tabControlOffset: original.tabControlOffset,
                popInOnClose: original.popInOnClose,
            }
        }
    }

    export interface Dimensions {
        // see LayoutConfig.Dimensions for comments
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

        export const defaults: ResolvedLayoutConfig.Dimensions = {
            borderWidth: 5,
            borderGrabWidth: 5,
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
        readonly close: false | string;
        readonly tabDropdown: false | string;
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

        export const defaults: ResolvedLayoutConfig.Header = {
            show: Side.top,
            popout: 'open in new window',
            dock: 'dock',
            maximise: 'maximise',
            minimise: 'minimise',
            close: 'close',
            tabDropdown: 'additional tabs'
        } as const;
    }

    export function isPopout(config: ResolvedLayoutConfig): config is ResolvedPopoutLayoutConfig {
        return 'parentId' in config;
    }

    export function createDefault(): ResolvedLayoutConfig {
        const result: ResolvedLayoutConfig = {
            root: undefined,
            openPopouts: [],
            dimensions: ResolvedLayoutConfig.Dimensions.defaults,
            settings: ResolvedLayoutConfig.Settings.defaults,
            header: ResolvedLayoutConfig.Header.defaults,
            resolved: true,
        }
        return result;
    }

    export function createCopy(config: ResolvedLayoutConfig): ResolvedLayoutConfig {
        if (isPopout(config)) {
            return ResolvedPopoutLayoutConfig.createCopy(config);
        } else {
            const result: ResolvedLayoutConfig = {
                root: config.root === undefined ? undefined : ResolvedRootItemConfig.createCopy(config.root),
                openPopouts: ResolvedLayoutConfig.copyOpenPopouts(config.openPopouts),
                settings: ResolvedLayoutConfig.Settings.createCopy(config.settings),
                dimensions: ResolvedLayoutConfig.Dimensions.createCopy(config.dimensions),
                header: ResolvedLayoutConfig.Header.createCopy(config.header),
                resolved: config.resolved,
            }
            return result;
        }
    }

    export function copyOpenPopouts(original: ResolvedPopoutLayoutConfig[]): ResolvedPopoutLayoutConfig[] {
        const count = original.length;
        const result = new Array<ResolvedPopoutLayoutConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = ResolvedPopoutLayoutConfig.createCopy(original[i]);
        }
        return result;
    }

    /**
     * Takes a GoldenLayout configuration object and
     * replaces its keys and values recursively with
     * one letter counterparts
     */
    export function minifyConfig(layoutConfig: ResolvedLayoutConfig): ResolvedLayoutConfig {
        return ConfigMinifier.translateObject(layoutConfig, true) as ResolvedLayoutConfig;
    }

    /**
     * Takes a configuration Object that was previously minified
     * using minifyConfig and returns its original version
     */
    export function unminifyConfig(minifiedConfig: ResolvedLayoutConfig): ResolvedLayoutConfig {
        return ConfigMinifier.translateObject(minifiedConfig, false) as ResolvedLayoutConfig;
    }
}

/** @public */
export interface ResolvedPopoutLayoutConfig extends ResolvedLayoutConfig {
    readonly parentId: string | null;
    readonly indexInParent: number | null;
    readonly window: ResolvedPopoutLayoutConfig.Window;
}

/** @public */
export namespace ResolvedPopoutLayoutConfig {
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

        export const defaults: ResolvedPopoutLayoutConfig.Window = {
            width: null,
            height: null,
            left: null,
            top: null,
        } as const;
    }

    export function createCopy(original: ResolvedPopoutLayoutConfig): ResolvedPopoutLayoutConfig {
        const result: ResolvedPopoutLayoutConfig = {
            root: original.root === undefined ? undefined : ResolvedRootItemConfig.createCopy(original.root),
            openPopouts: ResolvedLayoutConfig.copyOpenPopouts(original.openPopouts),
            settings: ResolvedLayoutConfig.Settings.createCopy(original.settings),
            dimensions: ResolvedLayoutConfig.Dimensions.createCopy(original.dimensions),
            header: ResolvedLayoutConfig.Header.createCopy(original.header),
            parentId: original.parentId,
            indexInParent: original.indexInParent,
            window: ResolvedPopoutLayoutConfig.Window.createCopy(original.window),
            resolved: original.resolved,
        }
        return result;
    }
}
