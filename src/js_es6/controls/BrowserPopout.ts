import $ from 'jquery';
import { Config, ManagerConfig, PopoutManagerConfig } from '../config/config';
import { UnexpectedNullError } from '../errors/error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { ConfigMinifier } from '../utils/ConfigMinifier';
import { EventEmitter } from '../utils/EventEmitter';
import { Rect } from '../utils/types';
import {
    deepExtend,
    fnBind,
    getUniqueId
} from '../utils/utils';

/**
 * Pops a content item out into a new browser window.
 * This is achieved by
 *
 *    - Creating a new configuration with the content item as root element
 *    - Serializing and minifying the configuration
 *    - Opening the current window's URL with the configuration as a GET parameter
 *    - GoldenLayout when opened in the new window will look for the GET parameter
 *      and use it instead of the provided configuration
 *
 * @param {Object} config GoldenLayout item config
 * @param {Object} dimensions A map with width, height, top and left
 * @param {String} parentId The id of the element the item will be appended to on popIn
 * @param {Number} indexInParent The position of this element within its parent
 * @param {lm.LayoutManager} layoutManager
 */


export class BrowserPopout extends EventEmitter {
    private _popoutWindow: Window | null;
    private _isInitialised;
    private _id: string | null;

    constructor(private _config: PopoutManagerConfig,
        private _initialWindow: Rect,
        private _layoutManager: LayoutManager
    ) {
        super();
        
        this._isInitialised = false;

        this._popoutWindow = null;
        this._id = null;
        this._createWindow();
    }

    toConfig(): PopoutManagerConfig {
        if (this._isInitialised === false) {
            throw new Error('Can\'t create config, layout not yet initialised');
        }

        const glInstance = this.getGlInstance();
        const glInstanceConfig = glInstance.toConfig();
        
        let left: number | null;
        let top: number | null;
        if (this._popoutWindow === null) {
            left = null;
            top = null;
        } else {
            left = this._popoutWindow.screenX ?? this._popoutWindow.screenLeft;
            top = this._popoutWindow.screenY ?? this._popoutWindow.screenTop;
        }

        const window: PopoutManagerConfig.Window = {
            width: this.getGlInstance().width,
            height: this.getGlInstance().height,
            left,
            top,
            maximised: false, // need to work out maximised properly
        };

        const config: PopoutManagerConfig = {
            content: glInstanceConfig.content,
            openPopouts: glInstanceConfig.openPopouts,
            settings: glInstanceConfig.settings,
            dimensions: glInstanceConfig.dimensions,
            labels: glInstanceConfig.labels,
            window,
            parentId: this._config.parentId,
            indexInParent: this._config.indexInParent
        };

        return config;
    }

    getGlInstance(): LayoutManager {
        if (this._popoutWindow === null) {
            throw new UnexpectedNullError('BPGGI24693');
        } else {
            return this._popoutWindow.__glInstance;
        }
    }

    getWindow(): Window {
        if (this._popoutWindow === null) {
            throw new UnexpectedNullError('BPGW087215');
        } else {
            return this._popoutWindow;
        }
    }

    close(): void {
        if (this.getGlInstance()) {
            this.getGlInstance().closeWindow();
        } else {
            try {
                this.getWindow().close();
            } catch (e) {
                //
            }
        }
    }

    /**
     * Returns the popped out item to its original position. If the original
     * parent isn't available anymore it falls back to the layout's topmost element
     */
    popIn() {
        let copiedChildConfig: Config;
        let parentItem: AbstractContentItem;
        let index = this._indexInParent;

        if (this._parentId) {

            /*
             * The $.extend call seems a bit pointless, but it's crucial to
             * copy the config returned by this.getGlInstance().toConfig()
             * onto a new object. Internet Explorer keeps the references
             * to objects on the child window, resulting in the following error
             * once the child window is closed:
             *
             * The callee (server [not server application]) is not available and disappeared
             */
            const glInstanceConfig = this.getGlInstance().toConfig();
            const copiedGlInstanceConfig = deepExtend({}, glInstanceConfig) as ManagerConfig;
            const copiedContent = copiedGlInstanceConfig.content;
            if (copiedContent === undefined || copiedContent.length === 0) {
                throw new Error('BrowserPopout.popIn: child config not available');
            } else {
                const copiedChildConfig = copiedContent[0];
                const root = this._layoutManager.root;
                if (root === null) {
                    throw new Error('BrowserPopout.popIn: LayoutManager root not available');
                } else {
                    parentItem = root.getItemsById(this._parentId)[0];

                    /*
                    * Fallback if parentItem is not available. Either add it to the topmost
                    * item or make it the topmost item if the layout is empty
                    */
                    if (!parentItem) {
                        if (root.contentItems.length > 0) {
                            parentItem = root.contentItems[0];
                        } else {
                            parentItem = root;
                        }
                        index = 0;
                    }
                }
            }
        }

        parentItem.addChild(copiedChildConfig, this._indexInParent);
        this.close();
    }

