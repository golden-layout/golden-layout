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

If you change `createComponentElement` you are responsible for allocating the component's root HTML element. It can be anywhere - for example as a child of `document.body`. It can also be a pre-existing element: Perhaps you don't want to set up GoldenLayout if there is just a single component, waiting until a _second_ component is created. The return value of `createComponentElement` is the  component's root HTML element.  Golden Layout will normally handle re-position and re-sizing the component as needed, though you can set handlers to override these and other actions.

A complication is if `copyForDragImage` is set. [See here.](#the-copyfordragimage-setting)

### Virtual Components

If `createComponentElement` returns `undefined` then the component is virtual.  Golden Layout calculates the space and position allocated for each component, but you are responsible for actually positioning the components, using functions called from Golden Layout. You may also need to adjust focus and visibility.

With virtual components, Golden Layout knows nothing about components and does not include the component's HTML elements in its own DOM hierarchy. Instead, whenever a component needs its position, size or visibility changed, Golden Layout will fire events which allow the application to change a component's position, size or visibility.  This is analogous to virtual grids where strings and other content to be displayed in a grid, are not included within the grid. Instead the grid fires events whenever it needs to display content. The application will return the required content.

When using virtual components, think of Golden Layout as more of an engine calculating position rather than actually positioning components. This binding method requires more work to set up than other binding methods. However it offers more flexibility and opens up more design opportunities. For example with virtual components, any HTML element could be the parent for your components (not just the Golden Layout container). You can even have different parents for different components. This allows, for example, some of your components have one parent, and the others a different parent. They could then inherit different CSS or handle event propagation differently.

Virtual components should have the `position` property as `absolute` - or at least not `static`. Also, the `overflow` property should be `hidden`.

If you don't override `notifyResize` GoldenLayout may change the element's CSS properties `height` and `width`, as well as `position` (to `absolute`) and `z-index`. If your application also sets the height or width of a components root HTML element, you will need to modify your design. This can easily be done by giving the current root HTML element a new parent element and making this parent the new root HTML element for the component. Your component logic can continue to use the existing element while Golden Layout uses the new root HTML element.

## Registering initialization functions

After element allocation, an initialization function is called.
This is a function registered using `registerComponent` or `registerComponentDefault`.
This function should should custsom initailization, including setting any needed callback functions.

Registering a component and specifying static positioning is the classic GoldenLayout approach to binding components. The components are registered with GoldenLayout and specify a constructor or callback function used to create a component whenever a new instance is needed in the layout. When the constructor or callback is invoked, it is passed a container object which includes a HTML element. The constructor or callback will create the object and make its top level HTML element a child of the container's HTML element. The component is then part of the Golden Layout's DOM hierarchy. Whenever the layout is re-arranged, the GoldenLayout DOM is adjusted to reflect the new layout hierarchy. Effectively this involves the ancestors of components' root HTML elements being reparented when a layout is changed.

The following functions can be used to register components.
* `GoldenLayout.registerComponent()`
* `GoldenLayout.registerComponentFactoryFunction()`
* `GoldenLayout.registerComponentFunction()`
* `GoldenLayout.registerGetComponentConstructorCallback()`

## Callbacks for virtual components

A virtual component is one that does not have an element managed by
GoldenLayout. In this case, the application is responsible for managing
the components position and visibility, using handler functions.
These handlers are normally set in `registerComponent`:
```
function myRegisterComponent(container, componentConfig) {
    const handle = container.handle;
    container.notifyResize = (container, x, y, width, height) => {
        setPosition(handle, x, y, width, height);
    };
    container.virtualVisibilityChangeRequiredEvent = (container, visible) => this.handleContainerVisibilityChangeRequiredEvent(container, visible);
    ... etc ...
}
myGoldenLayout.registerComponent('mycomponent', myRegisterComponent);
```

### `ComponentContainer.notifyResize: (container, x, y, width, height) => void`
Fired when a component's position and/or size need to be changed. The handler is passed the container and the component's required position and size. Typically, the handler would:
    * find the component `container.handle` as the key,
    * get the Golden Layout's root HTML element's position using `getBoundingClientRect()`, (Alternatively, it can used the position calculated by the handler for the `NotifyResize` event.)
    * get the container's position using `getBoundingClientRect()`,
    * calculate the container's position relative to Golden Layout's root HTML element position.
    * accordingly, update the following properties in the component's top level HTML element:
        * `left`
        * `top`
        * `width`
        * `height`

    Example:

```typescript
    private handleNotifyResize(container: ComponentContainer, x: number, y: number, width: number, height: number) {
        const component = container.handle;
        if (component === undefined) {
            throw new Error(''handleNotifyResize: Component not found');
        }

        const rootElement = component.rootHtmlElement;
        if (rootElement === undefined) {
            throw new Error('handleNotifyResize: Component does not have a root HTML element');
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

### `LayoutManager.beforeResizingEvent: (count) => void`
This event does not need to be handled. However it can be used to optimise positioning of components. Whenever a layout is changed, it may be that several components need to be repositioned.  This event will be fired whenever one or more components need to be positioned as the result of one layout change.  Typically it is used to get the position of Golden Layout's root HTML element, using `getBoundingClientRect()`. This can then be cached for use when each component's position needs to be calculated.

Example:
```typescript
    private handleBeforeResizingEvent(count: number) {
        this._goldenLayoutBoundingClientRect = this._layoutElement.getBoundingClientRect();
    }
```

### `ComponentContainer.virtualVisibilityChangeRequiredEvent: (container, visible) => void;`
Fired when a component's visibility needs to be changed. The handler is passed the container and a boolean specifying visibility. Typically, the handler would:
* find the component, perhaps using `container.handle`.
* change its visibility using the `display` property in the component's top level HTML element.

Example:
```typescript
private handleContainerVisibilityChangeRequiredEvent(container: ComponentContainer, visible: boolean) {
    const componentRootElement = container.handle;
    if (visible) {
        componentRootElement.style.display = '';
    } else {
        componentRootElement.style.display = 'none';
    }
}
```

### `ComponentContainer.virtualZIndexChangeRequiredEvent: (container, logicalZIndex, defaultZIndex) => void`
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

### `ComponentContainer.on('beforeComponentRelease', (handle) => ...)`

Called when component is released from GoldenLayout.

### `ComponentContainer.on('destroy', () => ...)`

_This API is subject to change._

Called when component is removed from GoldenLayout.
Called after `'beforeComponentRelease`.

When a component is removed from Golden Layout it will be necessary to remove the component's top level HTML elements as children of `container.element`. Other component 'tear-down' actions may also be required. These actions can be carried out in either the `destroy`` event or the component container's `beforeComponentRelease` event (or both). Both these events will be fired (if handlers are assigned) when a component is no longer needed in Golden Layout.

## The `copyForDragImage` setting

If the `copyForDragImage` setting (in `LayoutConfig`) is true, then an extra level of HTML element nesting is created: The result of `createComponentElement` gets the `class` `lm_component`.  It has a single child which has the `class` `lm_content`.  The latter is the actual element used by your application.

If `copyForDragImage` is false, the `lm_component` and the `lm_content` are the same element.

If `copyForDragImage` is undefined, the default `createComponentElement` will treat it as true. A custom `createComponentElement` can do as it will, but it is recommended that it also create separate `lm_component` and `lm_content` elemens if `copyForDragImage` is undefined _or_ true.

Having distinct `lm_component` and `lm_content` elements allows Golden Layout to create a nicer visual representation (a drag image or drag proxy) when a component is dragged using native drag-and-drop.

(Creating a drag image is done differently when the `useDragAndDrop` setting is false.)

### Scaled components (zoom)

If you use a `scale` `transform` to resize (zoom) you components (or the entire window) you need to notify GoldenLayout of this so it can correctly calculate sizes.  You can either scale the entire layout or just a single component.

To scale the entire layout, call the `LayoutManager.scale` function. For example:
```
function scaleLayout(zoom: number): void {
    const bodyStyle = document.body.style;
    if (zoom && (zoom < 0.99 || zoom > 1.01)) {
        const topElement = document.documentElement;
        bodyStyle.width = `${topElement.offsetWidth / zoom}px`;
        bodyStyle.height = `${topElement.offsetHeight / zoom}px`;
    } else {
        bodyStyle.width = "";
        bodyStyle.height = "";
    }
    layout_manager.scale(zoom);
}
```

To scale a single component, call the `scale` method of the `ComponentContainer`.
This assumes you have set a `scale` `transform` on the content element (`lm_content`).  (If you scale an inner element, GoldenLayout doesn't care about that.)
The effective scale is the product of the global scale and the component scale.
