import { ComponentBase } from 'component-base';
import {
    ComponentContainer,
    ComponentItemConfig,
    ContentItem,
    DragSource,
    EventEmitter,
    GoldenLayout,
    JsonValue,
    LayoutConfig,
    LogicalZIndex,
    ResolvedComponentItemConfig,
    ResolvedLayoutConfig,
    Stack
} from "..";
import { BooleanComponent } from './boolean-component';
import { ColorComponent } from './color-component';
import { EventComponent } from './event-component';
import { prefinedLayouts } from './predefined-layouts';
import { TextComponent } from './text-component';

export class App {
    private readonly _layoutElement: HTMLElement;
    private readonly _controlsElement: HTMLElement;
    private readonly _goldenLayout: GoldenLayout;
    private readonly _registerComponentTypesButton;
    private readonly _registerComponentTypesButtonClickListener = () => this.registerComponentTypes();
    private readonly _registerAllRadio;
    private readonly _registerColorEventRadio;
    private readonly _registerComponentTypesAsVirtualButton;
    private readonly _registerComponentTypesAsVirtualButtonClickListener = () => this.registerComponentTypesAsVirtual();
    private readonly _registerAllAsVirtualRadio;
    private readonly _registerTextBooleanAsVirtualRadio;
    private readonly _registeredComponentTypesForAddSelect: HTMLSelectElement;
    private readonly _registeredComponentTypesForAddSelectChangeListener = () => this.handleRegisteredComponentTypesForAddSelectChange();
    private readonly _eventBindingVirtualRadio;
    private readonly _eventBindingVirtualRadioClickListener = () => this.handleEventBindingVirtualRadioClick();
    private readonly _eventBindingEmbeddedRadio;
    private readonly _eventBindingEmbeddedRadioClickListener = () => this.handleEventBindingEmbeddedRadioClick();
    private readonly _clearButton: HTMLButtonElement;
    private readonly _clearButtonClickListener = () => this.handleClearButtonClick();
    private readonly _addComponentButton: HTMLButtonElement;
    private readonly _addComponentButtonClickListener = () => this.handleAddComponentButtonClick();
    private readonly _layoutSelect: HTMLSelectElement;
    private readonly _layoutSelectChangeListener = () => this.handleLayoutSelectChange();
    private readonly _loadLayoutButton: HTMLButtonElement;
    private readonly _loadLayoutButtonClickListener = () => this.handleLoadLayoutButtonClick();
    private readonly _loadComponentAsRootButton: HTMLButtonElement;
    private readonly _loadComponentAsRootClickListener = () => this.handleLoadComponentAsRootButtonClick();
    private readonly _registeredComponentTypesForReplaceSelect: HTMLSelectElement;
    private readonly _registeredComponentTypesForReplaceSelectChangeListener = () => this.handleRegisteredComponentTypesForReplaceSelectChange();
    private readonly _replaceComponentButton: HTMLButtonElement;
    private readonly _replaceComponentButtonClickListener = () => this.handleReplaceComponentButtonClick();
    private readonly _saveLayoutButton: HTMLButtonElement;
    private readonly _saveLayoutButtonClickListener = () => this.handleSaveLayoutButtonClick();
    private readonly _reloadSavedLayoutButton: HTMLButtonElement;
    private readonly _reloadSavedLayoutButtonClickListener = () => this.handleReloadSavedLayoutButtonClick();
    private readonly _lastVirtualRectingCountSpan: HTMLSpanElement;
    private readonly _bubbleClickCountSpan: HTMLSpanElement;
    private readonly _captureClickCountSpan: HTMLSpanElement;
    private readonly _stackHeaderClickedDiv: HTMLDivElement;
    private readonly _stackHeaderClickedItemCountSpan: HTMLSpanElement;

    private readonly _boundComponentMap = new Map<ComponentContainer, ComponentBase>();

    private _bubbleClickCount = 0;
    private _captureClickCount = 0;
    private _lastVirtualRectingCount = 0;

