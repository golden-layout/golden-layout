import EventEmitter from '../utils/EventEmitter';

export interface Container extends EventEmitter {
    /**
     * The current width of the container in pixel
     */
    width: number;

    /**
     * The current height of the container in pixel
     */
    height: number;

    /**
     * A reference to the component-item that controls this container
     */
    parent: ContentItem;

    /**
     * A reference to the tab that controls this container. Will initially be null
     * (and populated once a tab event has been fired).
     */
    tab: Tab;

    /**
     * The current title of the container
     */
    title: string;

    /*
     * A reference to the GoldenLayout instance this container belongs to
     */
    layoutManager: GoldenLayout;

    /**
     * True if the item is currently hidden
     */
    isHidden: boolean;

    /**
     * Overwrites the components state with the provided value. To only change parts of the componentState see
     * extendState below. This is the main mechanism for saving the state of a component. This state will be the
     * value of componentState when layout.toConfig() is called and will be passed back to the component's
     * constructor function. It will also be used when the component is opened in a new window.
     * @param state A serialisable object
     */
    setState(state: any): void;

    /**
     * This is similar to setState, but merges the provided state into the current one, rather than overwriting it.
     * @param state A serialisable object
     */
    extendState(state: any): void;

    /**
     * Returns the current state.
     */
    getState(): any;

    /**
     * Returns the container's inner element as a jQuery element
     */
    getElement(): JQuery;

    /**
     * hides the container or returns false if hiding it is not possible
     */
    hide(): boolean;

    /**
     * shows the container or returns false if showing it is not possible
     */
    show(): boolean;

    /**
     * Sets the container to the specified size or returns false if that's not possible
     * @param width the new width in pixel
     * @param height the new height in pixel
     */
    setSize(width: number, height: number): boolean;

    /**
     * Sets the item's title to the provided value. Triggers titleChanged and stateChanged events
     * @param title the new title
     */
    setTitle(title: string): void;

    /**
     * Closes the container or returns false if that is not possible
     */
    close(): boolean;
}
