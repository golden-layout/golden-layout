# Headers and buttons

## Display of buttons in header

Golden Layout will check 3 Config items' header to determine whether a header button is to be shown
1. Stack header
2. Stack's first component header (do not use this - only for backwards compatibility)
3. Layout header.

These are checked in the above order.  If the result of a check is undefined, then the next item is checked.  If it is `false`, then the button is not shown.  If it holds a string, then the button is displayed and the string's value will become the button's label.

`LayoutConfig.Header.<button>` will resolve to `false` if it is not specified in the config, so if all config items are undefined, then the button will not be displayed.
