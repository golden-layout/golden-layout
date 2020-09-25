import { ComponentConfig } from '../config/config';
import { ItemContainer } from '../container/ItemContainer';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { ReactComponentHandler } from '../utils/ReactComponentHandler';
import { deepExtend } from '../utils/utils';

export class Component extends AbstractContentItem {
    private _container: ItemContainer;
    private _instance: unknown;

    readonly componentName: string;

    constructor(layoutManager: LayoutManager, config: ComponentConfig, public parent: AbstractContentItem) {
        super(layoutManager, config, parent);

        let instanceConstructor: Component.InstanceConstructor;
        let instanceState: unknown;
        if (ComponentConfig.isJson(config)) {
            instanceConstructor = layoutManager.getComponentConstructor(config);
            if (config.componentState === undefined) {
                instanceState = {};
            } else {
                instanceState = deepExtend({}, config.componentState as Record<string, unknown>); // make copy
            }
        } else {
            if (ComponentConfig.isReact(config)) {
                instanceConstructor = ReactComponentHandler;
                instanceState = config.props;
            } else {
                throw new Error(`Component.constructor: unsupported Config type: ${config.type}`);
            }
        }

        if (typeof instanceState === 'object' && instanceState !== null) {
            (instanceState as Record<string, unknown>).componentName = config.componentName;
        }

        this.componentName = config.componentName;

        if (this.config.title === '') {
            this.config.title = config.componentName;
        }

        this.isComponent = true;
        this._container = new ItemContainer(config, this, layoutManager);
        this._instance = new instanceConstructor(this._container, instanceState);
        this.element = this._container.element;
    }

    close(): void {
        this.parent.removeChild(this);
    }

    setSize() {
        if (this.element.css('display') !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            this._container._$setSize(this.element.width(), this.element.height());
        }
    }

    _$init(): void {
        super._$init();
        this._container.emit('open');
        this.initContentItems();
    }

    _$hide(): void {
        this._container.hide();
        super._$hide();
    }

    _$show(): void {
        this._container.show();
        super._$show();
    }

    _$shown(): void {
        this._container.shown();
        // AbstractContentItem.prototype._$shown.call(this);
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
    _$getArea(): AbstractContentItem.Area | null {
        return null;
    }
}

export namespace Component {
    export type InstanceConstructor = new(container: ItemContainer, state: unknown) => unknown;
}
