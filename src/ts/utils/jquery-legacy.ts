import { LeftAndTop } from './types';
import { pixelsToNumber } from './utils';

/** @internal */
export function getJQueryLeftAndTop(element: HTMLElement): LeftAndTop {
    const style = getComputedStyle(element, null);
    const leftAndTop: LeftAndTop = {
        left: pixelsToNumber(style.left),
        top: pixelsToNumber(style.top),
    }
    return leftAndTop;
}
