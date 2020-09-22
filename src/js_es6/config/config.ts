import { Dimensions } from './dimensions';
import { Labels } from './labels';
import { Settings } from './settings';

export interface Config extends Record<string, unknown> {
    settings?: Settings;
    dimensions?: Dimensions;
    labels?: Labels;
    content?: ItemConfigType[];
}