    private _allComponentsRegistered = false;
    private _savedLayout: ResolvedLayoutConfig | undefined;
    private _useVirtualEventBinding = true;

    private _goldenLayoutBoundingClientRect: DOMRect = new DOMRect();

    private readonly _windowResizeListener = () => this.handleWindowResizeEvent();
    private readonly _globalBubbleClickListener = () => this.handleGlobalBubbleClickEvent();
    private readonly _globalCaptureClickListener = () => this.handleGlobalCaptureClickEvent();
    private readonly _bindComponentEventListener =
        (container: ComponentContainer, itemConfig: ResolvedComponentItemConfig) => this.handleBindComponentEvent(container, itemConfig);
    private readonly _unbindComponentEventListener = (container: ComponentContainer) => this.handleUnbindComponentEvent(container);

    constructor() {
        const controlsElement = document.querySelector('#controls') as HTMLElement;
        if (controlsElement === null) {
            throw new Error('controlsElement not found');
        }
        this._controlsElement = controlsElement;

        const layoutElement = document.querySelector('#layoutContainer') as HTMLElement;
        if (layoutElement === null) {
            throw new Error('layoutContainerElement not found');
        }
        this._layoutElement = layoutElement;
        this._goldenLayout = new GoldenLayout(this._layoutElement, this._bindComponentEventListener, this._unbindComponentEventListener);

        this._goldenLayout.beforeVirtualRectingEvent = (count) => this.handleBeforeVirtualRectingEvent(count);
        this._goldenLayout.addEventListener('stackHeaderClick', (event) => this.handleStackHeaderClick(event));

        const registerNotVirtualComponentTypesButton = document.querySelector('#registerNotVirtualButton') as HTMLButtonElement;
        if (registerNotVirtualComponentTypesButton === null) {
            throw new Error('Could not find RegisterNotVirtualButton');
        }
        this._registerComponentTypesButton = registerNotVirtualComponentTypesButton;
        this._registerComponentTypesButton.addEventListener('click', this._registerComponentTypesButtonClickListener,
            { passive: true }
        );

        const registerNotVirtualAllRadio = document.querySelector('#registerNotVirtualAllRadio') as HTMLInputElement;
        if (registerNotVirtualAllRadio === null) {
            throw new Error('Could not find RegisterNotVirtualAllRadio');
        }
        this._registerAllRadio = registerNotVirtualAllRadio;

        const registerNotVirtualColorEventRadio = document.querySelector('#registerNotVirtualColorEventRadio') as HTMLInputElement;
        if (registerNotVirtualColorEventRadio === null) {
            throw new Error('Could not find RegisterNotVirtualColorEventRadio');
        }
        this._registerColorEventRadio = registerNotVirtualColorEventRadio;

        const registerVirtualComponentTypesButton = document.querySelector('#registerVirtualButton') as HTMLButtonElement;
        if (registerVirtualComponentTypesButton === null) {
            throw new Error('Could not find RegisterVirtualButton');
        }
        this._registerComponentTypesAsVirtualButton = registerVirtualComponentTypesButton;
        this._registerComponentTypesAsVirtualButton.addEventListener('click', this._registerComponentTypesAsVirtualButtonClickListener,
            { passive: true }
        );

        const registerVirtualAllRadio = document.querySelector('#registerVirtualAllRadio') as HTMLInputElement;
        if (registerVirtualAllRadio === null) {
            throw new Error('Could not find RegisterVirtualAllRadio');
        }
        this._registerAllAsVirtualRadio = registerVirtualAllRadio;

        const registerVirtualTextBooleanRadio = document.querySelector('#registerVirtualTextBooleanRadio') as HTMLInputElement;
        if (registerVirtualTextBooleanRadio === null) {
            throw new Error('Could not find RegisterVirtualTextBooleanRadio');
        }
        this._registerTextBooleanAsVirtualRadio = registerVirtualTextBooleanRadio;

        const eventBindingVirtualRadio = document.querySelector('#eventBindingVirtualRadio') as HTMLInputElement;
        if (eventBindingVirtualRadio === null) {
            throw new Error('Could not find EventBindingVirtualRadio');
        }
        this._eventBindingVirtualRadio = eventBindingVirtualRadio;
        this._eventBindingVirtualRadio.addEventListener('click', this._eventBindingVirtualRadioClickListener, { passive: true });

        const eventBindingEmbeddedRadio = document.querySelector('#eventBindingEmbeddedRadio') as HTMLInputElement;
        if (eventBindingEmbeddedRadio === null) {
            throw new Error('Could not find EventBindingEmbeddedRadio');
        }
        this._eventBindingEmbeddedRadio = eventBindingEmbeddedRadio;
        this._eventBindingEmbeddedRadio.addEventListener('click', this._eventBindingEmbeddedRadioClickListener, { passive: true });

        this._eventBindingVirtualRadio.checked = this._useVirtualEventBinding;

        const clearButton = document.querySelector('#clearButton') as HTMLButtonElement;
        if (clearButton === null) {
            throw new Error('Could not find ClearButton');
        }
        this._clearButton = clearButton;
        this._clearButton.addEventListener('click', this._clearButtonClickListener, { passive: true });

        const registeredComponentTypesForAddSelect = document.querySelector('#registeredComponentTypesForAddSelect') as HTMLSelectElement;
        if (registeredComponentTypesForAddSelect === null) {
            throw new Error()
        }
        this._registeredComponentTypesForAddSelect = registeredComponentTypesForAddSelect;
        this._registeredComponentTypesForAddSelect.addEventListener('change', this._registeredComponentTypesForAddSelectChangeListener,
            { passive: true }
        );

        const addComponentButton = document.querySelector('#addComponentButton') as HTMLButtonElement;
        if (addComponentButton === null) {
            throw new Error('Could not find addComponentButton');
        }
        this._addComponentButton = addComponentButton;
        this._addComponentButton.addEventListener('click', this._addComponentButtonClickListener, { passive: true });

        const addComponentByDragButton = document.querySelector('#addComponentByDragButton') as HTMLButtonElement;
        if (addComponentByDragButton === null) {
            throw new Error('Could not find addComponentByDragButton');
        }
        const addComponentDragSource = this._goldenLayout.newDragSource(addComponentByDragButton, () => this.getDragComponentTypeAndState());
        if (addComponentDragSource === undefined) {
            throw new Error('addComponentDragSource undefined');
        }

        const layoutSelect = document.querySelector('#layoutSelect') as HTMLSelectElement;
        if (layoutSelect === null) {
            throw new Error()
        }
        this._layoutSelect = layoutSelect;
        this._layoutSelect.addEventListener('change', this._layoutSelectChangeListener, { passive: true });

        const loadLayoutButton = document.querySelector('#loadLayoutButton') as HTMLButtonElement;
        if (loadLayoutButton === null) {
            throw new Error('Could not find loadLayoutButton');
        }
        this._loadLayoutButton = loadLayoutButton;
        this._loadLayoutButton.addEventListener('click', this._loadLayoutButtonClickListener, { passive: true });

        const loadComponentAsRootButton = document.querySelector('#loadComponentAsRootButton') as HTMLButtonElement;
        if (loadComponentAsRootButton === null) {
            throw new Error('Could not find loadComponentAsRootButton');
        }
        this._loadComponentAsRootButton = loadComponentAsRootButton;
        this._loadComponentAsRootButton.addEventListener('click', this._loadComponentAsRootClickListener, { passive: true });

        const registeredComponentTypesForReplaceSelect = document.querySelector('#registeredComponentTypesForReplaceSelect') as HTMLSelectElement;
        if (registeredComponentTypesForReplaceSelect === null) {
            throw new Error()
        }
        this._registeredComponentTypesForReplaceSelect = registeredComponentTypesForReplaceSelect;
        this._registeredComponentTypesForReplaceSelect.addEventListener('change', this._registeredComponentTypesForReplaceSelectChangeListener, { passive: true });

        const replaceComponentButton = document.querySelector('#replaceComponentButton') as HTMLButtonElement;
        if (replaceComponentButton === null) {
            throw new Error('Could not find replaceComponentButton');
        }
        this._replaceComponentButton = replaceComponentButton;
        this._replaceComponentButton.addEventListener('click', this._replaceComponentButtonClickListener, { passive: true });

        const saveLayoutButton = document.querySelector('#saveLayoutButton') as HTMLButtonElement;
        if (saveLayoutButton === null) {
            throw new Error('Could not find saveLayoutButton');
        }
        this._saveLayoutButton = saveLayoutButton;
        this._saveLayoutButton.addEventListener('click', this._saveLayoutButtonClickListener, { passive: true });

        const reloadSavedLayoutButton = document.querySelector('#reloadSavedLayoutButton') as HTMLButtonElement;
        if (reloadSavedLayoutButton === null) {
            throw new Error('Could not find reloadSavedLayoutButton');
        }
        this._reloadSavedLayoutButton = reloadSavedLayoutButton;
        this._reloadSavedLayoutButton.disabled = true;
        this._reloadSavedLayoutButton.addEventListener('click', this._reloadSavedLayoutButtonClickListener, { passive: true });

        const lastVirtualRectingCountSpan = document.querySelector('#lastVirtualRectingCountSpan') as HTMLSpanElement;
        if (lastVirtualRectingCountSpan === null) {
            throw new Error('Could not find LastVirtualRectingCountSpan');
        }
        this._lastVirtualRectingCountSpan = lastVirtualRectingCountSpan;
        this._lastVirtualRectingCountSpan.innerText = this._lastVirtualRectingCount.toString();

        const bubbleClickCountSpan = document.querySelector('#bubbleClickCountSpan') as HTMLSpanElement;
        if (bubbleClickCountSpan === null) {
            throw new Error('Could not find bubbleClickCountSpan');
        }
        this._bubbleClickCountSpan = bubbleClickCountSpan;
        this._bubbleClickCountSpan.innerText = this._bubbleClickCount.toString();
        const captureClickCountSpan = document.querySelector('#captureClickCountSpan') as HTMLSpanElement;
        if (captureClickCountSpan === null) {
            throw new Error('Could not find captureClickCountSpan');
        }
        this._captureClickCountSpan = captureClickCountSpan;
        this._captureClickCountSpan.innerText = this._captureClickCount.toString();

        const stackHeaderClickedDiv = document.querySelector('#stackHeaderClickedDiv') as HTMLDivElement;
        if (stackHeaderClickedDiv === null) {
            throw new Error('Could not find stackHeaderClickedDiv');
        }
        this._stackHeaderClickedDiv = stackHeaderClickedDiv;
        this._stackHeaderClickedDiv.style.display = 'none';
        const stackHeaderClickedItemCountSpan = document.querySelector('#stackHeaderClickedItemCountSpan') as HTMLSpanElement;
        if (stackHeaderClickedItemCountSpan === null) {
            throw new Error('Could not find stackHeaderClickedItemCountSpan');
        }
        this._stackHeaderClickedItemCountSpan = stackHeaderClickedItemCountSpan;

        if (this._goldenLayout.isSubWindow) {
            this._controlsElement.style.display = 'none';
            this._goldenLayout.checkAddDefaultPopinButton();

            const subWindowUsesRegistrationBindings = false; // change to true if you want to test sub windows with registration bindings
            if (subWindowUsesRegistrationBindings) {
                this.registerComponentTypes();
            }
        }

        globalThis.addEventListener('click', this._globalBubbleClickListener, { passive: true });
        globalThis.addEventListener('click', this._globalCaptureClickListener, { capture: true, passive: true });
        globalThis.addEventListener('resize', this._windowResizeListener, { passive: true });
    }

