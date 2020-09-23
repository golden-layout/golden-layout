import { Config } from '../config/config';
import { ItemContainer } from '../container/ItemContainer';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { ReactComponentHandler } from '../utils/ReactComponentHandler';
/**
 * @param {[type]} layoutManager [description]
 * @param {[type]} config      [description]
 * @param {[type]} parent        [description]
 */

export class Component extends AbstractContentItem {
    container: ItemContainer;
    instance: Component;
    constructor(layoutManager: LayoutManager, config: Config, public parent: AbstractContentItem) {

        super(layoutManager, config, parent);

        const componentConstructor: Component.Constructor = layoutManager.isReactConfig(config) ? ReactComponentHandler : layoutManager.getComponent(config);
        const componentConfig = $.extend(true, {}, this.config.componentState ?? {});

        componentConfig.componentName = this.config.componentName;
        this.componentName = this.config.componentName;

        if (this.config.title === '') {
            this.config.title = this.config.componentName;
        }

        this.isComponent = true;
        this.container = new ItemContainer(this.config, this, layoutManager);
        this.instance = new componentConstructor(this.container, componentConfig);
        this.element = this.container._element;
    }

    close(): void {
        this.parent.removeChild(this);
    }

    setSize() {
        if (this.element.css('display') !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            this.container._$setSize(this.element.width(), this.element.height());
        }
    }

    _$init(): void {
        super._$init();
        this.container.emit('open');
        this.initContentItems();
    }

    _$hide(): void {
        this.container.hide();
        super._$hide();
    }

    _$show() {
        this.container.show();
        super._$show();
    }

    _$shown() {
        this.container.shown();
        // AbstractContentItem.prototype._$shown.call(this);
    }

    _$destroy() {
        this.container.emit('destroy', this);
        AbstractContentItem.prototype._$destroy.call(this);
    }

    /**
     * Dragging onto a component directly is not an option
     *
     * @returns null
     */
    _$getArea() {
        return null;
    }
}

export namespace Component {
    export type Constructor = new() => Component;
}
