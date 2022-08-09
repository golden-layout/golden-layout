import { ConfigurationError } from '../errors/external-error';
import { AssertError, UnexpectedUndefinedError, UnreachableCaseError } from '../errors/internal-error';
import { I18nStringId, i18nStrings } from '../utils/i18n-strings';
import { ItemType, JsonValue, ResponsiveMode, Side, SizeUnitEnum } from '../utils/types';
import { deepExtendValue, splitStringAtFirstNonNumericChar } from '../utils/utils';
import {
    ResolvedComponentItemConfig,
    ResolvedHeaderedItemConfig,
    ResolvedItemConfig,
    ResolvedLayoutConfig,
    ResolvedPopoutLayoutConfig,
    ResolvedRootItemConfig,
    ResolvedRowOrColumnItemConfig,
    ResolvedStackItemConfig
} from "./resolved-config";

/** @public */
export interface ItemConfig {
    /**
     * The type of the item. Possible values are 'row', 'column', 'stack', 'component'.
     */
    type: ItemType;

    /**
     * An array of configurations for items that will be created as children of this item.
     */
    content?: ItemConfig[];

    /**
     * The width of this item, relative to the other children of its parent in percent
     * @deprecated use {@link (ItemConfig:interface).size} instead
     */
    width?: number;

    /**
     * The minimum width of this item in pixels
     * CAUTION - Not tested - do not use
     * @deprecated use {@link (ItemConfig:interface).minSize} instead
     */
    minWidth?: number;

    /**
     * The height of this item, relative to the other children of its parent in percent
     * @deprecated use {@link (ItemConfig:interface).size} instead
     */
    height?: number;

    /**
     * The minimum height of this item in pixels
     * CAUTION - Not tested - do not use
     * @deprecated use {@link (ItemConfig:interface).minSize} instead
     */
    minHeight?: number;

    /**
     * The size of this item.
     * For rows, it specifies height. For columns, it specifies width.
     * Has format \<number\>\<{@link SizeUnit}\>. Currently only supports units `fr` and `%`.
     *
     * Space is first proportionally allocated to items with sizeUnit `%`.
     * If there is any space left over (less than 100% allocated), then the
     * remainder is allocated to the items with unit `fr` according to the fractional size.
     * If more than 100% is allocated, then an extra 50% is allocated to items with unit `fr` and
     * is allocated to each item according to its fractional size. All item sizes are then adjusted
     * to bring the total back to 100%
     */
    size?: string;

    /**
     * The size of this item.
     * For rows, it specifies height. For columns, it specifies width.
     * Has format <number><sizeUnit>. Currently only supports units `px`
     */
    minSize?: string;

    /**
     * A string that can be used to identify a ContentItem.
     * Do NOT assign an array.  This only exists for legacy purposes.  If an array is assigned, the first element
     * will become the id.
     */
    id?: string;

    /**
     * Determines if the item is closable. If false, the x on the items tab will be hidden and container.close()
     * will return false
     * Default: true
     */
    isClosable?: boolean;

    /**
     * The title of the item as displayed on its tab and on popout windows
     * Default: componentType.toString() or ''
     * @deprecated only Component has a title
     */
    title?: string;
}

/** @public */
export namespace ItemConfig {
    /** @internal */
    export const enum SizeWidthHeightSpecificationType {
        None,
        Size,
        WidthOrHeight,
    }

    /** @internal */
    export function resolve(itemConfig: ItemConfig, rowAndColumnChildLegacySizeDefault: boolean): ResolvedItemConfig {
        switch (itemConfig.type) {
            case ItemType.ground:
                throw new ConfigurationError('ItemConfig cannot specify type ground', JSON.stringify(itemConfig));
            case ItemType.row:
            case ItemType.column:
                return RowOrColumnItemConfig.resolve(itemConfig as RowOrColumnItemConfig, rowAndColumnChildLegacySizeDefault);

            case ItemType.stack:
                return StackItemConfig.resolve(itemConfig as StackItemConfig, rowAndColumnChildLegacySizeDefault);

            case ItemType.component:
                return ComponentItemConfig.resolve(itemConfig as ComponentItemConfig, rowAndColumnChildLegacySizeDefault);

            default:
                throw new UnreachableCaseError('UCUICR55499', itemConfig.type);
        }
    }

