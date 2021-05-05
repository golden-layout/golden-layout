import { EventComponent } from './event-component';
import { ComponentItemConfig, ContentItem, DragSource, EventEmitter, GoldenLayout, LayoutConfig, ResolvedLayoutConfig, Stack } from '..';
import { BooleanComponent } from './boolean-component';
import { ColorComponent } from './color-component';
import { Layout, prefinedLayouts } from './predefined-layouts';
import { TextComponent } from './text-component';

export class App {
    private _layoutElement: HTMLElement;
    private _controlsElement: HTMLElement;
    private _goldenLayout: GoldenLayout;
    private _registerExtraComponentTypesButton;
    private _registerExtraComponentTypesButtonClickListener = () => this.registerExtraComponentTypes();
    private _registeredComponentTypesForAddSelect: HTMLSelectElement;
    private _registeredComponentTypesForAddSelectChangeListener = () => this.handleRegisteredComponentTypesForAddSelectChange();
    private _addComponentButton: HTMLButtonElement;
    private _addComponentButtonClickListener = () => this.handleAddComponentButtonClick();
    private _layoutSelect: HTMLSelectElement;
    private _layoutSelectChangeListener = () => this.handleLayoutSelectChange();
    private _loadLayoutButton: HTMLButtonElement;
    private _loadLayoutButtonClickListener = () => this.handleLoadLayoutButtonClick();
    private _loadComponentAsRootButton: HTMLButtonElement;
    private _loadComponentAsRootClickListener = () => this.handleLoadComponentAsRootButtonClick();
    private _registeredComponentTypesForReplaceSelect: HTMLSelectElement;
    private _registeredComponentTypesForReplaceSelectChangeListener = () => this.handleRegisteredComponentTypesForReplaceSelectChange();
    private _replaceComponentButton: HTMLButtonElement;
    private _replaceComponentButtonClickListener = () => this.handleReplaceComponentButtonClick();
    private _saveLayoutButton: HTMLButtonElement;
    private _saveLayoutButtonClickListener = () => this.handleSaveLayoutButtonClick();
    private _reloadSavedLayoutButton: HTMLButtonElement;
    private _reloadSavedLayoutButtonClickListener = () => this.handleReloadSavedLayoutButtonClick();
    private _bubbleClickCount = 0;
    private _bubbleClickCountSpan: HTMLSpanElement;
    private _captureClickCount = 0;
    private _captureClickCountSpan: HTMLSpanElement;
    private _stackHeaderClickedDiv: HTMLDivElement;
    private _stackHeaderClickedItemCountSpan: HTMLSpanElement;

    private _allComponentsRegistered = false;
    private _savedLayout: ResolvedLayoutConfig | undefined;

    private _windowResizeListener = () => this.handleWindowResizeEvent();
    private _globalBubbleClickListener = () => this.handleGlobalBubbleClickEvent();
    private _globalCaptureClickListener = () => this.handleGlobalCaptureClickEvent();

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
        this._goldenLayout = new GoldenLayout(this._layoutElement);
        this._goldenLayout.registerComponentConstructor(ColorComponent.typeName, ColorComponent);
        this._goldenLayout.registerComponentConstructor(EventComponent.typeName, EventComponent);
        this._goldenLayout.addEventListener('stackHeaderClick', (event) => this.handleStackHeaderClick(event));

