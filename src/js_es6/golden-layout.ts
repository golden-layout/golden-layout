import { Config, ManagerConfig, PopoutManagerConfig } from './config/config';
import { UserConfig } from './config/UserConfig';
import { LayoutManager } from './LayoutManager';
import { ConfigMinifier } from './utils/ConfigMinifier';
import { createTemplateHtmlElement, getQueryStringParam, stripTags } from './utils/utils';

export class GoldenLayout extends LayoutManager {
    /** @internal */
    private _subWindowsCreated = false;
    /** @internal */
    private _creationTimeoutPassed = false;

    /**
    * @param container a Dom HTML element. Defaults to body
    */
   constructor(userConfig: UserConfig, container?: HTMLElement) {        
        super(GoldenLayout.createConfig(userConfig), container);

        if (this.isSubWindow) {
            document.body.style.visibility = 'hidden';
        }
    }

    /**
     * Creates the actual layout. Must be called after all initial components
     * are registered. Recurses through the configuration and sets up
     * the item tree.
     *
     * If called before the document is ready it adds itself as a listener
     * to the document.ready event
     */
    init(): void {
        /**
         * Create the popout windows straight away. If popouts are blocked
         * an error is thrown on the same 'thread' rather than a timeout and can
         * be caught. This also prevents any further initilisation from taking place.
         */
        if (this._subWindowsCreated === false) {
            this.createSubWindows();
            this._subWindowsCreated = true;
        }


        /**
         * If the document isn't ready yet, wait for it.
         */
        if (document.readyState === 'loading' || document.body === null) {
            document.addEventListener('addEventListener', () => this.init());
            return;
        }

        /**
         * If this is a subwindow, wait a few milliseconds for the original
         * page's js calls to be executed, then replace the bodies content
         * with GoldenLayout
         */
        if (this.isSubWindow === true && this._creationTimeoutPassed === false) {
            setTimeout(() => this.init(), 7);
            this._creationTimeoutPassed = true;
            return;
        }

        if (this.isSubWindow === true) {
            this.adjustToWindowMode();
        }

        super.init();
    }


    /**
     * Creates Subwindows (if there are any). Throws an error
     * if popouts are blocked.
     * @internal
     */
    private createSubWindows() {
        for (let i = 0; i < this.managerConfig.openPopouts.length; i++) {
            const popoutConfig = this.managerConfig.openPopouts[i];
            this.createPopoutFromPopoutManagerConfig(popoutConfig);
        }
    }

    /**
     * This is executed when GoldenLayout detects that it is run
     * within a previously opened popout window.
     * @internal
     */
    private adjustToWindowMode() {
        const popInButton = createTemplateHtmlElement('<div class="lm_popin" title="' + this.managerConfig.header.dock + '">' +
            '<div class="lm_icon"></div>' +
            '<div class="lm_bg"></div>' +
            '</div>');

        popInButton.click = () => this.emit('popIn');

        document.title = stripTags(this.managerConfig.content[0].title);

        const headElement = document.head;

        const appendNodeLists = new Array<NodeListOf<Element>>(4);
        appendNodeLists[0] = document.querySelectorAll('body link');
        appendNodeLists[1] = document.querySelectorAll('body style');
        appendNodeLists[2] = document.querySelectorAll('template');
        appendNodeLists[3] = document.querySelectorAll('.gl_keep');

        for (let listIdx = 0; listIdx < appendNodeLists.length; listIdx++) {
            const appendNodeList = appendNodeLists[listIdx];
            for (let nodeIdx = 0; nodeIdx < appendNodeList.length; nodeIdx++) {
                const node = appendNodeList[nodeIdx];
                headElement.appendChild(node);
            }
        }

        const bodyElement = document.body;
        bodyElement.innerHTML = '';
        bodyElement.style.visibility = 'visible';
        bodyElement.appendChild(popInButton);

        /*
        * This seems a bit pointless, but actually causes a reflow/re-evaluation getting around
        * slickgrid's "Cannot find stylesheet." bug in chrome
        */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const x = document.body.offsetHeight;

        /*
        * Expose this instance on the window object
        * to allow the opening window to interact with
        * it
        */
        window.__glInstance = this;
    }
}

/** @internal */
export namespace GoldenLayout {
    export function createConfig(userConfig: UserConfig): LayoutManager.ManagerConfigAndIsSubWindow {
        const windowConfigKey = getQueryStringParam('gl-window');
        const isSubWindow = windowConfigKey !== null;  

        let config: ManagerConfig;
        if (windowConfigKey !== null) {
            const windowConfigStr = localStorage.getItem(windowConfigKey);
            if (windowConfigStr === null) {
                throw new Error('Null gl-window Config');
            }
            localStorage.removeItem(windowConfigKey);
            const minifiedWindowConfig = JSON.parse(windowConfigStr);
            config = (new ConfigMinifier()).unminifyConfig(minifiedWindowConfig) as PopoutManagerConfig;
        } else {
            if (UserConfig.isUserConfig(userConfig)) {
                config = UserConfig.resolve(userConfig);
            } else {
                config = userConfig as Config;
            }
        }

        // var nextNode = (node: Config) => {
        //     for (var key in node) {
        //         if (key !== 'props' && typeof node[key] === 'object') {
        //             nextNode(node[key] as Config);
        //         } else if (key === 'type' && this.isReactConfig(node)) {
        //             node.type = 'component';
        //             node.componentName = REACT_COMPONENT_ID;
        //         }
        //     }
        // }

        // nextNode(config);

        return {
            managerConfig: config,
            isSubWindow,
        };
     }
}