    start(): void {
        this.loadComponentTypesForAddSelect();
        this.loadComponentTypesForReplaceSelect();
        this.loadLayoutSelect();
    }

    private createComponent(container: ComponentContainer, componentTypeName: string, state: JsonValue | undefined, virtual: boolean) {
        switch (componentTypeName) {
            case ColorComponent.typeName: return new ColorComponent(container, state, virtual);
            case TextComponent.typeName: return new TextComponent(container, state, virtual);
            case BooleanComponent.typeName: return new BooleanComponent(container, state, virtual);
            case EventComponent.typeName: return new EventComponent(container, state, virtual);
            default:
                throw new Error('createComponent: Unexpected componentTypeName: ' + componentTypeName);
        }
    }

    private handleBindComponentEvent(container: ComponentContainer, itemConfig: ResolvedComponentItemConfig): ComponentContainer.BindableComponent {
        const componentTypeName = ResolvedComponentItemConfig.resolveComponentTypeName(itemConfig);
        if (componentTypeName === undefined) {
            throw new Error('handleBindComponentEvent: Undefined componentTypeName');
        }
        const component = this.createComponent(container, componentTypeName, itemConfig.componentState, this._useVirtualEventBinding);
        this._boundComponentMap.set(container, component);

        if (this._useVirtualEventBinding) {
            const componentRootElement = component.rootHtmlElement;
            this._layoutElement.appendChild(componentRootElement);
            container.virtualRectingRequiredEvent =
                (container, width, height) => this.handleContainerVirtualRectingRequiredEvent(container, width, height);
            container.virtualVisibilityChangeRequiredEvent =
                (container, visible) => this.handleContainerVirtualVisibilityChangeRequiredEvent(container, visible);
            container.virtualZIndexChangeRequiredEvent =
                (container, logicalZIndex, defaultZIndex) =>
                    this.handleContainerVirtualZIndexChangeRequiredEvent(container, logicalZIndex, defaultZIndex);
            return {
                component,
                virtual: true,
            }
        } else {
            // Note that container.element is used as the root element in the component. This is set up in the component constructor
            return {
                component,
                virtual: false,
            }
        }
    }

