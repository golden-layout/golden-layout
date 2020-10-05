import { Rect } from '../utils/types';
import { createTemplateHtmlElement } from '../utils/utils';

export class TransitionIndicator {
    private _element: HTMLElement;
    private _toElement: HTMLElement | null;
    private _fromDimensions: null;
    private _totalAnimationDuration: number;
    private _animationStartTime: number | null;

    constructor() {
        this._element = createTemplateHtmlElement('<div class="lm_transition_indicator"></div>');
        document.body.appendChild(this._element);

        this._toElement = null;
        this._fromDimensions = null;
        this._totalAnimationDuration = 200;
        this._animationStartTime = null;
    }

    destroy(): void {
        this._element.remove();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transitionElements(fromElement: HTMLElement, toElement: HTMLElement): void {
        /**
         * TODO - This is not quite as cool as expected. Review.
         */
        return;
        // this._toElement = toElement;
        // this._animationStartTime = now();
        // this._fromDimensions = this._measure(fromElement);
        // this._fromDimensions.opacity = 0.8;
        // this._element.show().css(this._fromDimensions);
        // animFrame(fnBind(this._nextAnimationFrame, this));
    }

    private nextAnimationFrame(): void {
        // if (this._toElement === null || this._fromDimensions === null || this._animationStartTime === null) {
        //     throw new UnexpectedNullError('TINAFTD97115');
        // } else {
        //     const toDimensions = this.measure(this._toElement);
        //     const animationProgress = (now() - this._animationStartTime) / this._totalAnimationDuration;
        //     const currentFrameStyles = {};
        //     const cssProperty;

        //     if (animationProgress >= 1) {
        //         this._element.style.display = 'none';
        //         return;
        //     }

        //     toDimensions.opacity = 0;

        //     for (const cssProperty in this._fromDimensions) {
        //         currentFrameStyles[cssProperty] = this._fromDimensions[cssProperty] +
        //             (toDimensions[cssProperty] - this._fromDimensions[cssProperty]) *
        //             animationProgress;
        //     }

        //     this._element.css(currentFrameStyles);
        //     animFrame(fnBind(this._nextAnimationFrame, this));
        // }
    }

    private measure(element: HTMLElement): Rect {
        const rect = element.getBoundingClientRect();

        return {
            left: rect.left,
            top: rect.top,
            width: element.offsetWidth,
            height: element.offsetHeight,
        };
    }
}
