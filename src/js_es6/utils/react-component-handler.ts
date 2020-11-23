import React from 'react';
import ReactDOM from 'react-dom';
import { ReactComponentConfig } from '../config/config';
import { ComponentContainer } from '../container/component-container';
import { UnexpectedNullError } from '../errors/internal-error';
import { ComponentItem } from '../items/component-item';
import { JsonValue } from './types';
import { extend } from './utils';

// This needs more attention - refer to original Javascript ReactComponentHandler

/**
 * A specialised GoldenLayout component that binds GoldenLayout container
 * lifecycle events to react components
 * @internal
 */
export class ReactComponentHandler {
    private _reactComponent: React.Component | null;
    // eslint-disable-next-line @typescript-eslint/ban-types
    private _originalComponentWillUpdate: Function | null;
    private _container: ComponentContainer;
    private _initialState: unknown;
    private _reactClass: ComponentItem.ComponentConstructor;

    private _containerOpenListener = () => this.render();
    private _containerDestroyListener = () => this.destroy();

    /**
     * @param container -
     * @param state - State is not required for react components
     */
    constructor(container: ComponentContainer, state: unknown) {
        this._reactComponent = null;
        this._originalComponentWillUpdate = null;
        this._container = container;
        this._initialState = state;
        this._reactClass = this.getReactClass();

        this._container.on('open', this._containerOpenListener);
        this._container.on('destroy', this._containerDestroyListener);
    }



    /**
     * Creates the react class and component and hydrates it with
     * the initial state - if one is present
     *
     * By default, react's getInitialState will be used
     */
    private render(): void {
        // probably wrong
        ReactDOM.render(this.getReactComponent(), this._container.contentElement);
        // ReactDOM.render(this._getReactComponent(), this._container.getElement()[0]);
    }

    /**
     * Fired by react when the component is created.  Also fired upon destruction (where component is null).
     * <p>
     * Note: This callback is used instead of the return from `ReactDOM.render` because
     *	   of https://github.com/facebook/react/issues/10309.
     * </p>
     *
     * @arg {React.Ref} component The component instance created by the `ReactDOM.render` call in the `_render` method.
     */
    private gotReactComponent(component: React.Component | null): void {
        if (component !== null) {
            this._reactComponent = component;
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this._originalComponentWillUpdate = this._reactComponent.componentWillUpdate || function() {};
            this._reactComponent.componentWillUpdate = this.onUpdate.bind( this );
            if( this._container.getState() ) {
                this._reactComponent.setState( this._container.getState() as Record<string, unknown> );
            }
        }
    }
    
    /**
     * Removes the component from the DOM and thus invokes React's unmount lifecycle
     */
    private destroy(): void {
        ReactDOM.unmountComponentAtNode(this._container.contentElement);
        this._container.on('open', this._containerOpenListener);
        this._container.off('destroy', this._containerDestroyListener);
    }

    /**
     * Hooks into React's state management and applies the componentstate
     * to GoldenLayout
     */
    private onUpdate(nextProps: unknown, nextState: JsonValue): void {
        this._container.setState(nextState);
        if (this._originalComponentWillUpdate === null) {
            throw new UnexpectedNullError('RCHOU11196');
        } else {
            this._originalComponentWillUpdate.call(this._reactComponent, nextProps, nextState);
        }
    }

    /**
     * Retrieves the react class from GoldenLayout's registry
     */
    // * @returns {React.Class}
    // assume this is returning a constructor
    private getReactClass() {
        const config = this._container.config as ReactComponentConfig;
        const componentName = config;

        if (!componentName) {
            throw new Error('No react component name. type: react-component needs a field `component`');
        }

        const reactClass = this._container.layoutManager.getComponentInstantiator(this._container.config).constructor;

        if (!reactClass) {
            throw new Error('React component "' + componentName + '" not found. ' +
                'Please register all components with GoldenLayout using `registerComponent(name, component)`');
        }

        return reactClass;
    }

    /**
     * Copies and extends the properties array and returns the React element
     */
    // * @returns {React.Element}
    // return type probably wrong
    private getReactComponent(): React.ReactElement {
        const defaultProps = {
            glEventHub: this._container.layoutManager.eventHub,
            glContainer: this._container,
            ref: this.gotReactComponent.bind(this),
        };
        const config = this._container.config as ReactComponentConfig;
        let props = config.props;
        if (props === undefined) {
            props = defaultProps;
        } else {
            props = extend(defaultProps, config.props as Record<string, unknown>);
        }
        // totally wrong - needs more work
        return React.createElement(this._reactClass as unknown as string, props as null);
        // return React.createElement(this._reactClass, props);
    }
}
