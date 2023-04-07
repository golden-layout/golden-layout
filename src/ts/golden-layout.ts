import { LayoutConfig } from './config/config';
import { ResolvedComponentItemConfig } from './config/resolved-config';
import { ComponentContainer } from './container/component-container';
import { BindError } from './errors/external-error';
import { UnexpectedUndefinedError } from './errors/internal-error';
import { I18nStringId, i18nStrings } from './utils/i18n-strings';
import { JsonValue, LogicalZIndex } from './utils/types';
import { deepExtendValue, setElementDisplayVisibility } from './utils/utils';
import { VirtualLayout } from './virtual-layout';

/** @public */
export class GoldenLayout extends VirtualLayout {
    /** @internal */
    private _componentTypesMap = new Map<string, GoldenLayout.ComponentFactoryFunction>();
    /** @internal */
    private _componentTypesDefault:  GoldenLayout.ComponentFactoryFunction | undefined;

    /** @internal */
    private _registeredComponentMap = new Map<ComponentContainer, ComponentContainer.Component>();
    /** @internal */
    private _virtuableComponentMap = new Map<ComponentContainer, GoldenLayout.VirtuableComponent>(); // FIXME remove

    /** @internal */
    private _containerVirtualVisibilityChangeRequiredEventListener =
        (container: ComponentContainer, visible: boolean) => this.handleContainerVirtualVisibilityChangeRequiredEvent(container, visible);
    /** @internal */
    private _containerVirtualZIndexChangeRequiredEventListener =
        (container: ComponentContainer, logicalZIndex: LogicalZIndex, defaultZIndex: string) =>
            this.handleContainerVirtualZIndexChangeRequiredEvent(container, logicalZIndex, defaultZIndex);

    /**
     * @param container - A Dom HTML element. Defaults to body
     * @param bindComponentEventHandler - Event handler to bind components
     * @param bindComponentEventHandler - Event handler to unbind components
     * If bindComponentEventHandler is defined, then constructor will be determinate. It will always call the init()
     * function and the init() function will always complete. This means that the bindComponentEventHandler will be called
     * if constructor is for a popout window. Make sure bindComponentEventHandler is ready for events.
     */
    constructor(
        container?: HTMLElement,
        bindComponentEventHandler?: VirtualLayout.BindComponentEventHandler,
        unbindComponentEventHandler?: VirtualLayout.UnbindComponentEventHandler,
    );
    constructor(
        config: LayoutConfig,
        container?: HTMLElement,
        position?: Node | null,
        );
    /** @deprecated specify layoutConfig in {@link (LayoutManager:class).loadLayout} */
    constructor(config: LayoutConfig, container?: HTMLElement);
    /** @internal */
    constructor(configOrOptionalContainer: LayoutConfig | HTMLElement | undefined,
        containerOrBindComponentEventHandler?: HTMLElement | VirtualLayout.BindComponentEventHandler,
        unbindComponentEventHandler?: VirtualLayout.UnbindComponentEventHandler | Node | null,
    ) {
        super(configOrOptionalContainer, containerOrBindComponentEventHandler, unbindComponentEventHandler, true);
        // we told VirtualLayout to not call init() (skipInit set to true) so that Golden Layout can initialise its properties before init is called
        if (!this.deprecatedConstructor) {
            this.init();
        }
    }

    //  REMOVE   registerComponentFactoryFunction(typeName: string, componentFactoryFunction: GoldenLayout.ComponentFactoryFunction, virtual = false): void {