    /** @internal */
    export function resolveContent(content: ItemConfig[] | undefined): ResolvedItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const result = new Array<ResolvedItemConfig>(count);
            for (let i = 0; i < count; i++) {
                result[i] = ItemConfig.resolve(content[i], false);
            }
            return result;
        }
    }

    /** @internal */
    export function resolveId(id: string | string[] | undefined): string {
        if (id === undefined) {
            return ResolvedItemConfig.defaults.id;
        } else {
            if (Array.isArray(id)) {
                if (id.length === 0) {
                    return ResolvedItemConfig.defaults.id;
                } else {
                    return id[0];
                }
            } else {
                return id;
            }
        }
    }

    /** @internal */
    export function resolveSize(
        size: string | undefined,
        width: number | undefined,
        height: number | undefined,
        rowAndColumnChildLegacySizeDefault: boolean):
    SizeWithUnit {
        // Remove support for rowAndColumnChildLegacySizeDefault in a major version release

        if (size !== undefined) {
            return parseSize(size, [SizeUnitEnum.Percent, SizeUnitEnum.Fractional]);
        } else {
            if (width !== undefined || height !== undefined) {
                if (width !== undefined) {
                    return { size: width, sizeUnit: SizeUnitEnum.Percent };
                } else {
                    if (height !== undefined) {
                        return { size: height, sizeUnit: SizeUnitEnum.Percent };
                    } else {
                        throw new UnexpectedUndefinedError('CRS33390');
                    }
                }
            } else {
                if (rowAndColumnChildLegacySizeDefault) {
                    return { size: 50, sizeUnit: SizeUnitEnum.Percent };
                } else {
                    return { size: ResolvedItemConfig.defaults.size, sizeUnit: ResolvedItemConfig.defaults.sizeUnit };
                }
            }
        }
    }

    /** @internal */
    export function resolveMinSize(minSize: string | undefined, minWidth: number | undefined, minHeight: number | undefined): UndefinableSizeWithUnit {
        if (minSize !== undefined) {
            return parseSize(minSize, [SizeUnitEnum.Pixel]);
        } else {
            const minWidthDefined = minWidth !== undefined;
            const minHeightDefined = minHeight !== undefined;
            if (minWidthDefined || minHeightDefined) {
                if (minWidthDefined) {
                    return { size: minWidth, sizeUnit: SizeUnitEnum.Pixel };
                } else {
                    return { size: minHeight, sizeUnit: SizeUnitEnum.Pixel };
                }
            } else {
                return { size: ResolvedItemConfig.defaults.minSize, sizeUnit: ResolvedItemConfig.defaults.minSizeUnit };
            }
        }
    }

    /** @internal */
    export function calculateSizeWidthHeightSpecificationType(config: ItemConfig): SizeWidthHeightSpecificationType {
        if (config.size !== undefined) {
            return SizeWidthHeightSpecificationType.Size;
        } else {
            if (config.width !== undefined || config.height !== undefined) {
                return SizeWidthHeightSpecificationType.WidthOrHeight;
            } else {
                return SizeWidthHeightSpecificationType.None;
            }
        }
    }

    export function isGround(config: ItemConfig): config is ItemConfig {
        return config.type === ItemType.ground;
    }
    export function isRow(config: ItemConfig): config is ItemConfig {
        return config.type === ItemType.row;
    }
    export function isColumn(config: ItemConfig): config is ItemConfig {
        return config.type === ItemType.column;
    }
    export function isStack(config: ItemConfig): config is ItemConfig {
        return config.type === ItemType.stack;
    }
    export function isComponent(config: ItemConfig): config is ComponentItemConfig {
        return config.type === ItemType.component;
    }
}

// Stack or Component
/** @public */
export interface HeaderedItemConfig extends ItemConfig {
    /** @deprecated use {@link (HeaderedItemConfig:namespace).(Header:interface).show} instead */
    hasHeaders?: boolean;
    header?: HeaderedItemConfig.Header;
    maximised?: boolean;
}

