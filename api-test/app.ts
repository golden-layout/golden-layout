import { ComponentItemConfig, ContentItem, GoldenLayout, LayoutConfig, ResolvedLayoutConfig, SerialisableComponentConfig } from "../dist/golden-layout";
import { BooleanComponent } from './boolean-component';
import { ColorComponent } from './color-component';
import { Layout, prefinedLayouts } from './predefined-layouts';
import { TextComponent } from './text-component';

export class App {
    private _layoutElement: HTMLElement;
    private _controlsElement: HTMLElement;
    private _goldenLayout: GoldenLayout;
    private _registerExtraComponentTypesButton;
    private _registerExtraComponentTypesButtonClickListener = () => this.handleRegisterExtraComponentTypesButtonClick();
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
    private _clickCount = 0;
    private _clickCountSpan: HTMLSpanElement;
 
    private _allComponentsRegistered = false;
    private _savedLayout: ResolvedLayoutConfig | undefined;

    private _windowResizeListener = () => this.handleWindowResizeEvent();
    private _globalClickListener = () => this.handleGlobalClickEvent();

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

        const registerExtraComponentTypesButton = document.querySelector('#registerExtraComponentTypesButton') as HTMLButtonElement;
        if (registerExtraComponentTypesButton === null) {
            throw Error('Could not find RegisterExtraComponentTypesButton');
        }
        this._registerExtraComponentTypesButton = registerExtraComponentTypesButton;
        this._registerExtraComponentTypesButton.addEventListener('click', this._registerExtraComponentTypesButtonClickListener);

        const registeredComponentTypesForAddSelect = document.querySelector('#registeredComponentTypesForAddSelect') as HTMLSelectElement;
        if (registeredComponentTypesForAddSelect === null) {
            throw new Error()
        }
        this._registeredComponentTypesForAddSelect = registeredComponentTypesForAddSelect;
        this._registeredComponentTypesForAddSelect.addEventListener('change', this._registeredComponentTypesForAddSelectChangeListener);

        const addComponentButton = document.querySelector('#addComponentButton') as HTMLButtonElement;
        if (addComponentButton === null) {
            throw Error('Could not find addComponentButton');
        }
        this._addComponentButton = addComponentButton;
        this._addComponentButton.addEventListener('click', this._addComponentButtonClickListener);

        const layoutSelect = document.querySelector('#layoutSelect') as HTMLSelectElement;
        if (layoutSelect === null) {
            throw new Error()
        }
        this._layoutSelect = layoutSelect;
        this._layoutSelect.addEventListener('change', this._layoutSelectChangeListener);

        const loadLayoutButton = document.querySelector('#loadLayoutButton') as HTMLButtonElement;
        if (loadLayoutButton === null) {
            throw Error('Could not find loadLayoutButton');
        }
        this._loadLayoutButton = loadLayoutButton;
        this._loadLayoutButton.addEventListener('click', this._loadLayoutButtonClickListener);

        const loadComponentAsRootButton = document.querySelector('#loadComponentAsRootButton') as HTMLButtonElement;
        if (loadComponentAsRootButton === null) {
            throw Error('Could not find loadComponentAsRootButton');
        }
        this._loadComponentAsRootButton = loadComponentAsRootButton;
        this._loadComponentAsRootButton.addEventListener('click', this._loadComponentAsRootClickListener);

        const registeredComponentTypesForReplaceSelect = document.querySelector('#registeredComponentTypesForReplaceSelect') as HTMLSelectElement;
        if (registeredComponentTypesForReplaceSelect === null) {
            throw new Error()
        }
        this._registeredComponentTypesForReplaceSelect = registeredComponentTypesForReplaceSelect;
        this._registeredComponentTypesForReplaceSelect.addEventListener('change', this._registeredComponentTypesForReplaceSelectChangeListener);

        const replaceComponentButton = document.querySelector('#replaceComponentButton') as HTMLButtonElement;
        if (replaceComponentButton === null) {
            throw Error('Could not find replaceComponentButton');
        }
        this._replaceComponentButton = replaceComponentButton;
        this._replaceComponentButton.addEventListener('click', this._replaceComponentButtonClickListener);

        const saveLayoutButton = document.querySelector('#saveLayoutButton') as HTMLButtonElement;
        if (saveLayoutButton === null) {
            throw Error('Could not find saveLayoutButton');
        }
        this._saveLayoutButton = saveLayoutButton;
        this._saveLayoutButton.addEventListener('click', this._saveLayoutButtonClickListener);

        const reloadSavedLayoutButton = document.querySelector('#reloadSavedLayoutButton') as HTMLButtonElement;
        if (reloadSavedLayoutButton === null) {
            throw Error('Could not find reloadSavedLayoutButton');
        }
        this._reloadSavedLayoutButton = reloadSavedLayoutButton;
        this._reloadSavedLayoutButton.disabled = true;
        this._reloadSavedLayoutButton.addEventListener('click', this._reloadSavedLayoutButtonClickListener);

        this._clickCountSpan = document.querySelector('#clickCountSpan') as HTMLSpanElement;

        globalThis.addEventListener('resize', this._windowResizeListener);
        globalThis.addEventListener('click', this._globalClickListener);
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

    private handleGlobalClickEvent() {
        this._clickCount++;
        this._clickCountSpan.innerText = this._clickCount.toString();
    }
    
    private handleRegisterExtraComponentTypesButtonClick() {
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

    private handleAddComponentButtonClick() {
        const componentType = this._registeredComponentTypesForAddSelect.value;
        const itemConfig: SerialisableComponentConfig = {
            componentType,
            type: 'component',
        }
        this._goldenLayout.addItem(itemConfig, 0);
    }

    private handleLayoutSelectChange() {
        // nothing to do here
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
        const itemConfig: SerialisableComponentConfig = {
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
        const itemConfig: SerialisableComponentConfig = {
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
