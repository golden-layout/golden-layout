# Binding Components

Golden Layout binds to components and then controls their position, size and visibility (positioning) so that they fit within a layout.

You can control how a component is allocated and bound by setting the `createComponentElement` function, or by registering a initialization function
using `registerComponent` or `registerComponentDefault`.

1. The `createComponentElement` function normally creates an HTML element that will contain the content of the component.  The default `createComponentElement` creates an child of the main Golden Layout root (ground) element. If you override `createComponentElement` you can create or re-use some other element.  If a call to `createComponentElement` returns `undefined` then the component is considered "virtual".

2. After `createComponentElement` returns an initialization function is called. This is a function you have registered with `registerComponent` or `registerComponentDefault`. The initialization function returns a `ComponentContainer.Handle` which can be any JavaScript value that is useful. For example it can be handle to an object in a framework like React or Vue. If there is no matching initialization function, then no further initialization is done, beyond whatever you have done in `createComponentElement`.

## Component element allocation

### Default allocation

If you don't set `createComponentElement` then Golden Layout will instantiate the component's root HTML element within Golden Layout's own DOM hierarchy sub-tree, as a direct child of the root element. Components and their ancestors are not reparented when a layout is changed, assuming the component remains in the same top-level window and Golden Layout instance. This avoids breaking iframe, sockets, etc.

### Custom Allocation

If you change `createComponentElement` you are responsible for allocating the component's root HTML element. It can be anywhere - for example as a child of `document.body`. It can also be a pre-existing element - for example if you want to create an initial component, only loading Golden Layout when you create a second component. The return value of `createComponentElement` is the  component's root HTML element.  Golden Layout will normally handle handle re-position and re-sizing the component as needed, though you can set handlers to override these and other actions.

A complication is if `copyForDragImage` is set. [See here.](#the-copyfordragimage-setting)

### Virtual Components

If `createComponentElement` return `undefined` then the component is virtual.  Golden Layout calculates the space and position allocated for each component, but you are responsible for actually positioning the components, using functions called from Golden Layout. You may also need to adjust focus and visibility.

## The `copyForDragImage` setting

If the `copyForDragImage` setting (in `LayoutConfig`) is true, then an extra level of HTML element nesting is created: The result of `createComponentElement` gets the `class` `lm_component`.  It has a single child which has the `class` `lm_content`.  The latter is the actual element used by your application.

If `copyForDragImage` is false, the `lm_component` and the `lm_content` are the same element.

If `copyForDragImage` is undefined, the default `createComponentElement` will treat it as true. A custom `createComponentElement` can do as it will, but it is recommended that it also create separate `lm_component` and `lm_content` elemens if `copyForDragImage` is undefined _or_ true.

Having distinct `lm_component` and `lm_content` elements allows Golden Layout to create a nicer visual representation (a drag image or drag proxy) when a component is dragged using native drag-and-drop.

(Creating a drag image is done differently when the `useDragAndDrop` setting is false.)

## Old - needs to be updated/replaced.

There are 4 ways Golden Layout can bind to a component:

1. **Embedding via Registration** (classic)

_Replace by default alllocation_
A component's constructor/factory is registered with Golden Layout. Golden Layout will instantiate an instance when required. The constructor/factory will add the component's root HTML element within Golden Layout's own DOM hierarchy sub-tree. This is the classic Golden Layout binding method. With this binding method an ancestor of the component's root HTML element could be reparented if the layout changes.

1. **Embedding via Events**\
Components are obtained on demand by events. An event handler will construct or otherwise fetch the component and return it. The event handler will also add the component's root HTML element within Golden Layout's own DOM hierarchy sub-tree. This is the binding method introduced in version 2.

1. **Virtual via Registration**\
A component's constructor/factory is registered with Golden Layout. Golden Layout will instantiate an instance when required. The component will use the same positioning as virtual components however Golden Layout will handle all the events internally.

1. **Virtual via Events** (Virtual Components)\
With virtual components, Golden Layout never interacts directly with components. The application controls the construction/allocation, destruction/deallocation and positioning of components. Golden Layout will advise the application when components are needed and no longer needed via events. It will also advise about components' positioning via events. This allows an application to control the placement of components in the DOM hierarchy and components' root HTML element's ancestors are not reparented when the layout is changed.

## Embedding via Registration

Registering a component and specifying static positioning is the classic GoldenLayout approach to binding components. The components are registered with GoldenLayout and specify a constructor or callback function used to create a component whenever a new instance is needed in the layout. When the constructor or callback is invoked, it is passed a container object which includes a HTML element. The constructor or callback will create the object and make its top level HTML element a child of the container's HTML element. The component is then part of the Golden Layout's DOM hierarchy. Whenever the layout is re-arranged, the GoldenLayout DOM is adjusted to reflect the new layout hierarchy. Effectively this involves the ancestors of components' root HTML elements being reparented when a layout is changed.

The following functions can be used to register components.
* `GoldenLayout.registerComponent()`
* `GoldenLayout.registerComponentConstructor()`
* `GoldenLayout.registerComponentFactoryFunction()`
* `GoldenLayout.registerComponentFunction()`
* `GoldenLayout.registerGetComponentConstructorCallback()`

## Embedding via Events

To give applications more control over the allocation of components, you can bind components with events instead of registration. If a handler is assigned to the event `VirtualLayout.bindComponentEvent` it will be fired whenever a new component is needed. The handler should:
* create or fetch the component,
* make sure its top level HTML elements are made children of `container.element`,
* return the component inside a `BindableComponent` interface with `virtual: false`.

When a component is removed from Golden Layout it will be necessary to remove the component's top level HTML elements as children of `container.element`. Other component 'tear-down' actions may also be required. These actions can be carried out in either the `VirtualLayout.unbindComponentEvent` event or the component container's `beforeComponentRelease` event (or both). Both these events will be fired (if handlers are assigned) when a component is no longer needed in Golden Layout.

## Virtual via Events

With virtual components, Golden Layout knows nothing about components and does not include the component's HTML elements in its own DOM hierarchy. Instead, whenever a component needs its position, size or visibility changed, Golden Layout will fire events which allow the application to change a component's position, size or visibility.  This is analogous to virtual grids where strings and other content to be displayed in a grid, are not included within the grid. Instead the grid fires events whenever it needs to display content. The application will return the required content.

Virtual Components has the following advantages:
* It is no longer necessary to extract the top level HTML element from a component.
* Applications using frameworks with their own component hierarchy, such as Angular and Vue, no longer have to break their component hierarchy to insert Golden Layout. The framework's methodology for handling parent/child relationships can be maintained even with the components which Golden Layout is positioning. (Teleporting component's HTML elements is no longer necessary)
* Applications typically bind a component's top level HTML element to the Golden Layout root element. Debugging becomes easier as the DOM hierarchy relevant to your application is a lot shallower.

