import { ManagerConfig, PopoutManagerConfig } from '../config/config';
import { PopoutBlockedError } from '../errors/external-error';
import { AssertError, UnexpectedNullError } from '../errors/internal-error';
import { AbstractContentItem } from '../items/AbstractContentItem';
import { LayoutManager } from '../LayoutManager';
import { ConfigMinifier } from '../utils/ConfigMinifier';
import { EventEmitter } from '../utils/EventEmitter';
import { Rect } from '../utils/types';
import { deepExtend, getUniqueId } from '../utils/utils';

/**
 * Pops a content item out into a new browser window.
 * This is achieved by
 *
 *    - Creating a new configuration with the content item as root element
 *    - Serializing and minifying the configuration
 *    - Opening the current window's URL with the configuration as a GET parameter
 *    - GoldenLayout when opened in the new window will look for the GET parameter
 *      and use it instead of the provided configuration
 */

export class BrowserPopout extends EventEmitter {
    private _popoutWindow: Window | null;
    private _isInitialised;
    private _checkReadyInterval: NodeJS.Timeout | undefined;

    /**
     * @param _config GoldenLayout item config
     * @param _initialWindowSize A map with width, height, top and left
     * @param _layoutManager
     */
    constructor(private _config: PopoutManagerConfig,
        private _initialWindowSize: Rect,
        private _layoutManager: LayoutManager,
    ) {
        super();
        
        this._isInitialised = false;
        this._popoutWindow = null;
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
        };

        const config: PopoutManagerConfig = {
            content: glInstanceConfig.content,
            openPopouts: glInstanceConfig.openPopouts,
            settings: glInstanceConfig.settings,
            dimensions: glInstanceConfig.dimensions,
            header: glInstanceConfig.header,
            maximisedItemId: glInstanceConfig.maximisedItemId,
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
    popIn(): void {
        let parentItem: AbstractContentItem;
        let index = this._config.indexInParent;

        if (this._config.parentId) {

            /*
             * The deepExtend call seems a bit pointless, but it's crucial to
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
            if (copiedContent.length === 0) {
                throw new AssertError('BPPICC13088');
            } else {
                const copiedChildConfig = copiedContent[0];
                const root = this._layoutManager.root;
                if (root === null) {
                    throw new UnexpectedNullError('BPPIR34972');
                } else {
                    parentItem = root.getItemsById(this._config.parentId)[0];

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

                    const newContentItem = this._layoutManager.createAndInitContentItem(copiedChildConfig, parentItem);
        
                    parentItem.addChild(newContentItem, index);
                    this.close();
                }
            }
        }
    }

    /**
     * Creates the URL and window parameter
     * and opens a new window
     */
    _createWindow(): void {
        const url = this._createUrl();

        /**
         * Bogus title to prevent re-usage of existing window with the
         * same title. The actual title will be set by the new window's
         * GoldenLayout instance if it detects that it is in subWindowMode
         */
        const target = Math.floor(Math.random() * 1000000).toString(36);

        /**
         * The options as used in the window.open string
         */
        const features = this._serializeWindowFeatures({
            width: this._initialWindowSize.width,
            height: this._initialWindowSize.height,
            innerWidth: this._initialWindowSize.width,
            innerHeight: this._initialWindowSize.height,
            menubar: 'no',
            toolbar: 'no',
            location: 'no',
            personalbar: 'no',
            resizable: 'yes',
            scrollbars: 'no',
            status: 'no'
        });

        this._popoutWindow = globalThis.open(url, target, features);

        if (!this._popoutWindow) {
            if (this._layoutManager.config.settings.blockedPopoutsThrowError === true) {
                const error = new PopoutBlockedError('Popout blocked');
                throw error;
            } else {
                return;
            }
        }

        this._popoutWindow.addEventListener('load', () => this.positionWindow())
        this._popoutWindow.addEventListener('beforeunload', () => this._onClose())

        /**
         * Polling the childwindow to find out if GoldenLayout has been initialised
         * doesn't seem optimal, but the alternatives - adding a callback to the parent
         * window or raising an event on the window object - both would introduce knowledge
         * about the parent to the child window which we'd rather avoid
         */
        this._checkReadyInterval = setInterval(() => this.checkReady(), 10);
    }

    private checkReady() {
        if (this._popoutWindow === null) {
            throw new UnexpectedNullError('BPCR01844');
        } else {
            if (this._popoutWindow.__glInstance && this._popoutWindow.__glInstance.isInitialised) {
                this._onInitialised();
                if (this._checkReadyInterval !== undefined) {
                    clearInterval(this._checkReadyInterval);
                    this._checkReadyInterval = undefined;
                }
            }
        }
    }

    /**
     * Serialises a map of key:values to a window options string
     *
     * @param   {Object} windowOptions
     *
     * @returns {String} serialised window options
     */
    _serializeWindowFeatures(windowOptions: Record<string, string | number>): string {
        const windowOptionsString: string[] = [];

        for (const key in windowOptions) {
            windowOptionsString.push(key + '=' + windowOptions[key].toString());
        }

        return windowOptionsString.join(',');
    }

    /**
     * Creates the URL for the new window, including the
     * config GET parameter
     *
     * @returns URL
     */
    _createUrl(): string {
        const storageKey = 'gl-window-config-' + getUniqueId();
        const config = (new ConfigMinifier()).minifyConfig(this._config);

        try {
            localStorage.setItem(storageKey, JSON.stringify(config));
        } catch (e) {
            throw new Error('Error while writing to localStorage ' + e.toString());
        }

        const urlParts = document.location.href.split('?');

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
            this._popoutWindow.moveTo(this._initialWindowSize.left, this._initialWindowSize.top);
            this._popoutWindow.focus();
        }
    }

    /**
     * Callback when the new window is opened and the GoldenLayout instance
     * within it is initialised
     */
    private _onInitialised(): void {
        this._isInitialised = true;
        this.getGlInstance().on('popIn', () => this.popIn);
        this.emit('initialised');
    }

    /**
     * Invoked 50ms after the window unload event
     */
    private _onClose() {
        setTimeout(() => this.emit('closed'), 50);
    }
}