    /**
     * Creates the URL and window parameter
     * and opens a new window
     *
     * @private
     *
     * @returns {void}
     */
    _createWindow() {
        var checkReadyInterval,
            url = this._createUrl(),

            /**
             * Bogus title to prevent re-usage of existing window with the
             * same title. The actual title will be set by the new window's
             * GoldenLayout instance if it detects that it is in subWindowMode
             */
            title = Math.floor(Math.random() * 1000000).toString(36),

            /**
             * The options as used in the window.open string
             */
            options = this._serializeWindowOptions({
                width: this._initialWindow.width,
                height: this._initialWindow.height,
                innerWidth: this._initialWindow.width,
                innerHeight: this._initialWindow.height,
                menubar: 'no',
                toolbar: 'no',
                location: 'no',
                personalbar: 'no',
                resizable: 'yes',
                scrollbars: 'no',
                status: 'no'
            });

        this._popoutWindow = window.open(url, title, options);

        if (!this._popoutWindow) {
            if (this._layoutManager.config.settings.blockedPopoutsThrowError === true) {
                var error = new Error('Popout blocked');
                error.type = 'popoutBlocked';
                throw error;
            } else {
                return;
            }
        }

        $(this._popoutWindow)
            .on('load', fnBind(this.positionWindow, this))
            .on('unload beforeunload', fnBind(this._onClose, this));

        /**
         * Polling the childwindow to find out if GoldenLayout has been initialised
         * doesn't seem optimal, but the alternatives - adding a callback to the parent
         * window or raising an event on the window object - both would introduce knowledge
         * about the parent to the child window which we'd rather avoid
         */
        checkReadyInterval = setInterval(fnBind(function() {
            if (this._popoutWindow.__glInstance && this._popoutWindow.__glInstance.isInitialised) {
                this._onInitialised();
                clearInterval(checkReadyInterval);
            }
        }, this), 10);
    }

    /**
     * Serialises a map of key:values to a window options string
     *
     * @param   {Object} windowOptions
     *
     * @returns {String} serialised window options
     */
    _serializeWindowOptions(windowOptions) {
        var windowOptionsString = [],
            key;

        for (key in windowOptions) {
            windowOptionsString.push(key + '=' + windowOptions[key]);
        }

        return windowOptionsString.join(',');
    }

    /**
     * Creates the URL for the new window, including the
     * config GET parameter
     *
     * @returns {String} URL
     */
    _createUrl() {
        var config = {
                content: this._config
            },
            storageKey = 'gl-window-config-' + getUniqueId(),
            urlParts;

        config = (new ConfigMinifier()).minifyConfig(config);

        try {
            localStorage.setItem(storageKey, JSON.stringify(config));
        } catch (e) {
            throw new Error('Error while writing to localStorage ' + e.toString());
        }

        urlParts = document.location.href.split('?');

        // URL doesn't contain GET-parameters
        if (urlParts.length === 1) {
            return urlParts[0] + '?gl-window=' + storageKey;

            // URL contains GET-parameters
        } else {
            return document.location.href + '&gl-window=' + storageKey;
        }
    }

    /**
     * Move the newly created window roughly to
     * where the component used to be.
     */
    private positionWindow() {
        if (this._popoutWindow === null) {
            throw new Error('BrowserPopout.positionWindow: null popoutWindow');
        } else {
            this._popoutWindow.moveTo(this._initialWindow.left, this._initialWindow.top);
            this._popoutWindow.focus();
        }
    }

    /**
     * Callback when the new window is opened and the GoldenLayout instance
     * within it is initialised
     *
     * @returns {void}
     */
    _onInitialised() {
        this._isInitialised = true;
        this.getGlInstance().on('popIn', this.popIn, this);
        this.emit('initialised');
    }

    /**
     * Invoked 50ms after the window unload event
     *
     * @private
     *
     * @returns {void}
     */
    _onClose() {
        setTimeout(fnBind(this.emit, this, ['closed']), 50);
    }
}
