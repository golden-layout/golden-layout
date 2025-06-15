# Golden Layout API Guide

This document summarizes the main classes and methods available in the Golden Layout package. It consolidates details from the other markdown files under `docs/` to provide an overview of the public API and how it is typically used.

## Core Classes

### LayoutManager
The base class for both `GoldenLayout` and `VirtualLayout`. It manages the layout tree and provides common functionality.

Key methods include:

- `loadLayout(layoutConfig)` – Load a `LayoutConfig` describing the root item and content tree.
- `saveLayout()` – Return the current layout as a resolved configuration.
- `setSize(width, height)` – Resize the layout in pixels. Normally called automatically when the container changes size.
- `addComponent(componentType, componentState?, title?)` – Add a new component using default location selectors.
- `addComponentAtLocation(componentType, componentState?, title?, locationSelectors?)` – Insert a component at the first valid selector location.
- `newItem(itemConfig)` and `newItemAtLocation(itemConfig, locationSelectors?)` – Create `RowOrColumn`, `Stack` or `Component` items.
- `newDragSource(element, itemConfigCallback)` – Make an element draggable to create components when dropped into the layout.
- `removeDragSource(dragSource)` – Remove a previously created drag source.
- `focusComponent(item)` and `clearComponentFocus()` – Programmatically focus or blur a component item.
- `closeAllOpenPopouts()` – Close any browser pop-out windows that were opened by the layout.

### VirtualLayout
Extends `LayoutManager` and supports event‑based binding of virtual components.

Properties:
- `bindComponentEvent` and `unbindComponentEvent` – Event handlers to create or release components on demand.

This mode avoids DOM reparenting and works well with frameworks. See the **Binding Components** and **Frameworks** sections of the documentation for examples.

### GoldenLayout
Extends `VirtualLayout` and adds registration helpers:

- `registerComponentConstructor(type, constructor)` – Register a component class.
- `registerComponentFactoryFunction(type, callback)` – Register a factory function for creating components.
- `getComponentInstantiator(config)` – Retrieve a previously registered instantiator.

### ComponentContainer
Represents the container for an individual component. Useful members:

- `element` – The DOM element hosting the component.
- `initialState` – The initial state from the layout configuration.
- `stateRequestEvent` – When defined, fired during `saveLayout()` so the component can supply its latest state.
- `focus()` / `blur()` – Give or remove focus from the component.

### EventHub
The layout's `eventHub` allows communication between windows. Use `eventHub.emitUserBroadcast(data)` to send a message and listen for `userBroadcast` events to receive it.

## Example Usage

```ts
import { GoldenLayout, LayoutConfig } from 'golden-layout';

const config: LayoutConfig = {
    root: {
        type: 'row',
        content: [
            { type: 'component', componentType: 'Example' }
        ]
    }
};

const layout = new GoldenLayout(document.getElementById('layout'));

layout.registerComponentConstructor('Example', (container) => {
    container.element.textContent = 'Hello world';
});

layout.loadLayout(config);
```

## Further Reading

- [Binding Components](../binding-components/index.md)
- [Framework Integration](../frameworks/index.md)
- [Sizing Components](../sizing-components/index.md)
- [Layout Resizing](../layout-resizing/index.md)
- [Component Focus](../component-focus/index.md)
- [Location Selectors](../location-selectors/index.md)
- [Popouts](../popouts/index.md)

These documents provide more detail on each topic along with additional examples.
