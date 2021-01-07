# Golden Layout

[![NPM version](https://img.shields.io/npm/v/golden-layout)](https://www.npmjs.com/package/golden-layout) [![License](https://img.shields.io/github/license/golden-layout/golden-layout)](https://img.shields.io/github/license/golden-layout/golden-layout)

<!-- [![NPM version](https://badge.fury.io/js/golden-layout.svg)](http://badge.fury.io/js/golden-layout) [![Build Status](https://travis-ci.org/deepstreamIO/golden-layout.svg?branch=master)](https://travis-ci.org/deepstreamIO/golden-layout) -->

<!-- ![Screenshot](https://cloud.githubusercontent.com/assets/512416/4584449/e6c154a0-4ffa-11e4-81a8-a7e5f8689dc5.PNG) -->

Please note that this project is currently undergoing a larger maintenance and refactoring, we're targeting a 2.0 release somewhere in H1 2020.

## Features

* Full touch support
* Native popup windows
* Completely themeable
* Comprehensive API
* Powerful persistence
* Works in IE8+, Firefox, Chrome
* Reponsive design


## Installation / Usage

**IMPORTANT: This section refers to the unreleased 2.0 version of golden-layout, so keep this in mind and use the v1.5.9 tag for current works.**

golden-layout is shipped via npm, so to use it, run `npm i -S golden-layout`. 
If you are using webpack or another module bundler, you may wish to install it as dev-dep instead. 
We are shipping an UMD version, an ES5 + ES-Module version and an ES2015+ES-Module version of the library within the package.
Modern bundlers such as webpack should pick up the ES2015 version and transpile the code according to your applications configuration.

## Demo App

We have a demo application embedded within this repository, to run it, run:

```sh
git clone github.com/golden-layout/golden-layout
cd golden-layout
npm ci # (or npm i, if you use an old npm version)
npm run start-jquery
# the app is served at localhost:3000 and uses hot-reload, so you can hack right away within the library and the application.
```

## Development

Internally, we are using webpack and babel to have a build process. 
To get started, follow the steps described in demo-app. 
You can get a complete build by running `npm run build`, which will compile all versions of the app into the `dist` folder.

## Version 2 Information
Version 2 has been re-written in TypeScript. A general code cleanup has been carried out as part of this re-write.  

Also, some changes have been made to the GoldenLayout API.  Where possible, backwards compatibility has been retained,however functions and properties kept for backwards compatibility have been marked as deprecated. It is strongly recommend applications be migrated to the new API.

The API changes include 2 new events to support creation of components: `getComponentEvent` and `releaseComponentEvent`. With these events, it is far easier to integrate GoldenLayout into frameworks.  This example application demonstrates how to integrate GoldenLayout into Angular:
  [https://github.com/pbklink/golden-layout-ng-app](https://github.com/pbklink/golden-layout-ng-app)

### Version 2 status

All the version 1 Javascript code has been ported to TypeScript.  The UI (non-API) features of version 2 have been sufficiently tested for at least beta testing in production applications.  However Popout capabilities are not yet working.

The APIs implemented in the api-test application (included in the repository) have been tested and are ready for (at least beta) use in applications.  This includes:
* GoldenLayout constructor with container element
* `LayoutManager.registerComponentConstructor()` (replaces LayoutManager.registerComponent())
* `LayoutManager.getRegisteredComponentTypeNames()`
* `LayoutManager.loadLayout()`
* `LayoutManager.saveLayout()` (replaces LayoutManager.toConfig())
* `LayoutManager.loadComponentAsRoot()`
* `LayoutManager.addItem()`
* `LayoutManager.newSerialisableComponent()`
* `LayoutManager.setSize()` (replaces LayoutManager.updateSize())
* `LayoutManager.getComponentEvent`
* `LayoutManager.releaseComponentEvent`
* `ComponentContainer.stateRequestEvent`

The extent of the testing can be viewed by examining the api-test program and the above Angular GoldenLayout example program.

### Installing version 2

Currently version 2 is available from [https://github.com/pbklink/golden-layout](https://github.com/pbklink/golden-layout). Until this is available from the main GoldenLayout repository or NPM, you can install with the following steps:
1. Download or clone this repository
1. Run `npm install` to install dependencies
1. Run `npm run build:api` to build distribution
1. Run `npm link` so that you can link to this repository
1. In you application, remove the existing `golden-layout` repository
1. In your application, run `npm link golden-layout` to link it to the new GoldenLayout repository.

If you wish to use the api-test application, then from within the new GoldenLayout repository, either run:
* `npm run build:apitest` to just build it
* `npm run start:apitest` to both build and start the development server.  You can then view it in your browser.

### Migration guide

JQuery is no longer used.

The following API changes have been made:

#### Config
Configs are now strongly typed. In addition, GoldenLayout now has "Configs" and "Resolved Configs"
1. Configs\
Application developers will mainly work with "Configs".  A "Config" supports optional properties.  If a property is not specified, a default will be used.  In addition, "Config" also will handle backwards compatibility.  It will migrate deprecated properties to their new values.\
Config parameters in GoldenLayout API methods will be of type "Config".  The one exception is `LayoutConfig.saveLayout()` which returns a "Resolved Config".
1. Resolved Configs\
Golden-Layout internally uses "Resolved Config"s. Whenever an API function is passed a "Config", GoldenLayout will resolve it to its corresponding "Resolved Config".  This resolving process will set default values where an optional value has not been specified. It will also handle backwards compatibility.  This allows the GoldenLayout library to always work with fully configured Configs.

For persistence of configs, always save the "Resolved Config" returned by `LayoutManager.saveLayout()`. When reloading a saved Layout, first convert the saved "Resolved Config" to a "Config" by calling `LayoutConfig.fromResolved()`.

Both "Resolved Config" and "Config" have 2 types of interface hierarchies:
1. `ItemConfig`\
This specifies the config for a content item.
1. `LayoutConfig` (previously the `Config` interface)\
This specifies the config for a layout.

The (optional) `ItemConfig.id` property now has type `string` (instead of its previous `string | string[]` type).  For backwards compatibility, when `ItemConfig.id` is resolved, it will still accept an `id` with of type string array. This will allow handling of legacy saved configs in which `id` contains an array of strings (including possibly the legacy maximise indicator). When such an `id` is resolved, the array is first checked for the legacy maximise indicator and then the first element becomes the `id` string value.  The remaining elements are discarded.

The `ComponentItemConfig.componentName` property has now been replaced by property `ComponentItemConfig.componentType`.  `componentType` is of type `JsonValue`.  While a component type can now be specified by values that can be serialised by JSON, `componentType` must be of type `string` if it is registered with one of the following functions:
1. `LayoutManager.registerComponent()` (deprecated)
1. `LayoutManager.registerComponentConstructor()`
1. `LayoutManager.registerComponentFactoryFunction()`

A `LayoutConfig` has a `root` property which specifies the ItemConfig of root content item of the layout.  `root` is not optional and must always be specified.

`ResolvedLayoutConfig` now has functions to minify and unminify configurations:
1. `minifyConfig()` Replaces `LayoutManager.minifyConfig()`
1. `unminifyConfig()` Replaces `LayoutManager.unminifyConfig()`

For examples of how to create LayoutConfigs, please refer to the api-test program in the repository.

Many of the Config properties have been deprecated as they overlapped or were moved to more appropriate locations. Please refer to the `config.ts` source file for more information about these deprecations.

#### GoldenLayout class

GoldenLayout is now a distinct class which is a descendant of the LayoutManager class.  Your application should always create an instance of this class.

The GoldenLayout constructor takes one optional parameter: the HTML element which contains the GoldenLayout instance.  If this is not specified, GoldenLayout will be placed under `body`.

Note that the initial Layout is no longer specified in this constructor. Instead it is loaded with `LayoutManage.loadLayout()` (see below).

#### LayoutManager changes
1. Do not construct an instance of LayoutManager.  Construct an instance of GoldenLayout (see above).
1. `registerComponentConstructor()` (new function)\
Same as previous `registerComponent()` however only used when registering a component constructor.
1. `registerComponentFactoryFunction` (new function)\
Same as previous `registerComponent()` however only used when registering a call back function (closure) for creating components.
1. Do not use `registerComponent()`. Use the new `registerComponentConstructor()` or `registerComponentFactoryFunction()` instead.
1. `getComponentEvent` (new event)\
Generate a component needed by GoldenLayout. The parameters specify its container and `ItemConfig`. Use this event instead of `registerComponentConstructor()` or `registerComponentFactoryFunction` if you want to control the disposal of the component.
1. `releaseComponentEvent` (new event)\
Use in conjunction with `getComponentEvent` to release/dispose any component created for GoldenLayout
1. Do not call `init()`. Call `LayoutManager.loadLayout()` instead.
1. `loadLayout()` (new function)\
Will load the new layout specified in its `LayoutConfig` parameter.  This can also be subsequently called whenever the GoldenLayout layout is to be replaced.
1. `saveLayout()` (new function)\
Saves the current layout as a `LayoutConfig`. Replaces the existing `toConfig()` function.
1. Do not uses `minifyConfig()` of `unminifyConfig()` functions.  Use the respective functions in `ResolvedLayoutConfig`.
1. Do not call `toConfig()`. Call `LayoutManager.saveLayout()` instead.
1. `setSize()` (new function)\
Sets the size of the GoldenLayout instance in pixels. Replaces the existing `updateSize()` function.
1. Do not use `updateSize()`.  Use the new `LayoutManager.setSize()` instead.
1. `rootItem` (new property)
Specifies the root content item of the layout (not the Ground content item).
1. Do not use `root`. This has been replaced with the internal property `groundItem`. You probably want to use the new `rootItem` instead.

#### Content Items
1. `AbstractContentItem` has been renamed to `ContentItem`
1. `config` property has been removed. Use the toConfig() method instead (as recommended in the original GoldenLayout documentation).
1. Some of the previous `config` properties such as `id` and `type` are now available as properties of `ContentItem` or its descendants (where appropriate).
1. `id` now has type `string`.  (It used to be `string | string[]`.)
1. `ItemContainer` has been renamed to `ComponentContainer`
1. `Component` has been renamed to `ComponentItem`.  "Component" now refers to the external component hosted inside GoldenLayout
1. `Root` has been renamed to `GroundItem` and has been marked as internal only. Applications should never access GroundItem.  Note that the layout's root ContentItem is GroundItem's only child.  You can access this root ContentItem with `LayoutManager.rootItem`.
1. `Stack.getActiveContentItem()` and `Stack.setActiveContentItem()` have been renamed to respective `Stpack.getActiveComponentItem()` and `Stack.setActiveComponentItem()`

#### ComponentContainer
1. `contentElement` (new property - replaces `getElement()`)\
Returns HTMLElement which hosts component
1. Do not use `getElement()`. Use the new `contentElement` property instead
1. `initialState` (new getter)\
Gets the componentState of the `ComponentItemConfig` used to create the contained component.
1. `stateRequestEvent` (new event)\
If set, `stateRequestEvent` is fired whenever GoldenLayout wants the latest state for a component. Calling `LayoutManager.saveLayout()` will cause this event to be fired (if it is defined).  If it is not defined, then the initial state in the ItemConfig or the latest state set in `setState()` will be saved.
1. `beforeComponentRelease` (new EventEmitter event)\
`beforeComponentRelease` is emitted on the container before a component is released.  Components can use this event to dispose of resources.
1. Do not use `getState()` unless you are using the deprecated `setState()`. Use `ComponentContainer.initialState` getter if you have migrated to the new `ComponentContainer.stateRequestEvent`.
1. `setState()` has been marked as deprecated. If possible, use the new `stateRequestEvent` event instead.
1. `replaceComponent()` allows you to replace a component in a container without otherwise affecting the layout.

#### Header and Tab
Several properties and functions have been renamed in `header.ts` and `tab.ts`. Please search for "@deprecated" in these files for these changes.

#### Deprecations
For most changes, the existing functions and properties have been left in place but marked as deprecated.  It is strongly recommended that applications be reworked not to use these deprecations. Bugs associated with deprecations will be given low priority (or not fixed at all).  Also, deprecated aliases, methods and properties may be removed in future releases.

#### Public and Internal APIs
All API elements (classes, interfaces, functions etc) have been labelled as either `public` or `internal`.  Applications should only use `public` API elements.  Internal API elements are subject to change and no consideration will be given to backwards compatibility when these are changed.

The library distribution includes 2 TypeScript declaration (typing) files:
1. `index.d.ts` which contains only public API elements.  Applications should use this declaration file to access the library.
1. `golden-layout-untrimmed.d.ts` which contains all (public and internal) API elements.  Use this declaration file if you wish to access any API element in the library however please take the above warning into account.

Note that the allocation of API elements to either public or internal has not been finalised.  However any element used in either the api-test application or the example Angular application will remain labelled as public.

### Events propagation
Mouse and touch events are now propagated so that they can also be handled globally.

### Popout and docking
Work is still underway in debugging Popout and docking. Do not migrate your application if it uses this feature.
