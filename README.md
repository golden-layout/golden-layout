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
* Reponsive design

The 'd-n-d-api' branch is an experimental fork making use
of the [HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API).
This enables:

* Drag from one window and drop to another.
* Drag from one window and drop to desktop as new window (popout).
* Cancel a drag (usually by typing Escape before releasing mouse).

*This is experimental with an unstable API and known issues.*
It is used in the`drag-drop` branch of [DomTerm](https://github.com/PerBothner/DomTerm/).

The 'd-n-d-api' branch builds on the 'tab-renderer' branch,
which is part of [GL pull request #759](https://github.com/golden-layout/golden-layout/pull/759).

## Installation
The library can be installed into an application package with the npm command:\
`npm i golden-layout`

## More information

For more information, please refer to the [Golden Layout website](https://golden-layout.github.io/golden-layout)
