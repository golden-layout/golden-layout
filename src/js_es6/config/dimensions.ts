export interface Dimensions {
    /**
     * The width of the borders between the layout items in pixel. Please note: The actual draggable area is wider
     * than the visible one, making it safe to set this to small values without affecting usability.
     * Default: 5
     */
    borderWidth?: number;

    /**
     * The minimum height an item can be resized to (in pixel).
     * Default: 10
     */
    minItemHeight?: number;

    /**
     * The minimum width an item can be resized to (in pixel).
     * Default: 10
     */
    minItemWidth?: number;

    /**
     * The height of the header elements in pixel. This can be changed, but your theme's header css needs to be
     * adjusted accordingly.
     * Default: 20
     */
    headerHeight?: number;

    /**
     * The width of the element that appears when an item is dragged (in pixel).
     * Default: 300
     */
    dragProxyWidth?: number;

    /**
     * The height of the element that appears when an item is dragged (in pixel).
     * Default: 200
     */
    dragProxyHeight?: number;
}
