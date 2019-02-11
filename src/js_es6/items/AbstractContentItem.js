import EventEmitter from '../utils/EventEmitter'
import { 
  ALL_EVENT
} from '../utils/EventEmitter'

import BubblingEvent from '../utils/BubblingEvent'
import Root from './Root'
import ConfigurationError from '../errors/ConfigurationError'
import itemDefaultConfig from '../config/ItemDefaultConfig'

import {
    fnBind,
    animFrame,
    indexOf
} from '../utils/utils'

/**
 * This is the baseclass that all content items inherit from.
 * Most methods provide a subset of what the sub-classes do.
 *
 * It also provides a number of functions for tree traversal
 *
 * @param {lm.LayoutManager} layoutManager
 * @param {item node configuration} config
 * @param {lm.item} parent
 *
 * @event stateChanged
 * @event beforeItemDestroyed
 * @event itemDestroyed
 * @event itemCreated
 * @event componentCreated
 * @event rowCreated
 * @event columnCreated
 * @event stackCreated
 *
 * @constructor
 */


export default class AbstractContentItem extends EventEmitter {
    constructor(layoutManager, config, parent) {

        super();

        this.config = this._extendItemNode(config);
        this.type = config.type;
        this.contentItems = [];
        this.parent = parent;

        this.isInitialised = false;
        this.isMaximised = false;
        this.isRoot = false;
        this.isRow = false;
        this.isColumn = false;
        this.isStack = false;
        this.isComponent = false;

        this.layoutManager = layoutManager;
        this._pendingEventPropagations = {};
        this._throttledEvents = ['stateChanged'];

        this.on(ALL_EVENT, this._propagateEvent, this);

        if (config.content) {
            this._createContentItems(config);
        }
    }

    /**
     * Set the size of the component and its children, called recursively
     *
     * @abstract
     * @returns void
     */
    setSize() {
        throw new Error('Abstract Method');
    }

    /**
     * Calls a method recursively downwards on the tree
     *
     * @param   {String} functionName      the name of the function to be called
     * @param   {[Array]}functionArguments optional arguments that are passed to every function
     * @param   {[bool]} bottomUp          Call methods from bottom to top, defaults to false
     * @param   {[bool]} skipSelf          Don't invoke the method on the class that calls it, defaults to false
     *
     * @returns {void}
     */
    callDownwards(functionName, functionArguments, bottomUp, skipSelf) {
        var i;

        if (bottomUp !== true && skipSelf !== true) {
            this[functionName].apply(this, functionArguments || []);
        }
        for (i = 0; i < this.contentItems.length; i++) {
            this.contentItems[i].callDownwards(functionName, functionArguments, bottomUp);
        }
        if (bottomUp === true && skipSelf !== true) {
            this[functionName].apply(this, functionArguments || []);
        }
    }

    /**
     * Removes a child node (and its children) from the tree
     *
     * @param   {ContentItem} contentItem
     *
     * @returns {void}
     */
    removeChild(contentItem, keepChild) {
        /*
         * Get the position of the item that's to be removed within all content items this node contains
         */
        var index = indexOf(contentItem, this.contentItems);

        /*
         * Make sure the content item to be removed is actually a child of this item
         */
        if (index === -1) {
            throw new Error('Can\'t remove child item. Unknown content item');
        }

        /**
		 * Call ._$destroy on the content item. 
		 * Then use 'callDownwards' to destroy any children
		 */
        if (keepChild !== true) {
			this.contentItems[index]._$destroy();
			this.contentItems[index].callDownwards('_$destroy', [], true, true);
        }

        /**
         * Remove the content item from this nodes array of children
         */
        this.contentItems.splice(index, 1);

        /**
         * Remove the item from the configuration
         */
        this.config.content.splice(index, 1);

        /**
         * If this node still contains other content items, adjust their size
         */
        if (this.contentItems.length > 0) {
            this.callDownwards('setSize');

            /**
             * If this was the last content item, remove this node as well
             */
        } else if (!(this instanceof Root) && this.config.isClosable === true) {
            this.parent.removeChild(this);
        }
    }

