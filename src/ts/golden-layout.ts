import { ResolvedComponentItemConfig } from './config/resolved-config';
import { ComponentContainer } from './container/component-container';
import { ApiError, RegisterError } from './errors/external-error';
import { AssertError, UnexpectedUndefinedError } from './errors/internal-error';
import { I18nStringId, i18nStrings } from './utils/i18n-strings';
import { JsonValue } from './utils/types';
import { deepExtendValue, ensureElementPositioned, setElementDisplayVisibility, setElementHeight, setElementWidth } from './utils/utils';
import { VirtualLayout } from './virtual-layout';

/** @public */
export class GoldenLayout extends VirtualLayout {
    /** @internal */
    private _componentTypes: Record<string, GoldenLayout.ComponentInstantiator> = {};
    /** @internal */
    private _getComponentConstructorFtn: GoldenLayout.GetComponentConstructorCallback;

    private _virtuableComponentMap = new Map<ComponentContainer, GoldenLayout.VirtuableComponent>();
    private _containerSizeChangedEventListener =
        (container: ComponentContainer, width: number, height: number) => this.handleContainerSizeChangedEvent(container, width, height);
    private _containerVisibilityChangedEventListener =
        (container: ComponentContainer, visible: boolean) => this.handleContainerVisibilityChangedEvent(container, visible);

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

        if (this._componentTypes[typeName] !== undefined) {
            throw new Error(`${i18nStrings[I18nStringId.ComponentIsAlreadyRegistered]}: ${typeName}`);
        }

        this._componentTypes[typeName] = {
            constructor: componentConstructor,
            factoryFunction: undefined,
            virtual,
        };
    }

    /**
     * Register a new component with the layout manager.
     */
    registerComponentFactoryFunction(typeName: string, componentFactoryFunction: GoldenLayout.ComponentFactoryFunction, virtual = false): void {
        if (typeof componentFactoryFunction !== 'function') {
            throw new Error('Please register a constructor function');
        }

        if (this._componentTypes[typeName] !== undefined) {
            throw new Error('Component ' + typeName + ' is already registered');
        }

        this._componentTypes[typeName] = {
            constructor: undefined,
            factoryFunction: componentFactoryFunction,
            virtual,
        };
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
        return Object.keys(this._componentTypes);
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
            instantiator = this._componentTypes[typeName];
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
    override bindComponent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig): ComponentContainer.BoundComponent {
        let instantiator: GoldenLayout.ComponentInstantiator | undefined;

        const typeName = ResolvedComponentItemConfig.resolveComponentTypeName(itemConfig);
        if (typeName !== undefined) {
            instantiator = this._componentTypes[typeName];
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

        let result: ComponentContainer.BoundComponent;
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
                    ensureElementPositioned(virtuableComponent.rootHtmlElement);
                    this._virtuableComponentMap.set(container, virtuableComponent);
                    container.sizeChangedEvent = this._containerSizeChangedEventListener;
                    container.visibilityChangedEvent = this._containerVisibilityChangedEventListener;
                    component = undefined; // Do not pass component to container. Container does not expect it as virtual
                }
            }

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
        const virtuableComponent = this._virtuableComponentMap.get(container);
        if (virtuableComponent === undefined) {
            super.unbindComponent(container, virtual, component)
        } else {
            this._virtuableComponentMap.delete(container);
        }
    }

    private handleContainerSizeChangedEvent(container: ComponentContainer, width: number, height: number): void {
        const virtuableComponent = this._virtuableComponentMap.get(container);
        if (virtuableComponent === undefined) {
            throw new UnexpectedUndefinedError('GLHCSCE55933');
        } else {
            const rootElement = virtuableComponent.rootHtmlElement;
            if (rootElement === undefined) {
                throw new RegisterError(i18nStrings[I18nStringId.ComponentIsNotVirtuable] + ' ' + container.title);
            } else {
                setElementWidth(rootElement, width);
                setElementHeight(rootElement, height);
            }
        }
    }

    private handleContainerVisibilityChangedEvent(container: ComponentContainer, visible: boolean): void {
        const virtuableComponent = this._virtuableComponentMap.get(container);
        if (virtuableComponent === undefined) {
            throw new UnexpectedUndefinedError('GLHCVCE55934');
        } else {
            const rootElement = virtuableComponent.rootHtmlElement;
            if (rootElement === undefined) {
                throw new RegisterError(i18nStrings[I18nStringId.ComponentIsNotVirtuable] + ' ' + container.title);
            } else {
                setElementDisplayVisibility(virtuableComponent.rootHtmlElement, visible);
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
