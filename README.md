# Golden Layout

[![NPM version](https://img.shields.io/npm/v/golden-layout)](https://www.npmjs.com/package/golden-layout) [![License](https://img.shields.io/github/license/golden-layout/golden-layout)](https://img.shields.io/github/license/golden-layout/golden-layout)

Golden Layout is a Javascript layout manager which enables you to layout components in a web page and re-arrange them with drag and drop. Its features include:

* Native popup windows
* Touch support
* Support for application frameworks such as Angular and Vue
* Virtual components
* Comprehensive API
* Load and save layouts
* Focus components
* Completely themeable
* Works in modern browsers (Firefox, Chrome)
* Responsive design

This fork has a number of advances over the semi-unmaintained upstream.
The main feature is optional use
of the [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API).
This enables:

* Drag from one window and drop to another.
* Drag from one window and drop to desktop as new window (popout).
* Cancel a drag (usually by typing Escape before releasing mouse).
* Optionally drag-image (proxy) is snapstop of dragged component.

Other features include:

* Customizable tab-bar header.
* Smart display of tabs when space gets tight.
* If there is a single stack (one row and columne but posssible multiple tabs)
the tab-bar header can be embedded inside a custom (html) titlebar.
* Component elements are not re-parented when moved within a window.
This avoide breaking iframes, sockets, etc.
* If running under Qt or Electron (experimental) it is possible to
use virtual binding with each compoent in the separate browsercontext.
Then you can move components between top-level windows by without
serializing the contents.

This is used in [DomTerm](https://github.com/PerBothner/DomTerm/).

The API is not stable or well documented nor compatible with upstream.
Most specifically, I feel no need to be compatible with the old mechanisms
for [Binding Components](https://golden-layout.github.io/golden-layout/binding-components/) as they are overly complicated and redundant.
The default binding method will not move a component's element in the DOM tree
when you moving within the original window. Thus iframes and sockets
will remain valid.

Since upstream is inactive, I see no point in creating clean pull requests.
Likewise, documenting my changes or cleaning up the APIs is not a
priority unless I see signs of actual users.
If you do want to use my fork, feel free to create an Issue or
email me if you need help - that may spur me to clean things up a bit.

## Installation
The library can be installed into an application package with the npm command:\
`npm i golden-layout`

## More information

For more information, please refer to the [Golden Layout website](https://golden-layout.github.io/golden-layout)