    /**
     * Hides a child node (and its children) from the tree reclaiming its space in the layout
     *
     * @param   {ContentItem} contentItem
     *
     * @returns {void}
     */
    undisplayChild(contentItem) {
        /*
         * Get the position of the item that's to be removed within all content items this node contains
         */
        var index = indexOf(contentItem, this.contentItems);

        /*
         * Make sure the content item to be removed is actually a child of this item
         */
        if (index === -1) {
            throw new Error('Can\'t remove child item. Unknown content item');
        }

        if (!(this instanceof Root) && this.config.isClosable === true) {
            this.parent.undisplayChild(this);
        }
    }

    /**
     * Sets up the tree structure for the newly added child
     * The responsibility for the actual DOM manipulations lies
     * with the concrete item
     *
     * @param {AbstractContentItem} contentItem
     * @param {[Int]} index If omitted item will be appended
     */
    addChild(contentItem, index) {
        if (index === undefined) {
            index = this.contentItems.length;
        }

        this.contentItems.splice(index, 0, contentItem);

        if (this.config.content === undefined) {
            this.config.content = [];
        }

        this.config.content.splice(index, 0, contentItem.config);
        contentItem.parent = this;

        if (contentItem.parent.isInitialised === true && contentItem.isInitialised === false) {
            contentItem._$init();
        }
    }

    /**
     * Replaces oldChild with newChild. This used to use jQuery.replaceWith... which for
     * some reason removes all event listeners, so isn't really an option.
     *
     * @param   {AbstractContentItem} oldChild
     * @param   {AbstractContentItem} newChild
     *
     * @returns {void}
     */
    replaceChild(oldChild, newChild, _$destroyOldChild) {

        newChild = this.layoutManager._$normalizeContentItem(newChild);

        var index = indexOf(oldChild, this.contentItems),
            parentNode = oldChild.element[0].parentNode;

        if (index === -1) {
            throw new Error('Can\'t replace child. oldChild is not child of this');
        }

        parentNode.replaceChild(newChild.element[0], oldChild.element[0]);

        /*
         * Optionally destroy the old content item
         */
        if (_$destroyOldChild === true) {
            oldChild.parent = null;
            oldChild._$destroy();
        }

        /*
         * Wire the new contentItem into the tree
         */
        this.contentItems[index] = newChild;
        newChild.parent = this;

        /*
         * Update tab reference
         */
        if (this.isStack) {
            this.header.tabs[index].contentItem = newChild;
        }

        //TODO This doesn't update the config... refactor to leave item nodes untouched after creation
        if (newChild.parent.isInitialised === true && newChild.isInitialised === false) {
            newChild._$init();
        }

        this.callDownwards('setSize');
    }

    /**
     * Convenience method.
     * Shorthand for this.parent.removeChild( this )
     *
     * @returns {void}
     */
    remove() {
        this.parent.removeChild(this);
    }

    /**
     * Removes the component from the layout and creates a new
     * browser window with the component and its children inside
     *
     * @returns {BrowserPopout}
     */
    popout() {
        var browserPopout = this.layoutManager.createPopout(this);
        this.emitBubblingEvent('stateChanged');
        return browserPopout;
    }

    /**
     * Maximises the Item or minimises it if it is already maximised
     *
     * @returns {void}
     */
    toggleMaximise(e) {
        e && e.preventDefault();
        if (this.isMaximised === true) {
            this.layoutManager._$minimiseItem(this);
        } else {
            this.layoutManager._$maximiseItem(this);
        }

        this.isMaximised = !this.isMaximised;
        this.emitBubblingEvent('stateChanged');
    }

    /**
     * Selects the item if it is not already selected
     *
     * @returns {void}
     */
    select() {
        if (this.layoutManager.selectedItem !== this) {
            this.layoutManager.selectItem(this, true);
            this.element.addClass('lm_selected');
        }
    }

    /**
     * De-selects the item if it is selected
     *
     * @returns {void}
     */
    deselect() {
        if (this.layoutManager.selectedItem === this) {
            this.layoutManager.selectedItem = null;
            this.element.removeClass('lm_selected');
        }
    }

