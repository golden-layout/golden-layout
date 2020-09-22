export interface ItemConfig {
    /**
     * The type of the item. Possible values are 'row', 'column', 'stack', 'component' and 'react-component'.
     */
    type: string;

    /**
     * An array of configurations for items that will be created as children of this item.
     */
    content?: ItemConfigType[];

    /**
     * The width of this item, relative to the other children of its parent in percent
     */
    width?: number;

    /**
     * The height of this item, relative to the other children of its parent in percent
     */
    height?: number;

    /**
     * A String or an Array of Strings. Used to retrieve the item using item.getItemsById()
     */
    id?: string | string[];

    /**
     * Determines if the item is closable. If false, the x on the items tab will be hidden and container.close()
     * will return false
     * Default: true
     */
    isClosable?: boolean;

    /**
     * The title of the item as displayed on its tab and on popout windows
     * Default: componentName or ''
     */
    title?: string;
}

export interface ComponentConfig extends ItemConfig {
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
     */
    componentName: string;

    /**
     * A serialisable object. Will be passed to the component constructor function and will be the value returned by
     * container.getState().
     */
    componentState?: any;
}

export interface ReactComponentConfig extends ItemConfig {
    /**
     * The name of the component as specified in layout.registerComponent. Mandatory if type is 'react-component'
     */
    component: string;

    /**
     * Properties that will be passed to the component and accessible using this.props.
     */
    props?: any;
}