    /**
     * Register a new component with the layout manager.
     */
    registerComponent(typeName: string, componentFactoryFunction: GoldenLayout.ComponentFactoryFunction): void {
        if (typeof componentFactoryFunction !== 'function') {
            throw new BindError('Please register a constructor function');
        }

        const existingComponentType = this._componentTypesMap.get(typeName);

        if (existingComponentType !== undefined) {
            throw new BindError(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]}: ${typeName}`);
        }

        this._componentTypesMap.set(typeName, componentFactoryFunction);
    }

    registerComponentDefault(componentFactoryFunction: GoldenLayout.ComponentFactoryFunction): void {
        if (typeof componentFactoryFunction !== 'function') {
            throw new BindError('Please register a constructor function');
        }
        if (this._componentTypesDefault !== undefined) {
            throw new BindError(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]} - default`);
        }
        this._componentTypesDefault = componentFactoryFunction;
    }

    getRegisteredComponentTypeNames(): string[] {
        const typeNamesIterableIterator = this._componentTypesMap.keys();
        return Array.from(typeNamesIterableIterator);
    }

    /**
     * Returns a previously registered component instantiator.  Attempts to utilize registered
     * component type by first, then falls back to the component constructor callback function (if registered).
     * If neither gets an instantiator, then returns `undefined`.
     * Note that `undefined` will return if config.componentType is not a string
     *
     * @param config - The item config
     * @public
     */
    getComponentInstantiator(config: ResolvedComponentItemConfig): GoldenLayout.ComponentFactoryFunction | undefined {
        let instantiator: GoldenLayout.ComponentFactoryFunction | undefined;

        const typeName = ResolvedComponentItemConfig.resolveComponentTypeName(config)
        if (typeName !== undefined) {
            instantiator = this._componentTypesMap.get(typeName);
        }
        return instantiator || this._componentTypesDefault;
    }

    /** @internal */
    override bindComponent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig): ComponentContainer.Handle {
        const factoryFunction = this.getComponentInstantiator(itemConfig);

        let result: ComponentContainer.Handle = undefined;
        if (factoryFunction !== undefined) {
            // handle case where component is obtained by name or component constructor callback
            let componentState: JsonValue | undefined;
            if (itemConfig.componentState === undefined) {
                componentState = undefined;
            } else {
                // make copy
                componentState = deepExtendValue({}, itemConfig.componentState) as JsonValue;
            }

            if (factoryFunction !== undefined) {
                result = factoryFunction(container, componentState);
            }

            /*
            if (virtual) {
                if (component === undefined) {
                    throw new UnexpectedUndefinedError('GLBCVCU988774');
                } else {
                    const virtuableComponent = component as GoldenLayout.VirtuableComponent;
                    const componentRootElement = virtuableComponent.rootHtmlElement;
                    if (componentRootElement === undefined) {
                        throw new BindError(`${i18nStrings[I18nStringId.VirtualComponentDoesNotHaveRootHtmlElement]}: ${typeName}`);
                    } else {
                        ensureElementPositionAbsolute(componentRootElement);
                        this.container.appendChild(componentRootElement);
                        this._virtuableComponentMap.set(container, virtuableComponent);
                        container.virtualVisibilityChangeRequiredEvent = this._containerVirtualVisibilityChangeRequiredEventListener;
                        container.virtualZIndexChangeRequiredEvent = this._containerVirtualZIndexChangeRequiredEventListener;
                    }
                }
            }

            this._registeredComponentMap.set(container, component);

            result = {
                virtual: instantiator.virtual,
                component,
                };
            */

        } else {
            //result = super.bindComponent(container, itemConfig);
        }

        return result;
    }

    /** @internal */
    override unbindComponent(container: ComponentContainer, handle: ComponentContainer.Handle): void {
        /*
        const registeredComponent = this._registeredComponentMap.get(container);
        if (registeredComponent === undefined) {
            super.unbindComponent(container, handle); // was not created from registration so use virtual unbind events
        } else {
            const virtuableComponent = this._virtuableComponentMap.get(container);
            if (virtuableComponent !== undefined) {
                const componentRootElement = virtuableComponent.rootHtmlElement;
                if (componentRootElement === undefined) {
                    throw new AssertError('GLUC77743', container.title);
                } else {
                    this.container.removeChild(componentRootElement);
                    this._virtuableComponentMap.delete(container);
                }
            }
        }
        */
    }

    /** @internal */
    private handleContainerVirtualVisibilityChangeRequiredEvent(container: ComponentContainer, visible: boolean): void {
        const virtuableComponent = this._virtuableComponentMap.get(container);
        if (virtuableComponent === undefined) {
            throw new UnexpectedUndefinedError('GLHCVVCRE55934');
        } else {
            const rootElement = virtuableComponent.rootHtmlElement;
            if (rootElement === undefined) {
                throw new BindError(i18nStrings[I18nStringId.ComponentIsNotVirtuable] + ' ' + container.title);
            } else {
                setElementDisplayVisibility(rootElement, visible);
            }
        }
    }

    /** @internal */
    private handleContainerVirtualZIndexChangeRequiredEvent(container: ComponentContainer, logicalZIndex: LogicalZIndex, defaultZIndex: string) {
        const virtuableComponent = this._virtuableComponentMap.get(container);
        if (virtuableComponent === undefined) {
            throw new UnexpectedUndefinedError('GLHCVZICRE55935');
        } else {
            const rootElement = virtuableComponent.rootHtmlElement;
            if (rootElement === undefined) {
                throw new BindError(i18nStrings[I18nStringId.ComponentIsNotVirtuable] + ' ' + container.title);
            } else {
                rootElement.style.zIndex = defaultZIndex;
            }
        }
    }
}

/** @public */
export namespace GoldenLayout {
    export interface VirtuableComponent {
        rootHtmlElement: HTMLElement;
    }

    // ??? combine with VirtualLayout.BindComponentEventHandler
    export type ComponentFactoryFunction = (container: ComponentContainer, state: JsonValue | undefined) => ComponentContainer.Handle;
}
