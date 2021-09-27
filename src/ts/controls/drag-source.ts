import { ComponentItemConfig } from "../config/config";
import { UnexpectedNullError } from "../errors/internal-error";
import { ComponentItem } from "../items/component-item";
import { GroundItem } from "../items/ground-item";
import { LayoutManager } from "../layout-manager";
import { DragListener } from "../utils/drag-listener";
import { JsonValue } from "../utils/types";
import { DragProxy } from "./drag-proxy";
import { ResolvedRowOrColumnItemConfig } from "../config/resolved-config";

/**
 * Allows for any DOM item to create a component on drag
 * start to be dragged into the Layout
 * @public
 */
export class DragSource {
    /** @internal */
    private _dragListener: DragListener | null;
    /** @internal */
    private _dummyGroundContainer: HTMLElement;
    /** @internal */
    private _dummyGroundContentItem: GroundItem;

    /** @internal */
    constructor(
        /** @internal */
        private _layoutManager: LayoutManager,
        /** @internal */
        private readonly _element: HTMLElement,
        /** @internal */
        private readonly _extraAllowableChildTargets: HTMLElement[],
        /** @internal */
        private _componentTypeOrFtn:
            | JsonValue
            | (() => DragSource.ComponentItemConfig | ComponentItemConfig),
        /** @internal */
        private _componentState: JsonValue | undefined,
        /** @internal */
        private _title: string | undefined,
        /** @internal  **/
        private _id: string | undefined
    ) {
        this._dragListener = null;

        this._dummyGroundContainer = document.createElement("div");

        const dummyRootItemConfig =
            ResolvedRowOrColumnItemConfig.createDefault("row");
        this._dummyGroundContentItem = new GroundItem(
            this._layoutManager,
            dummyRootItemConfig,
            this._dummyGroundContainer
        );

        this.createDragListener();
    }

    /**
     * Disposes of the drag listeners so the drag source is not usable any more.
     * @internal
     */
    destroy(): void {
        this.removeDragListener();
    }

    /**
     * Called initially and after every drag
     * @internal
     */
    private createDragListener() {
        this.removeDragListener();

        this._dragListener = new DragListener(
            this._element,
            this._extraAllowableChildTargets
        );
        this._dragListener.on("dragStart", (x, y) => this.onDragStart(x, y));
        this._dragListener.on("dragStop", () => this.onDragStop());
    }

    /**
     * Callback for the DragListener's dragStart event
     *
     * @param x - The x position of the mouse on dragStart
     * @param y - The x position of the mouse on dragStart
     * @internal
     */
    private onDragStart(x: number, y: number) {
        const type = "component";
        let dragSourceItemConfig:
            | ComponentItemConfig
            | DragSource.ComponentItemConfig;
        if (typeof this._componentTypeOrFtn === "function") {
            dragSourceItemConfig = this._componentTypeOrFtn();
            // If the componentType property exists, then it is already a ComponentItemConfig so nothing to do
            if (!("componentType" in dragSourceItemConfig)) {
                dragSourceItemConfig = {
                    type,
                    componentState: dragSourceItemConfig.state,
                    componentType: dragSourceItemConfig.type,
                    title: dragSourceItemConfig.title ?? this._title,
                    id: dragSourceItemConfig.id ?? this._id,
                };
            }
        } else {
            dragSourceItemConfig = {
                type,
                componentState: this._componentState,
                componentType: this._componentTypeOrFtn,
                title: this._title,
                id: this._id,
            };
        }
        // Create a dummy ContentItem only for drag purposes
        // All ContentItems (except for GroundItem) need a parent.  When dragging, the parent is not used.
        // Instead of allowing null parents (as Javascript version did), use a temporary dummy GroundItem parent and add ContentItem to that
        // If this does not work, need to create alternative GroundItem class

        const resolvedItemConfig = ComponentItemConfig.resolve(
            dragSourceItemConfig as ComponentItemConfig
        );

        const componentItem = new ComponentItem(
            this._layoutManager,
            resolvedItemConfig,
            this._dummyGroundContentItem
        );
        this._dummyGroundContentItem.contentItems.push(componentItem);

        if (this._dragListener === null) {
            throw new UnexpectedNullError("DSODSD66746");
        } else {
            const dragProxy = new DragProxy(
                x,
                y,
                this._dragListener,
                this._layoutManager,
                componentItem,
                this._dummyGroundContentItem
            );

            const transitionIndicator = this._layoutManager.transitionIndicator;
            if (transitionIndicator === null) {
                throw new UnexpectedNullError("DSODST66746");
            } else {
                transitionIndicator.transitionElements(
                    this._element,
                    dragProxy.element
                );
            }
        }
    }

    /** @internal */
    private onDragStop() {
        // if (this._dummyGroundContentItem === undefined) {
        //     throw new UnexpectedUndefinedError('DSODSDRU08116');
        // } else {
        //     this._dummyGroundContentItem._$destroy
        //     this._dummyGroundContentItem = undefined;
        // }
        this.createDragListener();
    }

    /**
     * Called after every drag and when the drag source is being disposed of.
     * @internal
     */
    private removeDragListener() {
        if (this._dragListener !== null) {
            this._dragListener.destroy();
            this._dragListener = null;
        }
    }
}

/** @public */
export namespace DragSource {
    /**
     * @deprecated  use {@link(ComponentItemConfig:interface)}
     */
    export interface ComponentItemConfig {
        type: JsonValue;
        state?: JsonValue;
        title?: string;
        id?: string;
    }
}
