# Layout Resizing

A layout should normally resize to always fit within Golden Layout's container element.  This resizing can be configured to occur automatically or can be manually managed.

Three `LayoutManager` properties control how Golden Layout will resize its layout when the Golden Layout's container changes size:

1. `resizeWithContainerAutomatically`\
Specifies whether automatic resizing is enabled. If this is `true`, then Golden Layout will automatically resize a layout whenever its container's size changes. If it is `false`, then the application needs to manage resizing Golden Layout.
1. `resizeDebounceInterval`\
A debounce interval to reduce the number of layout resizes when the container's size is being changed. Default is 100 milliseconds. This only has effect when automatic resizing is enabled.
1. `resizeDebounceExtendedWhenPossible`\
Specifies that a layout resize operation should be delayed as long as possible while the container is being resized. If this is `true` (the default), normally the layout will not be resized while the container is in the process of being resized. This only has effect when automatic resizing is enabled.

It is recommended that the container's `overflow` property be set to `clip` when automatic resizing is enabled.

If automatic resizing is disabled (`LayoutManager.resizeWithContainerAutomatically` is `false`), then the application can use `LayoutManager.setSize()` to manually resize Golden Layout. It is hard to think of a use case for disabling automatic resizing. Managing Golden Layout's container's size is probably a better application design approach than managing Golden Layout's size directly.

In version 2 of Golden Layout, the default value of `LayoutManager.resizeWithContainerAutomatically` is `true` if the Golden Layout container is `<body>`.  Otherwise it is `false`.  These default values maintain backwards compatibility.  When version 3 is released, the default value will be changed to always be 'true'.

Note that Golden Layout uses [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to detected changes in its container HTML element.  This API is not available in Internet Explorer. If your application supports Internet Explorer you will need to use a polyfill.  However please note, as per browserslist in `package.json`, Golden Layout only supports modern browsers and does not support Internet Explorer.