/** @public */
export namespace HeaderedItemConfig {
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
        export function resolve(header: Header | undefined, hasHeaders: boolean | undefined): ResolvedHeaderedItemConfig.Header | undefined {
            if (header === undefined && hasHeaders === undefined) {
                return undefined;
            } else {
                const result: ResolvedHeaderedItemConfig.Header = {
                    show: header?.show ?? (hasHeaders === undefined ? undefined : hasHeaders ? ResolvedLayoutConfig.Header.defaults.show : false),
                    popout: header?.popout,
                    maximise: header?.maximise,
                    close: header?.close,
                    minimise: header?.minimise,
                    tabDropdown: header?.tabDropdown,
                }
                return result;
            }
        }
    }

    /** @internal */
    export function resolveIdAndMaximised(config: HeaderedItemConfig): { id: string, maximised: boolean} {
        let id: string;
        // To support legacy configs with Id saved as an array of string, assign config.id to a type which includes string array
        let legacyId: string | string[] | undefined = config.id;
        let legacyMaximised = false;
        if (legacyId === undefined) {
            id = ResolvedItemConfig.defaults.id;
        } else {
            if (Array.isArray(legacyId)) {
                const idx = legacyId.findIndex((id) => id === legacyMaximisedId)
                if (idx > 0) {
                    legacyMaximised = true;
                    legacyId = legacyId.splice(idx, 1);
                }
                if (legacyId.length > 0) {
                    id = legacyId[0];
                } else {
                    id = ResolvedItemConfig.defaults.id;
                }
            } else {
                id = legacyId;
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
export interface StackItemConfig extends HeaderedItemConfig {
    type: 'stack';
    content: ComponentItemConfig[];
    /** The index of the item in content which is to be active*/
    activeItemIndex?: number;
}

/** @public */
export namespace StackItemConfig {
    /** @internal */
    export function resolve(itemConfig: StackItemConfig, rowAndColumnChildLegacySizeDefault: boolean): ResolvedStackItemConfig {
        const { id, maximised } = HeaderedItemConfig.resolveIdAndMaximised(itemConfig);
        const { size, sizeUnit } = ItemConfig.resolveSize(itemConfig.size, itemConfig.width, itemConfig.height, rowAndColumnChildLegacySizeDefault);
        const { size: minSize, sizeUnit: minSizeUnit } = ItemConfig.resolveMinSize(itemConfig.minSize, itemConfig.minWidth, itemConfig.minHeight);

        const result: ResolvedStackItemConfig = {
            type: ItemType.stack,
            content: resolveContent(itemConfig.content),
            size,
            sizeUnit,
            minSize,
            minSizeUnit,
            id,
            maximised,
            isClosable: itemConfig.isClosable ?? ResolvedItemConfig.defaults.isClosable,
            activeItemIndex: itemConfig.activeItemIndex ?? ResolvedStackItemConfig.defaultActiveItemIndex,
            header: HeaderedItemConfig.Header.resolve(itemConfig.header, itemConfig.hasHeaders),
        };
        return result;
    }

    /** @internal */
    export function fromResolved(resolvedConfig: ResolvedStackItemConfig): StackItemConfig {
        const result: StackItemConfig = {
            type: ItemType.stack,
            content: fromResolvedContent(resolvedConfig.content),
            size: formatSize(resolvedConfig.size, resolvedConfig.sizeUnit),
            minSize: formatUndefinableSize(resolvedConfig.minSize, resolvedConfig.minSizeUnit),
            id: resolvedConfig.id,
            maximised: resolvedConfig.maximised,
            isClosable: resolvedConfig.isClosable,
            activeItemIndex: resolvedConfig.activeItemIndex,
            header: ResolvedHeaderedItemConfig.Header.createCopy(resolvedConfig.header),
        };

        return result;
    }

    /** @internal */
    function resolveContent(content: ComponentItemConfig[] | undefined): ResolvedComponentItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const result = new Array<ResolvedComponentItemConfig>(count);
            for (let i = 0; i < count; i++) {
                const childItemConfig = content[i];
                const itemConfig = ItemConfig.resolve(childItemConfig, false);
                if (!ResolvedItemConfig.isComponentItem(itemConfig)) {
                    throw new AssertError('UCUSICRC91114', JSON.stringify(itemConfig));
                } else {
                    result[i] = itemConfig;
                }
            }
            return result;
        }
    }

    /** @internal */
    function fromResolvedContent(resolvedContent: ResolvedComponentItemConfig[]): ComponentItemConfig[] {
        const count = resolvedContent.length;
        const result = new Array<ComponentItemConfig>(count);
        for (let i = 0; i < count; i++) {
            const resolvedContentConfig = resolvedContent[i];
            result[i] = ComponentItemConfig.fromResolved(resolvedContentConfig);
        }
        return result;
    }
}

/** @public */
export interface ComponentItemConfig extends HeaderedItemConfig {
    type: 'component';
    readonly content?: [];

    /**
     * The title of the item as displayed on its tab and on popout windows
     * Default: componentType.toString() or ''
     */
    title?: string;

    /**
     * The type of the component.
     * @deprecated use {@link (ComponentItemConfig:interface).componentType} instead
     */
    componentName?: string;

    /**
     * The type of the component.
     * `componentType` must be of type `string` if it is registered with any of the following functions:
     * * {@link (GoldenLayout:class).registerComponent} (deprecated)
     * * {@link (GoldenLayout:class).registerComponentConstructor}
     * * {@link (GoldenLayout:class).registerComponentFactoryFunction}
     */
    componentType: JsonValue;
    /**
     * The state information with which a component will be initialised with.
     * Will be passed to the component constructor function and will be the value returned by
     * container.initialState.
     */
    componentState?: JsonValue;

    /**
     * Default: true
     */
    reorderEnabled?: boolean;  // Takes precedence over LayoutConfig.reorderEnabled.
}

/** @public */
export namespace ComponentItemConfig {
    /** @internal */
    export function resolve(itemConfig: ComponentItemConfig, rowAndColumnChildLegacySizeDefault: boolean): ResolvedComponentItemConfig {
        let componentType: JsonValue | undefined = itemConfig.componentType;
        if (componentType === undefined) {
            componentType = itemConfig.componentName;
        }
        if (componentType === undefined) {
            throw new Error('ComponentItemConfig.componentType is undefined');
        } else {
            const { id, maximised } = HeaderedItemConfig.resolveIdAndMaximised(itemConfig);
            let title: string;
            if (itemConfig.title === undefined || itemConfig.title === '') {
                title = ComponentItemConfig.componentTypeToTitle(componentType);
            } else {
                title = itemConfig.title;
            }
            const { size, sizeUnit } = ItemConfig.resolveSize(itemConfig.size, itemConfig.width, itemConfig.height, rowAndColumnChildLegacySizeDefault);
            const { size: minSize, sizeUnit: minSizeUnit } = ItemConfig.resolveMinSize(itemConfig.minSize, itemConfig.minWidth, itemConfig.minHeight);
            const result: ResolvedComponentItemConfig = {
                type: itemConfig.type,
                content: [],
                size,
                sizeUnit,
                minSize,
                minSizeUnit,
                id,
                maximised,
                isClosable: itemConfig.isClosable ?? ResolvedItemConfig.defaults.isClosable,
                reorderEnabled: itemConfig.reorderEnabled ?? ResolvedComponentItemConfig.defaultReorderEnabled,
                title,
                header: HeaderedItemConfig.Header.resolve(itemConfig.header, itemConfig.hasHeaders),
                componentType,
                componentState: itemConfig.componentState ?? {},
            };
            return result;
        }
    }

    /** @internal */
    export function fromResolved(resolvedConfig: ResolvedComponentItemConfig): ComponentItemConfig {
        const result: ComponentItemConfig = {
            type: ItemType.component,
            size: formatSize(resolvedConfig.size, resolvedConfig.sizeUnit),
            minSize: formatUndefinableSize(resolvedConfig.minSize, resolvedConfig.minSizeUnit),
            id: resolvedConfig.id,
            maximised: resolvedConfig.maximised,
            isClosable: resolvedConfig.isClosable,
            reorderEnabled: resolvedConfig.reorderEnabled,
            title: resolvedConfig.title,
            header: ResolvedHeaderedItemConfig.Header.createCopy(resolvedConfig.header),
            componentType: resolvedConfig.componentType,
            componentState: deepExtendValue(undefined, resolvedConfig.componentState) as JsonValue,
        }

        return result;
    }

    export function componentTypeToTitle(componentType: JsonValue): string {
        const componentTypeType = typeof componentType;
        switch (componentTypeType) {
            case 'string': return componentType as string;
            case 'number': return (componentType as number).toString();
            case 'boolean': return (componentType as boolean).toString();
            default: return '';
        }
    }
}

// RowOrColumn
/** @public */
export interface RowOrColumnItemConfig extends ItemConfig {
    type: 'row' | 'column';
    content: (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
}

/** @public */
export namespace RowOrColumnItemConfig {
    export type ChildItemConfig = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

    export function isChildItemConfig(itemConfig: ItemConfig): itemConfig is ChildItemConfig {
        switch (itemConfig.type) {
            case ItemType.row:
            case ItemType.column:
            case ItemType.stack:
            case ItemType.component:
                return true;
            case ItemType.ground:
                return false;
            default:
                throw new UnreachableCaseError('UROCOSPCICIC13687', itemConfig.type);
        }
    }

    /** @internal */
    export function resolve(itemConfig: RowOrColumnItemConfig, rowAndColumnChildLegacySizeDefault: boolean): ResolvedRowOrColumnItemConfig {
        const { size, sizeUnit } = ItemConfig.resolveSize(itemConfig.size, itemConfig.width, itemConfig.height, rowAndColumnChildLegacySizeDefault);
        const { size: minSize, sizeUnit: minSizeUnit } = ItemConfig.resolveMinSize(itemConfig.minSize, itemConfig.minWidth, itemConfig.minHeight);
        const result: ResolvedRowOrColumnItemConfig = {
            type: itemConfig.type,
            content: RowOrColumnItemConfig.resolveContent(itemConfig.content),
            size,
            sizeUnit,
            minSize,
            minSizeUnit,
            id: ItemConfig.resolveId(itemConfig.id),
            isClosable: itemConfig.isClosable ?? ResolvedItemConfig.defaults.isClosable,
        }
        return result;
    }

    /** @internal */
    export function fromResolved(resolvedConfig: ResolvedRowOrColumnItemConfig): RowOrColumnItemConfig {
        const result: RowOrColumnItemConfig = {
            type: resolvedConfig.type,
            content: fromResolvedContent(resolvedConfig.content),
            size: formatSize(resolvedConfig.size, resolvedConfig.sizeUnit),
            minSize: formatUndefinableSize(resolvedConfig.minSize, resolvedConfig.minSizeUnit),
            id: resolvedConfig.id,
            isClosable: resolvedConfig.isClosable,
        }

        return result;
    }

    /** @internal */
    export function resolveContent(content: ChildItemConfig[] | undefined): ResolvedRowOrColumnItemConfig.ChildItemConfig[] {
        if (content === undefined) {
            return [];
        } else {
            const count = content.length;
            const childItemConfigs = new Array<RowOrColumnItemConfig.ChildItemConfig>(count);
            let widthOrHeightSpecifiedAtLeastOnce = false;
            let sizeSpecifiedAtLeastOnce = false;
            for (let i = 0; i < count; i++) {
                const childItemConfig = content[i];
                if (!RowOrColumnItemConfig.isChildItemConfig(childItemConfig)) {
                    throw new ConfigurationError('ItemConfig is not Row, Column or Stack', childItemConfig);
                } else {
                    if (!sizeSpecifiedAtLeastOnce) {
                        const sizeWidthHeightSpecificationType = ItemConfig.calculateSizeWidthHeightSpecificationType(childItemConfig);
                        switch (sizeWidthHeightSpecificationType) {
                            case ItemConfig.SizeWidthHeightSpecificationType.None:
                                break;
                            case ItemConfig.SizeWidthHeightSpecificationType.WidthOrHeight:
                                widthOrHeightSpecifiedAtLeastOnce = true;
                                break;
                            case ItemConfig.SizeWidthHeightSpecificationType.Size:
                                sizeSpecifiedAtLeastOnce = true;
                                break;
                            default:
                                throw new UnreachableCaseError('ROCICRC87556', sizeWidthHeightSpecificationType);
                        }
                    }
                    childItemConfigs[i] = childItemConfig;
                }
            }

            let legacySizeDefault: boolean;
            if (sizeSpecifiedAtLeastOnce) {
                legacySizeDefault = false;
            } else {
                if (widthOrHeightSpecifiedAtLeastOnce) {
                    legacySizeDefault = true;
                } else {
                    legacySizeDefault = false;
                }
            }

            const result = new Array<ResolvedRowOrColumnItemConfig.ChildItemConfig>(count);
            for (let i = 0; i < count; i++) {
                const childItemConfig = childItemConfigs[i];
                const resolvedChildItemConfig = ItemConfig.resolve(childItemConfig, legacySizeDefault);
                if (!ResolvedRowOrColumnItemConfig.isChildItemConfig(resolvedChildItemConfig)) {
                    throw new AssertError('UROCOSPIC99512', JSON.stringify(resolvedChildItemConfig));
                } else {
                    result[i] = resolvedChildItemConfig;
                }
            }
            return result;
        }
    }

    /** @internal */
    function fromResolvedContent(resolvedContent: readonly ResolvedRowOrColumnItemConfig.ChildItemConfig[]): RowOrColumnItemConfig.ChildItemConfig[] {
        const count = resolvedContent.length;
        const result = new Array<RowOrColumnItemConfig.ChildItemConfig>(count);
        for (let i = 0; i < count; i++) {
            const resolvedContentConfig = resolvedContent[i];
            const type = resolvedContentConfig.type;
            let contentConfig: RowOrColumnItemConfig.ChildItemConfig;
            switch (type) {
                case ItemType.row:
                case ItemType.column:
                    contentConfig = RowOrColumnItemConfig.fromResolved(resolvedContentConfig);
                    break;
                case ItemType.stack:
                    contentConfig = StackItemConfig.fromResolved(resolvedContentConfig);
                    break;
                case ItemType.component:
                    contentConfig = ComponentItemConfig.fromResolved(resolvedContentConfig);
                    break;
                default:
                    throw new UnreachableCaseError('ROCICFRC44797', type);
            }
            result[i] = contentConfig;
        }
        return result;
    }
}

/** @public */
export type RootItemConfig = RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig;

/** @public */
export namespace RootItemConfig {
    export function isRootItemConfig(itemConfig: ItemConfig): itemConfig is RootItemConfig {
        switch (itemConfig.type) {
            case ItemType.row:
            case ItemType.column:
            case ItemType.stack:
            case ItemType.component:
                return true;
            case ItemType.ground:
                return false;
            default:
                throw new UnreachableCaseError('URICIR23687', itemConfig.type);
        }
    }

    /** @internal */
    export function resolve(itemConfig: RootItemConfig | undefined): ResolvedRootItemConfig | undefined {
        if (itemConfig === undefined) {
            return undefined;
        } else {
            const result = ItemConfig.resolve(itemConfig, false);
            if (!ResolvedRootItemConfig.isRootItemConfig(result)) {
                throw new ConfigurationError('ItemConfig is not Row, Column or Stack', JSON.stringify(itemConfig));
            } else {
                return result;
            }
        }
    }

    /** @internal */
    export function fromResolvedOrUndefined(resolvedItemConfig: ResolvedRootItemConfig | undefined): RootItemConfig | undefined {
        if (resolvedItemConfig === undefined) {
            return undefined;
        } else {
            const type = resolvedItemConfig.type;
            switch (type) {
                case ItemType.row:
                case ItemType.column:
                    return RowOrColumnItemConfig.fromResolved(resolvedItemConfig);
                case ItemType.stack:
                    return StackItemConfig.fromResolved(resolvedItemConfig);
                case ItemType.component:
                    return ComponentItemConfig.fromResolved(resolvedItemConfig);
                default:
                    throw new UnreachableCaseError('RICFROU89921', type);
            }
        }
    }
}

/** @public */
export interface LayoutConfig {
    root: RootItemConfig | undefined;
    /** @deprecated Use {@link (LayoutConfig:interface).root} */
    content?: (RowOrColumnItemConfig | StackItemConfig | ComponentItemConfig)[];
    openPopouts?: PopoutLayoutConfig[];
    dimensions?: LayoutConfig.Dimensions;
    settings?: LayoutConfig.Settings;
    /** @deprecated use {@link (LayoutConfig:interface).header} instead */
    labels?: LayoutConfig.Labels;
    header?: LayoutConfig.Header;
}

/** Use to specify LayoutConfig with defaults or deserialise a LayoutConfig.
 * Deserialisation will handle backwards compatibility.
 * Note that LayoutConfig should be used for serialisation (not LayoutConfig)
 * @public
 */
export namespace LayoutConfig {
    export interface Settings {
        /**
         * @deprecated use ${@link (LayoutConfig:namespace).(Header:interface).show} instead
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
         * Can be overridden by ItemConfig.reorderEnabled for specific ItemConfigs
         * Default: true
         */
        reorderEnabled?: boolean;

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
         * @deprecated Will be removed in version 3.
         */
        closePopoutsOnUnload?: boolean;

        /**
         * Specifies if the popout icon should be displayed in the header-bar.
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).popout} instead
         */
        showPopoutIcon?: boolean;

        /**
         * Specifies if the maximise icon should be displayed in the header-bar.
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).maximise} instead
         */
        showMaximiseIcon?: boolean;

        /**
         * Specifies if the close icon should be displayed in the header-bar.
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).close} instead
         */
        showCloseIcon?: boolean;

        /**
         * Specifies Responsive Mode (more info needed).
         * Default: none
         */
        responsiveMode?: ResponsiveMode;

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

        /**
         * Specifies whether to pop in elements when closing a popout window.
         * Default: false
         */
        popInOnClose?: boolean;
    }

    export namespace Settings {
        export function resolve(settings: Settings | undefined): ResolvedLayoutConfig.Settings {
            const result: ResolvedLayoutConfig.Settings = {
                constrainDragToContainer: settings?.constrainDragToContainer ?? ResolvedLayoutConfig.Settings.defaults.constrainDragToContainer,
                reorderEnabled: settings?.reorderEnabled ?? ResolvedLayoutConfig.Settings.defaults.reorderEnabled,
                popoutWholeStack: settings?.popoutWholeStack ?? ResolvedLayoutConfig.Settings.defaults.popoutWholeStack,
                blockedPopoutsThrowError: settings?.blockedPopoutsThrowError ?? ResolvedLayoutConfig.Settings.defaults.blockedPopoutsThrowError,
                closePopoutsOnUnload: settings?.closePopoutsOnUnload ?? ResolvedLayoutConfig.Settings.defaults.closePopoutsOnUnload,
                responsiveMode: settings?.responsiveMode ?? ResolvedLayoutConfig.Settings.defaults.responsiveMode,
                tabOverlapAllowance: settings?.tabOverlapAllowance ?? ResolvedLayoutConfig.Settings.defaults.tabOverlapAllowance,
                reorderOnTabMenuClick: settings?.reorderOnTabMenuClick ?? ResolvedLayoutConfig.Settings.defaults.reorderOnTabMenuClick,
                tabControlOffset: settings?.tabControlOffset ?? ResolvedLayoutConfig.Settings.defaults.tabControlOffset,
                popInOnClose: settings?.popInOnClose ?? ResolvedLayoutConfig.Settings.defaults.popInOnClose,
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
         * @deprecated use {@link (LayoutConfig:namespace).(Dimensions:interface).defaultMinItemHeight} instead
         */
        minItemHeight?: number;

        /**
         * The minimum height an item can be resized to.
         * Default: 0
         */
        defaultMinItemHeight?: string;

        /**
         * The minimum width an item can be resized to (in pixel).
         * @deprecated use {@link (LayoutConfig:namespace).(Dimensions:interface).defaultMinItemWidth} instead
         */
        minItemWidth?: number;

        /**
         * The minimum width an item can be resized to.
         * Default: 10px
         */
        defaultMinItemWidth?: string;

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
        /** @internal */
        export function resolve(dimensions: Dimensions | undefined): ResolvedLayoutConfig.Dimensions {
            const { size: defaultMinItemHeight, sizeUnit: defaultMinItemHeightUnit } = Dimensions.resolveDefaultMinItemHeight(dimensions);
            const { size: defaultMinItemWidth, sizeUnit: defaultMinItemWidthUnit } = Dimensions.resolveDefaultMinItemWidth(dimensions);
            const result: ResolvedLayoutConfig.Dimensions = {
                borderWidth: dimensions?.borderWidth ?? ResolvedLayoutConfig.Dimensions.defaults.borderWidth,
                borderGrabWidth: dimensions?.borderGrabWidth ?? ResolvedLayoutConfig.Dimensions.defaults.borderGrabWidth,
                defaultMinItemHeight,
                defaultMinItemHeightUnit,
                defaultMinItemWidth,
                defaultMinItemWidthUnit,
                headerHeight: dimensions?.headerHeight ?? ResolvedLayoutConfig.Dimensions.defaults.headerHeight,
                dragProxyWidth: dimensions?.dragProxyWidth ?? ResolvedLayoutConfig.Dimensions.defaults.dragProxyWidth,
                dragProxyHeight: dimensions?.dragProxyHeight ?? ResolvedLayoutConfig.Dimensions.defaults.dragProxyHeight,
            }
            return result;
        }

        /** @internal */
        export function fromResolved(resolvedDimensions: ResolvedLayoutConfig.Dimensions): Dimensions {
            const result: Dimensions = {
                borderWidth: resolvedDimensions.borderWidth,
                borderGrabWidth: resolvedDimensions.borderGrabWidth,
                defaultMinItemHeight: formatSize(resolvedDimensions.defaultMinItemHeight, resolvedDimensions.defaultMinItemHeightUnit),
                defaultMinItemWidth: formatSize(resolvedDimensions.defaultMinItemWidth, resolvedDimensions.defaultMinItemWidthUnit),
                headerHeight: resolvedDimensions.headerHeight,
                dragProxyWidth: resolvedDimensions.dragProxyWidth,
                dragProxyHeight: resolvedDimensions.dragProxyHeight,
            };

            return result;
        }

        /** @internal */
        export function resolveDefaultMinItemHeight(dimensions: Dimensions | undefined): SizeWithUnit {
            const height = dimensions?.defaultMinItemHeight;
            if (height === undefined) {
                return { size: ResolvedLayoutConfig.Dimensions.defaults.defaultMinItemHeight, sizeUnit: ResolvedLayoutConfig.Dimensions.defaults.defaultMinItemHeightUnit };
            } else {
                return parseSize(height, [SizeUnitEnum.Pixel]);
            }
        }

        /** @internal */
        export function resolveDefaultMinItemWidth(dimensions: Dimensions | undefined): SizeWithUnit {
            const width = dimensions?.defaultMinItemWidth;
            if (width === undefined) {
                return { size: ResolvedLayoutConfig.Dimensions.defaults.defaultMinItemWidth, sizeUnit: ResolvedLayoutConfig.Dimensions.defaults.defaultMinItemWidthUnit };
            } else {
                return parseSize(width, [SizeUnitEnum.Pixel]);
            }
        }
    }

    export interface Labels {
        /**
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).close} instead
         */
        close?: string;

        /**
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).maximise} instead
         */
        maximise?: string;

        /**
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).minimise} instead
         */
        minimise?: string;

        /**
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).popin} instead
         */
        popin?: string;

        /**
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).popout} instead
         */
        popout?: string;

        /**
         * @deprecated use {@link (LayoutConfig:namespace).(Header:interface).tabDropdown} instead
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
        close?: false | string;
        /**
         * The tooltip text that appears when hovering over the minimise icon.
         * Default: 'minimise'
         */
        minimise?: string;
        /**
         *
         * Default: 'additional tabs'
         */
        tabDropdown?: false | string;
    }

    export namespace Header {
        /** @internal */
        export function resolve(header: Header | undefined,
            settings: LayoutConfig.Settings | undefined, labels: LayoutConfig.Labels | undefined
        ): ResolvedLayoutConfig.Header {
            let show: false | Side;
            if (header?.show !== undefined) {
                show = header.show;
            } else {
                if (settings !== undefined && settings.hasHeaders !== undefined) {
                    show = settings.hasHeaders ? ResolvedLayoutConfig.Header.defaults.show : false;
                } else {
                    show = ResolvedLayoutConfig.Header.defaults.show;
                }
            }
            const result: ResolvedLayoutConfig.Header = {
                show,
                popout: header?.popout ?? labels?.popout ??
                    (settings?.showPopoutIcon === false ? false : ResolvedLayoutConfig.Header.defaults.popout),
                dock: header?.popin ?? labels?.popin ?? ResolvedLayoutConfig.Header.defaults.dock,
                maximise: header?.maximise ?? labels?.maximise ??
                    (settings?.showMaximiseIcon === false ? false : ResolvedLayoutConfig.Header.defaults.maximise),
                close: header?.close ?? labels?.close ??
                    (settings?.showCloseIcon === false ? false : ResolvedLayoutConfig.Header.defaults.close),
                minimise: header?.minimise ?? labels?.minimise ?? ResolvedLayoutConfig.Header.defaults.minimise,
                tabDropdown: header?.tabDropdown ?? labels?.tabDropdown ?? ResolvedLayoutConfig.Header.defaults.tabDropdown,
            }
            return result;
        }
    }

    export function isPopout(config: LayoutConfig): config is PopoutLayoutConfig {
        return 'parentId' in config || 'indexInParent' in config || 'window' in config;
    }

    /** @internal */
    export function resolve(layoutConfig: LayoutConfig): ResolvedLayoutConfig {
        if (isPopout(layoutConfig)) {
            return PopoutLayoutConfig.resolve(layoutConfig);
        } else {
            let root: RootItemConfig | undefined;
            if (layoutConfig.root !== undefined) {
                root = layoutConfig.root;
            } else {
                if (layoutConfig.content !== undefined && layoutConfig.content.length > 0) {
                    root = layoutConfig.content[0];
                } else {
                    root = undefined;
                }
            }
            const config: ResolvedLayoutConfig = {
                resolved: true,
                root: RootItemConfig.resolve(root),
                openPopouts: LayoutConfig.resolveOpenPopouts(layoutConfig.openPopouts),
                dimensions: LayoutConfig.Dimensions.resolve(layoutConfig.dimensions),
                settings: LayoutConfig.Settings.resolve(layoutConfig.settings),
                header: LayoutConfig.Header.resolve(layoutConfig.header, layoutConfig.settings, layoutConfig.labels),
            }
            return config;
        }
    }

    export function fromResolved(config: ResolvedLayoutConfig): LayoutConfig {
        const result: LayoutConfig = {
            root: RootItemConfig.fromResolvedOrUndefined(config.root),
            openPopouts: PopoutLayoutConfig.fromResolvedArray(config.openPopouts),
            settings: ResolvedLayoutConfig.Settings.createCopy(config.settings),
            dimensions: LayoutConfig.Dimensions.fromResolved(config.dimensions),
            header: ResolvedLayoutConfig.Header.createCopy(config.header),
        };
        return result;
    }

    export function isResolved(configOrResolvedConfig: ResolvedLayoutConfig | LayoutConfig): configOrResolvedConfig is ResolvedLayoutConfig {
        const config = configOrResolvedConfig as ResolvedLayoutConfig;
        return config.resolved !== undefined && (config.resolved === true);
    }

    /** @internal */
    export function resolveOpenPopouts(popoutConfigs: PopoutLayoutConfig[] | undefined): ResolvedPopoutLayoutConfig[] {
        if (popoutConfigs === undefined) {
            return [];
        } else {
            const count = popoutConfigs.length;
            const result = new Array<ResolvedPopoutLayoutConfig>(count);
            for (let i = 0; i < count; i++) {
                result[i] = PopoutLayoutConfig.resolve(popoutConfigs[i]);
            }
            return result;
        }
    }
}

/** @public */
export interface PopoutLayoutConfig extends LayoutConfig {
    /** The id of the element the item will be appended to on popIn
    * If null, append to topmost layout element
    */
    parentId: string | null | undefined;
    /** The position of this element within its parent
    * If null, position is last
    */
    indexInParent: number | null | undefined;
    /** @deprecated use {@link (PopoutLayoutConfig:interface).window} */
    dimensions: PopoutLayoutConfig.Dimensions | undefined; // for backwards compatibility
    window: PopoutLayoutConfig.Window | undefined;
}

/** @public */
export namespace PopoutLayoutConfig {
    // Previous versions kept window information in Dimensions key.  Only use for backwards compatibility
    /** @deprecated use {@link (PopoutLayoutConfig:namespace).(Window:interface)} */
    export interface Dimensions extends LayoutConfig.Dimensions {
        /** @deprecated use {@link (PopoutLayoutConfig:namespace).(Window:interface).width} */
        width?: number | null,
        /** @deprecated use {@link (PopoutLayoutConfig:namespace).(Window:interface).height} */
        height?: number | null,
        /** @deprecated use {@link (PopoutLayoutConfig:namespace).(Window:interface).left} */
        left?: number | null,
        /** @deprecated use {@link (PopoutLayoutConfig:namespace).(Window:interface).top} */
        top?: number | null,
    }

    export interface Window {
        width?: number,
        height?: number,
        left?: number,
        top?: number,
    }

    export namespace Window {
        /** @internal */
        export function resolve(window: Window | undefined,
            dimensions: Dimensions | undefined): ResolvedPopoutLayoutConfig.Window
        {
            let result: ResolvedPopoutLayoutConfig.Window;
            const defaults = ResolvedPopoutLayoutConfig.Window.defaults;
            if (window !== undefined) {
                result = {
                    width: window.width ?? defaults.width,
                    height: window.height ?? defaults.height,
                    left: window.left ?? defaults.left,
                    top: window.top ?? defaults.top,
                }
            } else {
                result = {
                    width: dimensions?.width ?? defaults.width,
                    height: dimensions?.height ?? defaults.height,
                    left: dimensions?.left ?? defaults.left,
                    top: dimensions?.top ?? defaults.top,
                }
            }
            return result;
        }

        /** @internal */
        export function fromResolved(resolvedWindow: ResolvedPopoutLayoutConfig.Window): Window {
            const result: Window = {
                width: resolvedWindow.width === null ? undefined : resolvedWindow.width,
                height: resolvedWindow.height === null ? undefined : resolvedWindow.height,
                left: resolvedWindow.left === null ? undefined : resolvedWindow.left,
                top: resolvedWindow.top === null ? undefined : resolvedWindow.top,
            }

            return result;
        }
    }

    /** @internal */
    export function resolve(popoutConfig: PopoutLayoutConfig): ResolvedPopoutLayoutConfig {
        let root: RootItemConfig | undefined;
        if (popoutConfig.root !== undefined) {
            root = popoutConfig.root;
        } else {
            if (popoutConfig.content !== undefined && popoutConfig.content.length > 0) {
                root = popoutConfig.content[0];
            } else {
                root = undefined;
            }
        }

        const config: ResolvedPopoutLayoutConfig = {
            root: RootItemConfig.resolve(root),
            openPopouts: LayoutConfig.resolveOpenPopouts(popoutConfig.openPopouts),
            dimensions: LayoutConfig.Dimensions.resolve(popoutConfig.dimensions),
            settings: LayoutConfig.Settings.resolve(popoutConfig.settings),
            header: LayoutConfig.Header.resolve(popoutConfig.header, popoutConfig.settings, popoutConfig.labels),
            parentId: popoutConfig.parentId ?? null,
            indexInParent: popoutConfig.indexInParent ?? null,
            window: PopoutLayoutConfig.Window.resolve(popoutConfig.window, popoutConfig.dimensions),
            resolved: true,
        }
        return config;
    }

    /** @internal */
    export function fromResolved(resolvedConfig: ResolvedPopoutLayoutConfig): PopoutLayoutConfig {
        const result: PopoutLayoutConfig = {
            root: RootItemConfig.fromResolvedOrUndefined(resolvedConfig.root),
            openPopouts: fromResolvedArray(resolvedConfig.openPopouts),
            dimensions: LayoutConfig.Dimensions.fromResolved(resolvedConfig.dimensions),
            settings: ResolvedLayoutConfig.Settings.createCopy(resolvedConfig.settings),
            header: ResolvedLayoutConfig.Header.createCopy(resolvedConfig.header),
            parentId: resolvedConfig.parentId,
            indexInParent: resolvedConfig.indexInParent,
            window: PopoutLayoutConfig.Window.fromResolved(resolvedConfig.window),
        }

        return result;
    }

    /** @internal */
    export function fromResolvedArray(resolvedArray: ResolvedPopoutLayoutConfig[]): PopoutLayoutConfig[] {
        const resolvedOpenPopoutCount = resolvedArray.length;
        const result = new Array<PopoutLayoutConfig>(resolvedOpenPopoutCount);
        for (let i = 0; i < resolvedOpenPopoutCount; i++) {
            const resolvedOpenPopout = resolvedArray[i];
            result[i] = PopoutLayoutConfig.fromResolved(resolvedOpenPopout);
        }

        return result;
    }
}

/** @internal */
export interface SizeWithUnit {
    size: number;
    sizeUnit: SizeUnitEnum;
}

/** @internal */
export interface UndefinableSizeWithUnit {
    size: number | undefined;
    sizeUnit: SizeUnitEnum;
}

/** @internal */
export function parseSize(sizeString: string, allowableSizeUnits: readonly SizeUnitEnum[]): SizeWithUnit {
    const { numericPart: digitsPart, firstNonNumericCharPart: firstNonDigitPart } = splitStringAtFirstNonNumericChar(sizeString);
    const size = Number.parseInt(digitsPart, 10);
    if (isNaN(size)) {
        throw new ConfigurationError(`${i18nStrings[I18nStringId.InvalidNumberPartInSizeString]}: ${sizeString}`);
    } else {
        const sizeUnit = SizeUnitEnum.tryParse(firstNonDigitPart);
        if (sizeUnit === undefined) {
            throw new ConfigurationError(`${i18nStrings[I18nStringId.UnknownUnitInSizeString]}: ${sizeString}`)
        } else {
            if (!allowableSizeUnits.includes(sizeUnit)) {
                throw new ConfigurationError(`${i18nStrings[I18nStringId.UnsupportedUnitInSizeString]}: ${sizeString}`)
            } else {
                return { size, sizeUnit };
            }
        }
    }
}

/** @internal */
export function formatSize(size: number, sizeUnit: SizeUnitEnum) {
    return size.toString(10) + SizeUnitEnum.format(sizeUnit);
}

/** @internal */
export function formatUndefinableSize(size: number| undefined, sizeUnit: SizeUnitEnum) {
    if (size === undefined) {
        return undefined;
    } else {
        return size.toString(10) + SizeUnitEnum.format(sizeUnit);
    }
}

/** @public @deprecated - use {@link (LayoutConfig:interface)} */
export type Config = LayoutConfig;