    /**
     * Set this component's title
     *
     * @public
     * @param {String} title
     *
     * @returns {void}
     */
    setTitle(title) {
        this.config.title = title;
        this.emit('titleChanged', title);
        this.emit('stateChanged');
    }

    /**
     * Checks whether a provided id is present
     *
     * @public
     * @param   {String}  id
     *
     * @returns {Boolean} isPresent
     */
    hasId(id) {
        if (!this.config.id) {
            return false;
        } else if (typeof this.config.id === 'string') {
            return this.config.id === id;
        } else if (this.config.id instanceof Array) {
            return indexOf(id, this.config.id) !== -1;
        }
    }

    /**
     * Adds an id. Adds it as a string if the component doesn't
     * have an id yet or creates/uses an array
     *
     * @public
     * @param {String} id
     *
     * @returns {void}
     */
    addId(id) {
        if (this.hasId(id)) {
            return;
        }

        if (!this.config.id) {
            this.config.id = id;
        } else if (typeof this.config.id === 'string') {
            this.config.id = [this.config.id, id];
        } else if (this.config.id instanceof Array) {
            this.config.id.push(id);
        }
    }

    /**
     * Removes an existing id. Throws an error
     * if the id is not present
     *
     * @public
     * @param   {String} id
     *
     * @returns {void}
     */
    removeId(id) {
        if (!this.hasId(id)) {
            throw new Error('Id not found');
        }

        if (typeof this.config.id === 'string') {
            delete this.config.id;
        } else if (this.config.id instanceof Array) {
            var index = indexOf(id, this.config.id);
            this.config.id.splice(index, 1);
        }
    }

    /****************************************
     * SELECTOR
     ****************************************/
    getItemsByFilter(filter) {
        var result = [],
            next = function(contentItem) {
                for (var i = 0; i < contentItem.contentItems.length; i++) {

                    if (filter(contentItem.contentItems[i]) === true) {
                        result.push(contentItem.contentItems[i]);
                    }

                    next(contentItem.contentItems[i]);
                }
            };

        next(this);
        return result;
    }

    getItemsById(id) {
        return this.getItemsByFilter(function(item) {
            if (item.config.id instanceof Array) {
                return indexOf(id, item.config.id) !== -1;
            } else {
                return item.config.id === id;
            }
        });
    }

    getItemsByType(type) {
        return this._$getItemsByProperty('type', type);
    }

    getComponentsByName(componentName) {
        var components = this._$getItemsByProperty('componentName', componentName),
            instances = [],
            i;

        for (i = 0; i < components.length; i++) {
            instances.push(components[i].instance);
        }

        return instances;
    }

    /****************************************
     * PACKAGE PRIVATE
     ****************************************/
    _$getItemsByProperty(key, value) {
        return this.getItemsByFilter(function(item) {
            return item[key] === value;
        });
    }

    _$setParent(parent) {
        this.parent = parent;
    }

    _$highlightDropZone(x, y, area) {
        this.layoutManager.dropTargetIndicator.highlightArea(area);
    }

    _$onDrop(contentItem) {
        this.addChild(contentItem);
    }

    _$hide() {
        this._callOnActiveComponents('hide');
        this.element.hide();
        this.layoutManager.updateSize();
    }

    _$show() {
        this._callOnActiveComponents('show');
        this.element.show();
        this.layoutManager.updateSize();
    }

    _callOnActiveComponents(methodName) {
        var stacks = this.getItemsByType('stack'),
            activeContentItem,
            i;

        for (i = 0; i < stacks.length; i++) {
            activeContentItem = stacks[i].getActiveContentItem();

            if (activeContentItem && activeContentItem.isComponent) {
                activeContentItem.container[methodName]();
            }
        }
    }

    /**
     * Destroys this item ands its children
     *
     * @returns {void}
     */
    _$destroy() {
        this.emitBubblingEvent('beforeItemDestroyed');
        this.element.remove();
        this.emitBubblingEvent('itemDestroyed');
    }

