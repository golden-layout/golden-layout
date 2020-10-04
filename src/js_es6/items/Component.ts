import { ComponentConfig, HeaderedItemConfig } from '../config/config';
import { ItemContainer } from '../container/ItemContainer';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { ReactComponentHandler } from '../utils/ReactComponentHandler';
import { deepExtend, getElementHeight, getElementWidth } from '../utils/utils';

export class Component extends AbstractContentItem implements ItemContainer.Parent {
    private _container: ItemContainer;
    private _tab: ItemContainer.Tab;
    private _instance: unknown;

    readonly componentName: string;

    get headerConfig(): HeaderedItemConfig.Header | undefined { return this._componentConfig.header; }
    get tab(): ItemContainer.Tab { return this._tab; }

    constructor(layoutManager: LayoutManager, private readonly _componentConfig: ComponentConfig, private _componentParent: AbstractContentItem) {
        super(layoutManager, _componentConfig, _componentParent);

        let instanceConstructor: Component.InstanceConstructor;
        let instanceState: unknown;
        if (ComponentConfig.isJson(this._componentConfig)) {
            instanceConstructor = layoutManager.getComponentConstructor(this._componentConfig);
            if (this._componentConfig.componentState === undefined) {
                instanceState = {};
            } else {
                instanceState = deepExtend({}, this._componentConfig.componentState as Record<string, unknown>); // make copy
            }
        } else {
            if (ComponentConfig.isReact(this._componentConfig)) {
                instanceConstructor = ReactComponentHandler;
                instanceState = this._componentConfig.props;
            } else {
                throw new Error(`Component.constructor: unsupported Config type: ${this._componentConfig.type}`);
            }
        }

        if (typeof instanceState === 'object' && instanceState !== null) {
            (instanceState as Record<string, unknown>).componentName = this._componentConfig.componentName;
        }

        this.componentName = this._componentConfig.componentName;

        if (this.config.title === '') {
            this.config.title = this._componentConfig.componentName;
        }

        this.isComponent = true;
        this._container = new ItemContainer(this._componentConfig, this, layoutManager);
        this._instance = new instanceConstructor(this._container, instanceState);
        this.element = this._container.element;
    }

    close(): void {
        this._componentParent.removeChild(this);
    }

    setSize(): void {
        if (this.element.style.display !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            this._container._$setSize(getElementWidth(this.element), getElementHeight(this.element));
        }
    }

    _$init(): void {
        this.setSize();

        super._$init();
        this._container.emit('open');
        this.initContentItems();
    }

    setTab(tab: ItemContainer.Tab): void {
        this._tab = tab;
        this.emit('tab', tab)
        this._container.setTab(tab);
    }

    _$hide(): void {
        this._container.hide();
        super._$hide();
    }

    _$show(): void {
        this._container.show();
        super._$show();
    }

    _$destroy(): void {
        this._container.emit('destroy');
        super._$destroy();
    }

    /**
     * Dragging onto a component directly is not an option
     *
     * @returns null
     */
    getArea(): AbstractContentItem.ExtendedArea | null {
        return null;
    }

    setParent(parent: AbstractContentItem): void {
        this._componentParent = parent;
        super.setParent(parent);
    }
}

export namespace Component {
    export type InstanceConstructor = new(container: ItemContainer, state: unknown) => unknown;
}
