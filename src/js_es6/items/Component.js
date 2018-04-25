import AbstractContentItem from '../items/AbstractContentItem'
import ItemContainer from '../container/ItemContainer'


/**
 * @param {[type]} layoutManager [description]
 * @param {[type]} config      [description]
 * @param {[type]} parent        [description]
 */


export default class Component extends AbstractContentItem {
    constructor(layoutManager, config, parent) {

        super(layoutManager, config, parent);

        var ComponentConstructor = layoutManager.getComponent(this.config.componentName),
            componentConfig = $.extend(true, {}, this.config.componentState || {});

        componentConfig.componentName = this.config.componentName;
        this.componentName = this.config.componentName;

        if (this.config.title === '') {
            this.config.title = this.config.componentName;
        }

        this.isComponent = true;
        this.container = new ItemContainer(this.config, this, layoutManager);
        this.instance = new ComponentConstructor(this.container, componentConfig);
        this.element = this.container._element;
    }

    close() {
        this.parent.removeChild(this);
    }

    setSize() {
        if (this.element.css('display') !== 'none') {
            // Do not update size of hidden components to prevent unwanted reflows
            this.container._$setSize(this.element.width(), this.element.height());
        }
    }

    _$init() {
        AbstractContentItem.prototype._$init.call(this);
        this.container.emit('open');
    }

    _$hide() {
        this.container.hide();
        AbstractContentItem.prototype._$hide.call(this);
    }

    _$show() {
        this.container.show();
        AbstractContentItem.prototype._$show.call(this);
    }

    _$shown() {
        this.container.shown();
        AbstractContentItem.prototype._$shown.call(this);
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