    /**
     * Returns the area the component currently occupies in the format
     *
     * {
     *		x1: int
     *		xy: int
     *		y1: int
     *		y2: int
     *		contentItem: contentItem
     * }
     */
    _$getArea(element) {
        element = element || this.element;

        var offset = element.offset(),
            width = element.width(),
            height = element.height();

        return {
            x1: offset.left,
            y1: offset.top,
            x2: offset.left + width,
            y2: offset.top + height,
            surface: width * height,
            contentItem: this
        };
    }

    /**
     * The tree of content items is created in two steps: First all content items are instantiated,
     * then init is called recursively from top to bottem. This is the basic init function,
     * it can be used, extended or overwritten by the content items
     *
     * Its behaviour depends on the content item
     *
     * @package private
     *
     * @returns {void}
     */
    _$init() {
        var i;
        this.setSize();

        for (i = 0; i < this.contentItems.length; i++) {
            this.childElementContainer.append(this.contentItems[i].element);
        }

        this.isInitialised = true;
        this.emitBubblingEvent('itemCreated');
        this.emitBubblingEvent(this.type + 'Created');
    }

    /**
     * Emit an event that bubbles up the item tree.
     *
     * @param   {String} name The name of the event
     *
     * @returns {void}
     */
    emitBubblingEvent(name) {
        var event = new BubblingEvent(name, this);
        this.emit(name, event);
    }

    /**
     * Private method, creates all content items for this node at initialisation time
     * PLEASE NOTE, please see addChild for adding contentItems add runtime
     * @private
     * @param   {configuration item node} config
     *
     * @returns {void}
     */
    _createContentItems(config) {
        var oContentItem, i;

        if (!(config.content instanceof Array)) {
            throw new ConfigurationError('content must be an Array', config);
        }

        for (i = 0; i < config.content.length; i++) {
            oContentItem = this.layoutManager.createContentItem(config.content[i], this);
            this.contentItems.push(oContentItem);
        }
    }

    /**
     * Extends an item configuration node with default settings
     * @private
     * @param   {configuration item node} config
     *
     * @returns {configuration item node} extended config
     */
    _extendItemNode(config) {

        for (var key in itemDefaultConfig) {
            if (config[key] === undefined) {
                config[key] = itemDefaultConfig[key];
            }
        }

        return config;
    }

    /**
     * Called for every event on the item tree. Decides whether the event is a bubbling
     * event and propagates it to its parent
     *
     * @param    {String} name the name of the event
     * @param   {BubblingEvent} event
     *
     * @returns {void}
     */
    _propagateEvent(name, event) {
        if (event instanceof BubblingEvent &&
            event.isPropagationStopped === false &&
            this.isInitialised === true) {

            /**
             * In some cases (e.g. if an element is created from a DragSource) it
             * doesn't have a parent and is not below root. If that's the case
             * propagate the bubbling event from the top level of the substree directly
             * to the layoutManager
             */
            if (this.isRoot === false && this.parent) {
                this.parent.emit.apply(this.parent, Array.prototype.slice.call(arguments, 0));
            } else {
                this._scheduleEventPropagationToLayoutManager(name, event);
            }
        }
    }

    /**
     * All raw events bubble up to the root element. Some events that
     * are propagated to - and emitted by - the layoutManager however are
     * only string-based, batched and sanitized to make them more usable
     *
     * @param {String} name the name of the event
     *
     * @private
     * @returns {void}
     */
    _scheduleEventPropagationToLayoutManager(name, event) {
        if (indexOf(name, this._throttledEvents) === -1) {
            this.layoutManager.emit(name, event.origin);
        } else {
            if (this._pendingEventPropagations[name] !== true) {
                this._pendingEventPropagations[name] = true;
                animFrame(fnBind(this._propagateEventToLayoutManager, this, [name, event]));
            }
        }

    }

    /**
     * Callback for events scheduled by _scheduleEventPropagationToLayoutManager
     *
     * @param {String} name the name of the event
     *
     * @private
     * @returns {void}
     */
    _propagateEventToLayoutManager(name, event) {
        this._pendingEventPropagations[name] = false;
        this.layoutManager.emit(name, event);
    }
}
