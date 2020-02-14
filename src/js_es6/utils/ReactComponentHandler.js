/**
 * A specialised GoldenLayout component that binds GoldenLayout container
 * lifecycle events to react components
 *
 * @constructor
 *
 * @param {ItemContainer} container
 * @param {Object} state state is not required for react components
 */


export default class ReactComponentHandler {
    constructor(container, state) {
        this._reactComponent = null;
        this._originalComponentWillUpdate = null;
        this._container = container;
        this._initialState = state;
        this._reactClass = this._getReactClass();
        this._container.on('open', this._render, this);
        this._container.on('destroy', this._destroy, this);
    }



    /**
     * Creates the react class and component and hydrates it with
     * the initial state - if one is present
     *
     * By default, react's getInitialState will be used
     *
     * @private
     * @returns {void}
     */
    _render() {
        ReactDOM.render(this._getReactComponent(), this._container.getElement()[0]);
    }

    /**
     * Fired by react when the component is created.
     * <p>
     * Note: This callback is used instead of the return from `ReactDOM.render` because
     *	   of https://github.com/facebook/react/issues/10309.
     * </p>
     *
     * @private
     * @arg {React.Ref} component The component instance created by the `ReactDOM.render` call in the `_render` method.
     * @returns {void}
     */
    _gotReactComponent(component) {
        this._reactComponent = component;
        this._originalComponentWillUpdate = this._reactComponent.componentWillUpdate || function() {};
        this._reactComponent.componentWillUpdate = this._onUpdate.bind( this );
        if( this._container.getState() ) {
            this._reactComponent.setState( this._container.getState() );
        }
    }
    
    /**
     * Removes the component from the DOM and thus invokes React's unmount lifecycle
     *
     * @private
     * @returns {void}
     */
    _destroy() {
        ReactDOM.unmountComponentAtNode(this._container.getElement()[0]);
        this._container.off('open', this._render, this);
        this._container.off('destroy', this._destroy, this);
    }

    /**
     * Hooks into React's state management and applies the componentstate
     * to GoldenLayout
     *
     * @private
     * @returns {void}
     */
    _onUpdate(nextProps, nextState) {
        this._container.setState(nextState);
        this._originalComponentWillUpdate.call(this._reactComponent, nextProps, nextState);
    }

    /**
     * Retrieves the react class from GoldenLayout's registry
     *
     * @private
     * @returns {React.Class}
     */
    _getReactClass() {
        var componentName = this._container._config.component;
        var reactClass;

        if (!componentName) {
            throw new Error('No react component name. type: react-component needs a field `component`');
        }

        reactClass = this._container.layoutManager.getComponent(componentName);

        if (!reactClass) {
            throw new Error('React component "' + componentName + '" not found. ' +
                'Please register all components with GoldenLayout using `registerComponent(name, component)`');
        }

        return reactClass;
    }

    /**
     * Copies and extends the properties array and returns the React element
     *
     * @private
     * @returns {React.Element}
     */
    _getReactComponent() {
        var defaultProps = {
            glEventHub: this._container.layoutManager.eventHub,
            glContainer: this._container,
            ref: this._gotReactComponent.bind(this),
        };
        var props = $.extend(defaultProps, this._container._config.props);
        return React.createElement(this._reactClass, props);
    }
}