    private handleUnbindComponentEvent(container: ComponentContainer) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleUnbindComponentEvent: Component not found');
        }

        const componentRootElement = component.rootHtmlElement;
        if (componentRootElement === undefined) {
            throw new Error('handleUnbindComponentEvent: Component does not have a root HTML element');
        }

        if (container.virtual) {
            this._layoutElement.removeChild(componentRootElement);
        } else {
            // If embedded, then component handles unbinding of component elements from content.element
        }
        this._boundComponentMap.delete(container);
    }

    private handleBeforeVirtualRectingEvent(count: number) {
        this._goldenLayoutBoundingClientRect = this._layoutElement.getBoundingClientRect();
        this._lastVirtualRectingCount = count;
        this._lastVirtualRectingCountSpan.innerText = this._lastVirtualRectingCount.toString();
    }

    private handleContainerVirtualRectingRequiredEvent(container: ComponentContainer, width: number, height: number) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleContainerVirtualRectingRequiredEvent: Component not found');
        }

        const rootElement = component.rootHtmlElement;
        if (rootElement === undefined) {
            throw new Error('handleContainerVirtualRectingRequiredEvent: Component does not have a root HTML element');
        }

        const containerBoundingClientRect = container.element.getBoundingClientRect();
        const left = containerBoundingClientRect.left - this._goldenLayoutBoundingClientRect.left;
        rootElement.style.left = this.numberToPixels(left);
        const top = containerBoundingClientRect.top - this._goldenLayoutBoundingClientRect.top;
        rootElement.style.top = this.numberToPixels(top);
        rootElement.style.width = this.numberToPixels(width);
        rootElement.style.height = this.numberToPixels(height);
    }

    private handleContainerVirtualVisibilityChangeRequiredEvent(container: ComponentContainer, visible: boolean) {
        const component = this._boundComponentMap.get(container);
        if (component === undefined) {
            throw new Error('handleContainerVisibilityChangeRequiredEvent: Component not found');
        }

        const componentRootElement = component.rootHtmlElement;
        if (componentRootElement === undefined) {
            throw new Error('handleContainerVisibilityChangeRequiredEvent: Component does not have a root HTML element');
        }

        if (visible) {
            componentRootElement.style.display = '';
        } else {
            componentRootElement.style.display = 'none';
        }
    }

    /** @internal */
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

    private handleWindowResizeEvent() {
        // handling of resize event is required if GoldenLayout does not use body element
        const bodyWidth = document.body.offsetWidth;
        const controlsWidth = this._controlsElement.offsetWidth;
        const height = document.body.offsetHeight;
        this._goldenLayout.setSize(bodyWidth - controlsWidth, height)
    }

    private handleGlobalBubbleClickEvent() {
        this._bubbleClickCount++;
        this._bubbleClickCountSpan.innerText = this._bubbleClickCount.toString();
    }

    private handleGlobalCaptureClickEvent() {
        this._captureClickCount++;
        this._captureClickCountSpan.innerText = this._captureClickCount.toString();
    }

    private registerComponentTypes() {
        if (this._allComponentsRegistered) {
            return;
        }

        this._goldenLayout.registerComponentConstructor(ColorComponent.typeName, ColorComponent);
        this._goldenLayout.registerComponentConstructor(EventComponent.typeName, EventComponent);
        this._registerComponentTypesButton.disabled = true;
        this._registerAllRadio.disabled = true;
        this._registerColorEventRadio.disabled = true;
        if (this._registerAllRadio.checked) {
            this._goldenLayout.registerComponentConstructor(TextComponent.typeName, TextComponent);
            this._goldenLayout.registerComponentConstructor(BooleanComponent.typeName, BooleanComponent);
            this._allComponentsRegistered = true;
            this._registerComponentTypesAsVirtualButton.disabled = true;
            this._registerTextBooleanAsVirtualRadio.disabled = true;
        } else {
            this._registerTextBooleanAsVirtualRadio.checked = true;
        }
        this._registerAllAsVirtualRadio.disabled = true;
    }

    private registerComponentTypesAsVirtual() {
        if (this._allComponentsRegistered) {
            return;
        }

        this._goldenLayout.registerComponentConstructor(TextComponent.typeName, TextComponent, true);
        this._goldenLayout.registerComponentConstructor(BooleanComponent.typeName, BooleanComponent, true);
        this._registerComponentTypesAsVirtualButton.disabled = true;
        this._registerAllAsVirtualRadio.disabled = true;
        this._registerTextBooleanAsVirtualRadio.disabled = true;
        if (this._registerAllAsVirtualRadio.checked) {
            this._goldenLayout.registerComponentConstructor(ColorComponent.typeName, ColorComponent, true);
            this._goldenLayout.registerComponentConstructor(EventComponent.typeName, EventComponent, true);
            this._allComponentsRegistered = true;
            this._registerComponentTypesButton.disabled = true;
            this._registerColorEventRadio.disabled = true;
        } else {
            this._registerColorEventRadio.checked = true;
        }
        this._registerAllRadio.disabled = true;
    }

    private handleEventBindingVirtualRadioClick() {
        this._goldenLayout.clear();
        this._useVirtualEventBinding = true;
    }

    private handleEventBindingEmbeddedRadioClick() {
        this._goldenLayout.clear();
        this._useVirtualEventBinding = false;
    }

    private handleRegisteredComponentTypesForAddSelectChange() {
        // nothing to do here
    }

    private handleLayoutSelectChange() {
        // nothing to do here
    }

    private handleClearButtonClick() {
        this._goldenLayout.clear();
    }

    private handleStackHeaderClick(event: EventEmitter.ClickBubblingEvent) {
        const stack = event.target as Stack;
        const itemCount = stack.contentItems.length;
        this._stackHeaderClickedItemCountSpan.innerText = itemCount.toString();
        this._stackHeaderClickedDiv.style.display = '';
        setTimeout(() => { this._stackHeaderClickedDiv.style.display = 'none'; }, 1000);
    }

    private handleAddComponentButtonClick() {
        const componentType = this._registeredComponentTypesForAddSelect.value;
        this._goldenLayout.addComponent(componentType);
    }

    private getDragComponentTypeAndState(): DragSource.ComponentItemConfig {
        const componentType = this._registeredComponentTypesForAddSelect.value;
        return { type: componentType };
    }

    private handleLoadLayoutButtonClick() {
        const layoutName = this._layoutSelect.value;
        const layouts = prefinedLayouts.allComponents;
        const selectedLayout = layouts.find((layout) => layout.name === layoutName);
        if (selectedLayout === undefined) {
            throw new Error('handleLayoutSelectChange');
        } else {
            this._goldenLayout.loadLayout(selectedLayout.config);
        }
    }

    private handleLoadComponentAsRootButtonClick() {
        const itemConfig: ComponentItemConfig = {
            type: 'component',
            componentType: ColorComponent.typeName,
            componentState: 'yellow',
        };
        this._goldenLayout.loadComponentAsRoot(itemConfig);
    }

    private handleRegisteredComponentTypesForReplaceSelectChange() {
        // nothing to do here
    }

    private handleReplaceComponentButtonClick() {
        const componentType = this._registeredComponentTypesForReplaceSelect.value;
        const itemConfig: ComponentItemConfig = {
            componentType,
            type: 'component',
        }
        const rootItem = this._goldenLayout.rootItem;
        if (rootItem !== undefined) {
            const content = [rootItem];
            this.replaceComponentRecursively(content, itemConfig);
        }

    }

    private handleSaveLayoutButtonClick() {
        this._savedLayout = this._goldenLayout.saveLayout();
        this._reloadSavedLayoutButton.disabled = false;
    }

    private handleReloadSavedLayoutButtonClick() {
        if (this._savedLayout === undefined) {
            throw new Error('No saved layout');
        } else {
            const layoutConfig = LayoutConfig.fromResolved(this._savedLayout);
            this._goldenLayout.loadLayout(layoutConfig);
        }
    }

    private getAllComponentTypeNames() {
        const result: string[] = [];
        result.push(ColorComponent.typeName);
        result.push(TextComponent.typeName);
        result.push(BooleanComponent.typeName);
        result.push(EventComponent.typeName);
        return result;
    }

    private loadComponentTypesForAddSelect() {
        this._registeredComponentTypesForAddSelect.options.length = 0;
        const names = this.getAllComponentTypeNames();
        for (const name of names) {
            const option = new Option(name);
            this._registeredComponentTypesForAddSelect.options.add(option);
        }
    }

    private loadComponentTypesForReplaceSelect() {
        this._registeredComponentTypesForReplaceSelect.options.length = 0;
        const names = this.getAllComponentTypeNames();
        for (const name of names) {
            const option = new Option(name);
            this._registeredComponentTypesForReplaceSelect.options.add(option);
        }
    }

    private loadLayoutSelect() {
        this._layoutSelect.options.length = 0;
        const layouts = prefinedLayouts.allComponents;
        for (const layout of layouts) {
            const option = new Option(layout.name);
            this._layoutSelect.options.add(option);
        }
    }

    private replaceComponentRecursively(content: ContentItem[], itemConfig: ComponentItemConfig) {
        for (const item of content) {
            if (ContentItem.isComponentItem(item)) {
                const container = item.container;
                if (container.componentType === ColorComponent.typeName) {
                    container.replaceComponent(itemConfig);
                }
            } else {
                this.replaceComponentRecursively(item.contentItems, itemConfig);
            }
        }
    }

    private numberToPixels(value: number): string {
        return value.toString(10) + 'px';
    }
}