With Virtual Components the following events need to be handled:
* `VirtualLayout.bindComponentEvent: (container, itemConfig) => ComponentContainer.BindableComponent`\
    Fired whenever a GoldenLayout wants to bind to a new component. The handler is passed the container and the item's resolved config. Typically, the handler would:
    * create or fetch the component using `itemConfig`,
    * get the the component's top level HTML component,
    * ensure this element has `absolute` position,
    * make the element a child of Golden Layout's root HTML element,
    * store the component in a map using `container` as the key,
    * add handlers to the container's `virtualRectingRequiredEvent` and `virtualVisibilityChangeRequiredEvent` events,
    * return the component in an `BindableComponent` interface with `virtual: true`.

    Example:
    ```typescript
    private handleBindComponentEvent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig) {
        // Use ResolvedComponentItemConfig.resolveComponentTypeNamecan to resolve component types to a unique name
        const componentTypeName = ResolvedComponentItemConfig.resolveComponentTypeName(itemConfig);
        if (componentTypeName === undefined) {
            throw new Error('handleBindComponentEvent: Undefined componentTypeName');
        }
        const component = this.createVirtualComponent(container, componentTypeName, itemConfig.componentState);
        const componentRootElement = component.rootHtmlElement;
        this._layoutElement.appendChild(componentRootElement);
        this._boundComponentMap.set(container, component);
        container.virtualRectingRequiredEvent = (container, width, height) => this.handleContainerVirtualRectingRequiredEvent(container, width, height);
        container.virtualVisibilityChangeRequiredEvent = (container, visible) => this.handleContainerVisibilityChangeRequiredEvent(container, visible);
        return {
            component,
            virtual: true,
        };
    }
    ```
