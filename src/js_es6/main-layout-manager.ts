import { Config, ItemConfig, ManagerConfig, PopoutManagerConfig } from './config/config';
import { UserConfig } from './config/UserConfig';
import { LayoutManager } from './LayoutManager';

export class MainLayoutManager extends LayoutManager {
    private _mainConfig: Config;

    constructor(userConfig: UserConfig, container?: HTMLElement) {        
        super(false, MainLayoutManager.createConfig(userConfig), container);

        this._mainConfig = this.config as Config;
    }

    protected createToConfig(content: ItemConfig[], openPopouts: PopoutManagerConfig[], maximisedItemId: string | null): ManagerConfig {

        const config: Config = {
            content,
            openPopouts,
            settings:  ManagerConfig.Settings.createCopy(this._mainConfig.settings),
            dimensions: ManagerConfig.Dimensions.createCopy(this._mainConfig.dimensions),
            header: ManagerConfig.Header.createCopy(this._mainConfig.header),
            maximisedItemId,
            resolved: true,
        }

        return config;
    }
}

export namespace MainLayoutManager {
    export function createConfig(userConfig: UserConfig): Config {
        let config: Config;
        if (UserConfig.isUserConfig(userConfig)) {
            config = UserConfig.resolve(userConfig);
        } else {
            config = userConfig as Config;
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

        if (!config.header.show) {
            config.dimensions.headerHeight = 0;
        }

        return config;
    }
}