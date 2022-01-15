import { LayoutConfig } from './config/config';
import { ResolvedComponentItemConfig } from './config/resolved-config';
import { ComponentContainer } from './container/component-container';
import { ApiError, BindError } from './errors/external-error';
import { AssertError, UnexpectedUndefinedError } from './errors/internal-error';
import { I18nStringId, i18nStrings } from './utils/i18n-strings';
import { JsonValue, LogicalZIndex } from './utils/types';
import { deepExtendValue, ensureElementPositionAbsolute, numberToPixels, setElementDisplayVisibility, setElementHeight, setElementWidth } from './utils/utils';
import { VirtualLayout } from './virtual-layout';

/** @public */
export class GoldenLayout extends VirtualLayout {
    /** @internal */
    private _componentTypesMap = new Map<string, GoldenLayout.ComponentInstantiator>();
    /** @internal */
    private _getComponentConstructorFtn: GoldenLayout.GetComponentConstructorCallback;

    /** @internal */
    private _registeredComponentMap = new Map<ComponentContainer, ComponentContainer.Component>();
    /** @internal */
    private _virtuableComponentMap = new Map<ComponentContainer, GoldenLayout.VirtuableComponent>();
    /** @internal */
    private _goldenLayoutBoundingClientRect: DOMRect;

    /** @internal */
    private _containerVirtualRectingRequiredEventListener =
        (container: ComponentContainer, width: number, height: number) => this.handleContainerVirtualRectingRequiredEvent(container, width, height);
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
    /** @deprecated specify layoutConfig in {@link (LayoutManager:class).loadLayout} */
    constructor(config: LayoutConfig, container?: HTMLElement);
    /** @internal */
    constructor(configOrOptionalContainer: LayoutConfig | HTMLElement | undefined,
        containerOrBindComponentEventHandler?: HTMLElement | VirtualLayout.BindComponentEventHandler,
        unbindComponentEventHandler?: VirtualLayout.UnbindComponentEventHandler,
    ) {
        super(configOrOptionalContainer, containerOrBindComponentEventHandler, unbindComponentEventHandler, true);
        // we told VirtualLayout to not call init() (skipInit set to true) so that Golden Layout can initialise its properties before init is called
        if (!this.deprecatedConstructor) {
            this.init();
        }
    }

    /**
     * Register a new component type with the layout manager.
     *
     * @deprecated See {@link https://stackoverflow.com/questions/40922531/how-to-check-if-a-javascript-function-is-a-constructor}
     * instead use {@link (GoldenLayout:class).registerComponentConstructor}
     * or {@link (GoldenLayout:class).registerComponentFactoryFunction}
     */
    registerComponent(name: string,
        componentConstructorOrFactoryFtn: GoldenLayout.ComponentConstructor | GoldenLayout.ComponentFactoryFunction,
        virtual = false
    ): void {
        if (typeof componentConstructorOrFactoryFtn !== 'function') {
            throw new ApiError('registerComponent() componentConstructorOrFactoryFtn parameter is not a function')
        } else {
            if (componentConstructorOrFactoryFtn.hasOwnProperty('prototype')) {
                const componentConstructor = componentConstructorOrFactoryFtn as GoldenLayout.ComponentConstructor;
                this.registerComponentConstructor(name, componentConstructor, virtual);
            } else {
                const componentFactoryFtn = componentConstructorOrFactoryFtn as GoldenLayout.ComponentFactoryFunction;
                this.registerComponentFactoryFunction(name, componentFactoryFtn, virtual);
            }
        }
    }