        const registerExtraComponentTypesButton = document.querySelector('#registerExtraComponentTypesButton') as HTMLButtonElement;
        if (registerExtraComponentTypesButton === null) {
            throw Error('Could not find RegisterExtraComponentTypesButton');
        }
        this._registerExtraComponentTypesButton = registerExtraComponentTypesButton;
        this._registerExtraComponentTypesButton.addEventListener('click', this._registerExtraComponentTypesButtonClickListener,
            { passive: true }
        );

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
            throw Error('Could not find addComponentButton');
        }
        this._addComponentButton = addComponentButton;
        this._addComponentButton.addEventListener('click', this._addComponentButtonClickListener, { passive: true });

        const addComponentByDragButton = document.querySelector('#addComponentByDragButton') as HTMLButtonElement;
        if (addComponentByDragButton === null) {
            throw Error('Could not find addComponentByDragButton');
        }
        const addComponentDragSource = this._goldenLayout.newDragSource(addComponentByDragButton, () => this.getDragComponentTypeAndState());
        if (addComponentDragSource === undefined) {
            throw Error('addComponentDragSource undefined');
        }

        const layoutSelect = document.querySelector('#layoutSelect') as HTMLSelectElement;
        if (layoutSelect === null) {
            throw new Error()
        }
        this._layoutSelect = layoutSelect;
        this._layoutSelect.addEventListener('change', this._layoutSelectChangeListener, { passive: true });

        const loadLayoutButton = document.querySelector('#loadLayoutButton') as HTMLButtonElement;
        if (loadLayoutButton === null) {
            throw Error('Could not find loadLayoutButton');
        }
        this._loadLayoutButton = loadLayoutButton;
        this._loadLayoutButton.addEventListener('click', this._loadLayoutButtonClickListener, { passive: true });

        const loadComponentAsRootButton = document.querySelector('#loadComponentAsRootButton') as HTMLButtonElement;
        if (loadComponentAsRootButton === null) {
            throw Error('Could not find loadComponentAsRootButton');
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
            throw Error('Could not find replaceComponentButton');
        }
        this._replaceComponentButton = replaceComponentButton;
        this._replaceComponentButton.addEventListener('click', this._replaceComponentButtonClickListener, { passive: true });

        const saveLayoutButton = document.querySelector('#saveLayoutButton') as HTMLButtonElement;
        if (saveLayoutButton === null) {
            throw Error('Could not find saveLayoutButton');
        }
        this._saveLayoutButton = saveLayoutButton;
        this._saveLayoutButton.addEventListener('click', this._saveLayoutButtonClickListener, { passive: true });

        const reloadSavedLayoutButton = document.querySelector('#reloadSavedLayoutButton') as HTMLButtonElement;
        if (reloadSavedLayoutButton === null) {
            throw Error('Could not find reloadSavedLayoutButton');
        }
        this._reloadSavedLayoutButton = reloadSavedLayoutButton;
        this._reloadSavedLayoutButton.disabled = true;
        this._reloadSavedLayoutButton.addEventListener('click', this._reloadSavedLayoutButtonClickListener, { passive: true });

        const bubbleClickCountSpan = document.querySelector('#bubbleClickCountSpan') as HTMLSpanElement;
        if (bubbleClickCountSpan === null) {
            throw Error('Could not find bubbleClickCountSpan');
        }
        this._bubbleClickCountSpan = bubbleClickCountSpan;
        this._bubbleClickCountSpan.innerText = this._bubbleClickCount.toString();
        const captureClickCountSpan = document.querySelector('#captureClickCountSpan') as HTMLSpanElement;
        if (captureClickCountSpan === null) {
            throw Error('Could not find captureClickCountSpan');
        }
        this._captureClickCountSpan = captureClickCountSpan;
        this._captureClickCountSpan.innerText = this._captureClickCount.toString();

        const stackHeaderClickedDiv = document.querySelector('#stackHeaderClickedDiv') as HTMLDivElement;
        if (stackHeaderClickedDiv === null) {
            throw Error('Could not find stackHeaderClickedDiv');
        }
        this._stackHeaderClickedDiv = stackHeaderClickedDiv;
        this._stackHeaderClickedDiv.style.display = 'none';
        const stackHeaderClickedItemCountSpan = document.querySelector('#stackHeaderClickedItemCountSpan') as HTMLSpanElement;
        if (stackHeaderClickedItemCountSpan === null) {
            throw Error('Could not find stackHeaderClickedItemCountSpan');
        }
        this._stackHeaderClickedItemCountSpan = stackHeaderClickedItemCountSpan;

        globalThis.addEventListener('resize', this._windowResizeListener, { passive: true });
        globalThis.addEventListener('click', this._globalBubbleClickListener, { passive: true });
        globalThis.addEventListener('click', this._globalCaptureClickListener, { capture: true, passive: true });

        // If you are running in a child window, register all known component types!
        // This is required when a popout is created.
        // There are several ways to check whether we're running in a child window, for the sake of simplicity, we check for window.opener.
        if (this._goldenLayout.isSubWindow) {
            this.registerExtraComponentTypes();
        }
    }

    start(): void {
        this.loadRegisteredComponentTypesForAddSelect();
        this.loadRegisteredComponentTypesForReplaceSelect();
        this.loadLayoutSelect();
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

    private registerExtraComponentTypes() {
        if (this._allComponentsRegistered) {
            return;
        }

        this._goldenLayout.registerComponentConstructor(TextComponent.typeName, TextComponent);
        this._goldenLayout.registerComponentConstructor(BooleanComponent.typeName, BooleanComponent);
        this._allComponentsRegistered = true;
        this.loadRegisteredComponentTypesForAddSelect();
        this.loadRegisteredComponentTypesForReplaceSelect();
        this.loadLayoutSelect();
        this._registerExtraComponentTypesButton.disabled = true;
    }

    private handleRegisteredComponentTypesForAddSelectChange() {
        // nothing to do here
    }

    private handleLayoutSelectChange() {
        // nothing to do here
    }

    private handleStackHeaderClick(event: EventEmitter.ClickBubblingEvent) {
        const stack = event.origin as Stack;
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
        const layouts = this.getAvailableLayouts();
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

    private loadRegisteredComponentTypesForAddSelect() {
        this._registeredComponentTypesForAddSelect.options.length = 0;
        const names = this._goldenLayout.getRegisteredComponentTypeNames();
        for (const name of names) {
            const option = new Option(name);
            this._registeredComponentTypesForAddSelect.options.add(option);
        }
    }

    private loadRegisteredComponentTypesForReplaceSelect() {
        this._registeredComponentTypesForReplaceSelect.options.length = 0;
        const names = this._goldenLayout.getRegisteredComponentTypeNames();
        for (const name of names) {
            const option = new Option(name);
            this._registeredComponentTypesForReplaceSelect.options.add(option);
        }
    }

    private getAvailableLayouts(): Layout[] {
        return this._allComponentsRegistered ? prefinedLayouts.allComponents : prefinedLayouts.colorComponentCompatible;
    }

    private loadLayoutSelect() {
        this._layoutSelect.options.length = 0;
        const layouts = this.getAvailableLayouts();
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
}
