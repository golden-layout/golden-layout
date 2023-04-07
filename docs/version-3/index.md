# Version 3

This version is a substantial and incompatible change from the previous (2.6.0) version.

* Removed `registerComponentConstructor`.  Replace `registerComponentConstruction(type, constructor)` by `registerComponent(type, (container,config) => new constructor(container, config)`.

* Removed `registerComponentFactoryFunction`. Just use `registerComponent`.

* Removed `registerComponentFunction`. Use `registerComponentDefault`.
