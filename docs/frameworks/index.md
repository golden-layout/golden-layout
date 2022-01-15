# Frameworks

Typically frameworks wrap HTML elements with their own components. Instead of an application being a tree of HTML elements, it is a tree of framework components, each of which wrap an HTML element.

With the traditional [**embedding via events**](../binding-components/index.md#embedding-via-events) component binding, Golden Layout injects itself into this the tree of HTML elements. However with frameworks, this interferes with the tree of components. Advanced framework techniques are required to work around this problem.

[**Virtual via events**](../binding-components/index.md#virtual-via-events) component binding allows Golden Layout to be used within framework applications without interfering with the tree of components. This is the recommended approach to binding components to Golden Layout in framework applications.

## Angular

An example Angular application using Golden Layout is available.  The source can be installed by cloning the repository:\
[https://github.com/golden-layout/golden-layout-ng-app](https://github.com/golden-layout/golden-layout-ng-app)

After installing the source, the app can be built and started with the standard build and start scripts.

This example demonstrates how Golden Layout can be used with Angular using either [**embedding via events**](../binding-components/index.md#embedding-via-events) or [**virtual via events**](../binding-components/index.md#virtual-via-events) component binding.

## Vue

An example Vue application using Golden Layout is available at:\
[vue3-golden-layout-virtualcomponent](https://github.com/chyj4747/vue3-golden-layout-virtualcomponent)

This demo shows the basic usage of Golden Layout's virtual component (virtual via events binding). It also shows:
* add component,
* save layout config,
* load layout config,
* and a little bit more.

Also, golden layout is integrated into vue3 components in this demo, so they can be used in other projects.

### Using Vue with 'embedding via events' component binding

While we recommend using 'virtual via events' component binding when integrating with Vue, some users may wish to use 'embedding via events' binding. Snippets of code demonstrating are available [here](./vue/embedding-via-events.md).


## Other Frameworks

For other frameworks, use [**Virtual via events**](../binding-components/index.md#virtual-via-events) component binding and set up the handlers using the guide in this section. Once this is done, functions that create components can be used.  For example:

* `LayoutManager.loadLayout()`
* `LayoutManager.addComponent()`