* `VirtualLayout.unbindComponentEvent: (container) => void`\
Fired when a component is removed from Golden Layout.  The handler is passed the container. Typically, the handler would:
    * find the component in the map using `container` as the key,
    * remove it as a child from Golden Layout's root HTML element,
    * remove it from the map.

    Example:
    ```typescript
    private handleUnbindComponentEvent(container: ComponentContainer) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleUnbindComponentEvent: Component not found');
        }

        const componentRootElement = component.rootHtmlElement;
        if (componentRootElement === undefined) {
            throw new Error('handleUnbindComponentEvent: Component does not have a root HTML element');
        }

        this._layoutElement.removeChild(componentRootElement);
        this._boundComponentMap.delete(container);
    }
    ```
* `LayoutManager.beforeVirtualRectingEvent: () => void`\
This event does not need to be handled. However it can be used to optimise positioning of components. Whenever a layout is changed, it may be that several components need to be repositioned.  This event will be fired whenever one or more components need to be positioned as the result of one layout change.  Typically it is used to get the position of Golden Layout's root HTML element, using `getBoundingClientRect()`. This can then be cached for use when each component's position needs to be calculated.

    Example:
    ```typescript
    private handleBeforeVirtualRectingEvent(count: number) {
        this._goldenLayoutBoundingClientRect = this._layoutElement.getBoundingClientRect();
    }
    ```
* `ComponentContainer.virtualRectingRequiredEvent: (container, width, height) => void;`\
Fired when a component's position and/or size need to be changed. The handler is passed the container and the component's required width and height. Typically, the handler would:
    * find the component in the map using `container` as the key,
    * get the Golden Layout's root HTML element's position using `getBoundingClientRect()`, (Alternatively, it can used the position calculated by the handler for the `virtualRectingRequiredEvent` event.)
    * get the container's position using `getBoundingClientRect()`,
    * calculate the container's position relative to Golden Layout's root HTML element position.
    * accordingly, update the following properties in the component's top level HTML element:
        * `left`
        * `top`
        * `width`
        * `height`

    Example:
    ```typescript
    private handleContainerVirtualRectingRequiredEvent(container: ComponentContainer, width: number, height: number) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleContainerVirtualRectingRequiredEvent: Component not found');
        }

        const rootElement = component.rootHtmlElement;
        if (rootElement === undefined) {
            throw new Error('handleContainerVirtualRectingRequiredEvent: Component does not have a root HTML element');
        }

        const containerBoundingClientRect = container.element.getBoundingClientRect();
        const left = containerBoundingClientRect.left - this._goldenLayoutBoundingClientRect.left;
        rootElement.style.left = this.numberToPixels(left);
        const top = containerBoundingClientRect.top - this._goldenLayoutBoundingClientRect.top;
        rootElement.style.top = this.numberToPixels(top);
        rootElement.style.width = this.numberToPixels(width);
        rootElement.style.height = this.numberToPixels(height);
    }
    ```
* `ComponentContainer.virtualVisibilityChangeRequiredEvent: (container, visible) => void;`\
Fired when a component's visibility needs to be changed. The handler is passed the container and a boolean specifying visibility. Typically, the handler would:
    * find the component in the map using `container` as the key,
    * change its visibility using the `display` property in the component's top level HTML element.

    Example:
    ```typescript
    private handleContainerVisibilityChangeRequiredEvent(container: ComponentContainer, visible: boolean) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleContainerVisibilityChangeRequiredEvent: Component not found');
        }

        const componentRootElement = component.rootHtmlElement;
        if (componentRootElement === undefined) {
            throw new Error('handleContainerVisibilityChangeRequiredEvent: Component does not have a root HTML element');
        }

        if (visible) {
            componentRootElement.style.display = '';
        } else {
            componentRootElement.style.display = 'none';
        }
    }
    ```
* `ComponentContainer.virtualZIndexChangeRequiredEvent: (container, logicalZIndex, defaultZIndex) => void`\
Fired when a component's z-index needs to be changed. The handler is passed the container and a logical z-index and the default style z-index. Typically, the handler would:
    * find the component in the map using `container` as the key,
    * change its z-index to the default style z-index specified in `defaultZIndex`.

    Example:
    ```typescript
    private handleContainerVirtualZIndexChangeRequiredEvent(container: ComponentContainer, logicalZIndex: LogicalZIndex, defaultZIndex: string) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleContainerVirtualZIndexChangeRequiredEvent: Component not found');
        }

        const componentRootElement = component.rootHtmlElement;
        if (componentRootElement === undefined) {
            throw new Error('handleContainerVirtualZIndexChangeRequiredEvent: Component does not have a root HTML element');
        }

        componentRootElement.style.zIndex = defaultZIndex;
    }
    ```

