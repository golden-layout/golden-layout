import { ItemConfig, ManagerConfig, PopoutManagerConfig } from './config/config';
import { UnexpectedNullError } from './errors/error';
import { LayoutManager } from './LayoutManager';
import { ConfigMinifier } from './utils/ConfigMinifier';
import { getQueryStringParam } from './utils/utils';

export class PopoutLayoutManager extends LayoutManager {
    private _popoutManagerConfig: PopoutManagerConfig;

    constructor(container?: Element | HTMLElement) {        
        super(true, PopoutLayoutManager.createConfig(), container);

        this._popoutManagerConfig = this.config as PopoutManagerConfig;
    }

    protected createToConfig(content: ItemConfig[], openPopouts: PopoutManagerConfig[]): ManagerConfig {

        const config: PopoutManagerConfig = {
            content,
            openPopouts,
            settings:  ManagerConfig.Settings.createCopy(this._popoutManagerConfig.settings),
            dimensions: ManagerConfig.Dimensions.createCopy(this._popoutManagerConfig.dimensions),
            labels: ManagerConfig.Labels.createCopy(this._popoutManagerConfig.labels),
            parentId: this._popoutManagerConfig.parentId,
            indexInParent: this._popoutManagerConfig.indexInParent,
            window: window,
        }

        return config;
    }
}

export namespace PopoutLayoutManager {
    export function createConfig(): PopoutManagerConfig {
        const windowConfigKey = getQueryStringParam('gl-window');

        if (windowConfigKey === null) {
            throw new UnexpectedNullError('PLMCC19931388');
        } else {
            const windowConfigStr = localStorage.getItem(windowConfigKey);
            if (windowConfigStr === null) {
                throw new Error('Null gl-window Config');
            }
            localStorage.removeItem(windowConfigKey);
            const minifiedWindowConfig = JSON.parse(windowConfigStr);
            return (new ConfigMinifier()).unminifyConfig(minifiedWindowConfig) as PopoutManagerConfig;
        }
    }
}