    /**
     * Register a new component type with the layout manager.
     */
    registerComponentConstructor(typeName: string, componentConstructor: GoldenLayout.ComponentConstructor, virtual = false): void {
        if (typeof componentConstructor !== 'function') {
            throw new Error(i18nStrings[I18nStringId.PleaseRegisterAConstructorFunction]);
        }

        const existingComponentType = this._componentTypesMap.get(typeName);

        if (existingComponentType !== undefined) {
            throw new BindError(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]}: ${typeName}`);
        }

        this._componentTypesMap.set(typeName, {
                constructor: componentConstructor,
                factoryFunction: undefined,
                virtual,
            }
        );
    }

    /**
     * Register a new component with the layout manager.
     */
    registerComponentFactoryFunction(typeName: string, componentFactoryFunction: GoldenLayout.ComponentFactoryFunction, virtual = false): void {
        if (typeof componentFactoryFunction !== 'function') {
            throw new BindError('Please register a constructor function');
        }

        const existingComponentType = this._componentTypesMap.get(typeName);

        if (existingComponentType !== undefined) {
            throw new BindError(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]}: ${typeName}`);
        }

        this._componentTypesMap.set(typeName, {
                constructor: undefined,
                factoryFunction: componentFactoryFunction,
                virtual,
            }
        );
    }

    /**
     * Register a component function with the layout manager. This function should
     * return a constructor for a component based on a config.
     * This function will be called if a component type with the required name is not already registered.
     * It is recommended that applications use the {@link (VirtualLayout:class).getComponentEvent} and
     * {@link (VirtualLayout:class).releaseComponentEvent} instead of registering a constructor callback
     * @deprecated use {@link (GoldenLayout:class).registerGetComponentConstructorCallback}
     */
    registerComponentFunction(callback: GoldenLayout.GetComponentConstructorCallback): void {
        this.registerGetComponentConstructorCallback(callback);
    }

    /**
     * Register a callback closure with the layout manager which supplies a Component Constructor.
     * This callback should return a constructor for a component based on a config.
     * This function will be called if a component type with the required name is not already registered.
     * It is recommended that applications use the {@link (VirtualLayout:class).getComponentEvent} and
     * {@link (VirtualLayout:class).releaseComponentEvent} instead of registering a constructor callback
     */
    registerGetComponentConstructorCallback(callback: GoldenLayout.GetComponentConstructorCallback): void {
        if (typeof callback !== 'function') {
            throw new Error('Please register a callback function');
        }

        if (this._getComponentConstructorFtn !== undefined) {
            console.warn('Multiple component functions are being registered.  Only the final registered function will be used.')
        }

        this._getComponentConstructorFtn = callback;
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
    getComponentInstantiator(config: ResolvedComponentItemConfig): GoldenLayout.ComponentInstantiator | undefined {
        let instantiator: GoldenLayout.ComponentInstantiator | undefined;

        const typeName = ResolvedComponentItemConfig.resolveComponentTypeName(config)
        if (typeName !== undefined) {
            instantiator = this._componentTypesMap.get(typeName);
        }
        if (instantiator === undefined) {
            if (this._getComponentConstructorFtn !== undefined) {
                instantiator = {
                    constructor: this._getComponentConstructorFtn(config),
                    factoryFunction: undefined,
                    virtual: false,
                }
            }
        }

        return instantiator;
    }

    /** @internal */
    override bindComponent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig): ComponentContainer.BindableComponent {
        let instantiator: GoldenLayout.ComponentInstantiator | undefined;

        const typeName = ResolvedComponentItemConfig.resolveComponentTypeName(itemConfig);
        if (typeName !== undefined) {
            instantiator = this._componentTypesMap.get(typeName);
        }
        if (instantiator === undefined) {
            if (this._getComponentConstructorFtn !== undefined) {
                instantiator = {
                    constructor: this._getComponentConstructorFtn(itemConfig),
                    factoryFunction: undefined,
                    virtual: false,
                }
            }
        }

        let result: ComponentContainer.BindableComponent;
        if (instantiator !== undefined) {
            const virtual = instantiator.virtual;
            // handle case where component is obtained by name or component constructor callback
            let componentState: JsonValue | undefined;
            if (itemConfig.componentState === undefined) {
                componentState = undefined;
            } else {
                // make copy
                componentState = deepExtendValue({}, itemConfig.componentState) as JsonValue;
            }

            let component: ComponentContainer.Component | undefined;
            const componentConstructor = instantiator.constructor;
            if (componentConstructor !== undefined) {
                component = new componentConstructor(container, componentState, virtual);
            } else {
                const factoryFunction = instantiator.factoryFunction;
                if (factoryFunction !== undefined) {
                    component = factoryFunction(container, componentState, virtual);
                } else {
                    throw new AssertError('LMBCFFU10008');
                }
            }

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
                        container.virtualRectingRequiredEvent = this._containerVirtualRectingRequiredEventListener;
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

        } else {
            // Use getComponentEvent
            result = super.bindComponent(container, itemConfig);
        }

        return result;
    }

    /** @internal */
    override unbindComponent(container: ComponentContainer, virtual: boolean, component: ComponentContainer.Component | undefined): void {
        const registeredComponent = this._registeredComponentMap.get(container);
        if (registeredComponent === undefined) {
            super.unbindComponent(container, virtual, component); // was not created from registration so use virtual unbind events
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
    }

    override fireBeforeVirtualRectingEvent(count: number): void {
        this._goldenLayoutBoundingClientRect = this.container.getBoundingClientRect();
        super.fireBeforeVirtualRectingEvent(count);
    }


    /** @internal */
    private handleContainerVirtualRectingRequiredEvent(container: ComponentContainer, width: number, height: number): void {
        const virtuableComponent = this._virtuableComponentMap.get(container);
        if (virtuableComponent === undefined) {
            throw new UnexpectedUndefinedError('GLHCSCE55933');
        } else {
            const rootElement = virtuableComponent.rootHtmlElement;
            if (rootElement === undefined) {
                throw new BindError(i18nStrings[I18nStringId.ComponentIsNotVirtuable] + ' ' + container.title);
            } else {
                const containerBoundingClientRect = container.element.getBoundingClientRect();
                const left = containerBoundingClientRect.left - this._goldenLayoutBoundingClientRect.left;
                rootElement.style.left = numberToPixels(left);
                const top = containerBoundingClientRect.top - this._goldenLayoutBoundingClientRect.top;
                rootElement.style.top = numberToPixels(top);
                setElementWidth(rootElement, width);
                setElementHeight(rootElement, height);
            }
        }
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

    export type ComponentConstructor = new(container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) => ComponentContainer.Component;
    export type ComponentFactoryFunction = (container: ComponentContainer, state: JsonValue | undefined, virtual: boolean) => ComponentContainer.Component | undefined;
    export type GetComponentConstructorCallback = (this: void, config: ResolvedComponentItemConfig) => ComponentConstructor;

    export interface ComponentInstantiator {
        constructor: ComponentConstructor | undefined;
        factoryFunction: ComponentFactoryFunction | undefined;
        virtual: boolean;
    }
}