The apitest application demonstrates how virtual components are implemented.

When using virtual components, think of Golden Layout as more of an engine calculating position rather than actually positioning components. This binding method requires more work to set up than other binding methods. However it offers more flexibility and opens up more design opportunities. For example with virtual components, any HTML element could be the parent for your components (not just the Golden Layout container). You can even have different parents for different components. This allows, for example, some of your components have one parent, and the others a different parent. They could then inherit different CSS or handle event propagation differently.

## Virtual via Registration

These events give applications a lot of flexibility with positioning components in Golden Layout - but at the expense of more effort of integrating into Golden Layout. It is however, possible to get the same benefits of Virtual Components with just registering a component. In this case, a component will be registered as in classic approach to Golden Layout binding, however, within Golden Layout, the component will be handled like a virtual component. Golden Layout will internally handle the necessary events.

Existing applications using register functions in Golden Layout can easily be updated to use virtual binding by:
1. The register functions have a new parameter `virtual`. By default, this is `false`, specifying the classic binding in Golden Layout. Set this to `true` to specify that components of that type should be implemented internally as virtual components.
1. Components need to have a getter: `rootHtmlElement` which returns the component's root HTML element. Components written in TypeScript should implement the `GoldenLayout.VirtuableComponent` interface.
1. Components' `rootHtmlElement` element need to have its `overflow` CSS property set to hidden.
1. Ensure that the Golden Layout container HTML element is positioned (ie. its position property is not `static`).

With these changes, applications can continue to use Golden Layout as they are now however Golden Layout will internally use virtual component binding.

Please note there will be a couple of minor behaviour changes:
* Golden Layout will ensure a component's root HTML element has position type `absolute`.
* Golden Layout will modify the height and width of the root HTML element. In embedding bindings, Golden Layout modified the height and width of the container element - not the component's root HTML Element. If your application also sets the height or width of a components root HTML element, you will need to modify your design. This can easily be done by giving the current root HTML element a new parent element and making this parent the new root HTML element for the component. Your component logic can continue to use the existing element while Golden Layout uses the new root HTML element.
* Golden Layout will modify the z-index of the component's root HTML element.

Also note that 'virtual via registration' binding is not supported by the `GoldenLayout.registerGetComponentConstructorCallback()` registration function.

## Multiple binding methods

An application can use multiple methods of binding components for different component types. Whenever a component needs to be bound, Golden Layout will try to bind in the following order:
1. First check if its type has been registered. If so, it will bind using that registration.
1. Check whether there is a `bindComponentEvent` handler. If so, this event will be used to bind it as a virtual component.
1. Check whether there is a `getComponentEvent` handler. If so, this  event will be used to bind the component statically within the Golden Layout DOM. This method is deprecated.
1. If none of the above, then an exception will be raised.

If you use both 'Virtual via Events' and 'Embedding via Events', then the `unbindComponentEvent` handler can use the `ComponentContainer.virtual` field to determine which of these binding methods was used for a component.

## VirtualLayout class

The inheritance hierarchy for the Golden Layout class is: `LayoutManager` -> `VirtualLayout` -> `GoldenLayout`.

The `VirtualLayout` class implements all the Golden Layout functionality except for the register functions. If you only intend to use virtual components using the `bindComponentEvent`, you can create an instance of `VirtualLayout` instead of `GoldenLayout`.

## Usage Scenarios

* **Quick and easy**\
Use 'Embedding via Registration'. The classic way of using Golden Layout.
* **Backwards compatibility**\
If your existing application uses the Golden Layout registration functions, then it will automatically use 'Embedding via Registration' without any changes.
* **Deprecated `getComponentEvent`**\
To quickly get rid of this deprecation, use 'Embedding via Events'.
* **Easy virtual component bindings**\
Use 'Virtual via Registration' to get the advantages of Virtual Component binding with minimal changes to applications.
* **Maximum design flexibility**\
Use 'Virtual via Events' (Virtual Components).

