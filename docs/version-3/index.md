# Version 3

This version is a substantial and incompatible change from the previous (2.6.0) version.

## Binding via Events

* Both "Embedding via Events" and "Virtual via Events" are deprecated, unsupported, and probably no longer working. These binding methods are likely to be removed. The `createComponentElement` function should provide similar funtionality; let us know if that is not the case.

* The `VirtualLayout` class is deprecated and may be removed.

## Registration functions

* The `registerComponent` function is un-deprecated, but only accepts a component factory function, not a constructor.

* Removed `registerComponentFactoryFunction`. Just use `registerComponent`.

* Calling `registerComponentConstructor(type, constructor)` is now just a shorthand for `registerComponent(type, (container,config) => new constructor(container, config)`.

* Removed `registerComponentFunction`. Use `registerComponentDefault`.

* The componentFactoryFunction registered by `registerComponent` (and related functions) now returns an application-specific "handle". The value is saved in the`ComponentContainer` object and can be accessed by the `ComponentContainer.handle` function. The handle can be anything; it not used by GoldenLayout. An application can use it to identify a virtual component.

* The `registerComponent` function (and related functions) no longer accepts an optional `virtual` argument

## Positioning ("Recting") events renamed

* The `virtualRectingRequiredEvent` callback is deprecated. Use `notifyResize` instead.

* Renamed `beforeVirtualRectingEvent` and `afterVirtualRectingEvent` (in `LayoutManager`) to `beforeResizingEvent` and `afterResizingEvent`.

## DragSource to drag a button

You can use `manager.newDragSource` to create a `"NEW"` button that you can drag and drop into an area, crating a new window there. This needs more polishing and testing.
