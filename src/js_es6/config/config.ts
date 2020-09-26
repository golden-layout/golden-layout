import { UnreachableCaseError } from '../errors/error';
import { deepExtendValue, JsonValue } from '../utils/utils';

export interface ItemConfig {
    // see UserItemConfig for comments
    type: ItemConfig.Type;
    content: ItemConfig[];
    width: number;
    height: number;
    id: string | string[];
    isClosable: boolean;
    title: string;
    reorderEnabled: boolean;

    activeItemIndex: number;
}

export namespace ItemConfig {
    export const enum Type {
        'root',
        'row',
        'column',
        'stack',
        'component',
        'react-component'
    }

    export function createCopy(original: ItemConfig): ItemConfig {
        switch (original.type) {
            case ItemConfig.Type.root:
            case ItemConfig.Type.row:
            case ItemConfig.Type.column:
            case ItemConfig.Type.stack:
                const result: ItemConfig = {
                    type: original.type,
                    content: copyContent(original.content),
                    width: original.width,
                    height: original.height,
                    id: original.id,
                    isClosable: original.isClosable,
                    reorderEnabled: original.reorderEnabled,
                    title: original.title,
                    activeItemIndex: original.activeItemIndex,
                }
                return result;

            case ItemConfig.Type.component:
                return JsonComponentConfig.createCopy(original as JsonComponentConfig);

            case ItemConfig.Type['react-component']:
                return ReactComponentConfig.createCopy(original as ReactComponentConfig);

            default:
                throw new UnreachableCaseError('CCC913564', original.type, 'Invalid Config Item type specified');
        }
    }

    export function copyContent(original: ItemConfig[]): ItemConfig[] {
        const count = original.length;
        const result = new Array<ItemConfig>(count);
        for (let i = 0; i < count; i++) {
            result[i] = ItemConfig.createCopy(original[i]);
        }
        return result;
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
    // see UserJsonComponentConfig for comments
    componentState: JsonValue;
}

export namespace JsonComponentConfig {
    export function createCopy(original: JsonComponentConfig): JsonComponentConfig {
        const result: JsonComponentConfig = {
            type: original.type,
            content: ItemConfig.copyContent(original.content),
            width: original.width,
            height: original.height,
            id: original.id,
            isClosable: original.isClosable,
            reorderEnabled: original.reorderEnabled,
            title: original.title,
            activeItemIndex: original.activeItemIndex,
            componentName: original.componentName,
            componentState: deepExtendValue(undefined, original.componentState) as JsonValue,
        }
        return result;
    }
}

export interface ReactComponentConfig extends ComponentConfig {
    // see UserReactComponentConfig for comments
    props?: unknown;
}

export namespace ReactComponentConfig {
    export const REACT_COMPONENT_ID = 'lm-react-component'

    export function createCopy(original: ReactComponentConfig): ReactComponentConfig {
        const result: ReactComponentConfig = {
            type: original.type,
            content: ItemConfig.copyContent(original.content),
            width: original.width,
            height: original.height,
            id: original.id,
            isClosable: original.isClosable,
            reorderEnabled: original.reorderEnabled,
            title: original.title,
            activeItemIndex: original.activeItemIndex,
            componentName: REACT_COMPONENT_ID,
            props: deepExtendValue(undefined, original.props),
        }
        return result;
    }
}

export interface ManagerConfig {
    content: ItemConfig[];
    openPopouts: PopoutManagerConfig[];
    dimensions: ManagerConfig.Dimensions;
    settings: ManagerConfig.Settings;
    labels: ManagerConfig.Labels;
    maximisedItemId: string | null,
}

export namespace ManagerConfig {
    export interface Settings {
        // see UserConfig.Settings for comments
        hasHeaders: boolean;
        constrainDragToContainer: boolean;
        reorderEnabled: boolean;
        selectionEnabled: boolean;
        popoutWholeStack: boolean;
        blockedPopoutsThrowError: boolean;
        closePopoutsOnUnload: boolean;
        showPopoutIcon: boolean;
        showMaximiseIcon: boolean;
        showCloseIcon: boolean;
        responsiveMode: Settings.ResponsiveMode;
        tabOverlapAllowance: number;
        reorderOnTabMenuClick: boolean;
        tabControlOffset: number;
    }

    export namespace Settings {
        export const enum ResponsiveMode {
            'none',
            'always',
            'onload',
        }

        export function createCopy(original: Settings): Settings {
            return {
                hasHeaders: original.hasHeaders,
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
        borderWidth: number;
        borderGrabWidth: number,
        minItemHeight: number;
        minItemWidth: number;
        headerHeight: number;
        dragProxyWidth: number;
        dragProxyHeight: number;
    }

    export namespace Dimensions {
        export function createCopy(original: Dimensions): Dimensions {
            if (isPopout(original)) {
                return PopoutManagerConfig.Dimensions.createCopy(original);
            } else {
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
        }

        export function isPopout(dimensions: Dimensions): dimensions is PopoutManagerConfig.Dimensions {
            return 'left' in dimensions;
        }
    }

    export interface Labels {
        // see UserConfig.Labels for comments
        close: string;
        maximise: string;
        minimise: string;
        popin: string;
        popout: string;
        tabDropdown: string;
    }

    export namespace Labels {
        export function createCopy(original: Labels): Labels {
            return {
                close: original.close,
                maximise: original.maximise,
                minimise: original.minimise,
                popin: original.popin,
                popout: original.popout,
                tabDropdown: original.tabDropdown,
            }
        }
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

    export function createRootItemConfig(managerConfig: PopoutManagerConfig): ItemConfig {
        return {
            type: ItemConfig.Type.root,
            content: managerConfig.content,
            width: 100,
            height: 100,
            id: '',
            isClosable: false,
            title: '',
            reorderEnabled: false,
            activeItemIndex: -1,
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
    parentId: string;
    indexInParent: number;
    dimensions: PopoutManagerConfig.Dimensions;
}

export namespace PopoutManagerConfig {
    export interface Dimensions extends ManagerConfig.Dimensions {
        width: number | null,
        height: number | null,
        left: number | null,
        top: number | null,
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
                width: original.width,
                height: original.height,
                left: original.left,
                top: original.top,
            }
        }
    }

    export function createCopy(original: PopoutManagerConfig): PopoutManagerConfig {
        const result: PopoutManagerConfig = {
            content: ItemConfig.copyContent(original.content),
            openPopouts: ManagerConfig.copyOpenPopouts(original.openPopouts),
            settings: ManagerConfig.Settings.createCopy(original.settings),
            dimensions: Dimensions.createCopy(original.dimensions),
            labels: ManagerConfig.Labels.createCopy(original.labels),
            maximisedItemId: original.maximisedItemId,
            parentId: original.parentId,
            indexInParent: original.indexInParent,
        }
        return result;
    }
}

export interface Config extends ManagerConfig {
    defaultsResolved: true,
}

export namespace Config {

    export function createCopy(original: Config): Config {
        const result: Config = {
            defaultsResolved: original.defaultsResolved,
            content: ItemConfig.copyContent(original.content),
            openPopouts: ManagerConfig.copyOpenPopouts(original.openPopouts),
            settings: ManagerConfig.Settings.createCopy(original.settings),
            dimensions: ManagerConfig.Dimensions.createCopy(original.dimensions),
            labels: ManagerConfig.Labels.createCopy(original.labels),
            maximisedItemId: original.maximisedItemId,
        }
        return result;
    }
}
