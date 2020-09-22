export interface Settings {
    /**
     * Turns headers on or off. If false, the layout will be displayed with splitters only.
     * Default: true
     */
    hasHeaders?: boolean;

    /**
     * Constrains the area in which items can be dragged to the layout's container. Will be set to false
     * automatically when layout.createDragSource() is called.
     * Default: true
     */
    constrainDragToContainer?: boolean;

    /**
     * If true, the user can re-arrange the layout by dragging items by their tabs to the desired location.
     * Default: true
     */
    reorderEnabled?: boolean;

    /**
     * If true, the user can select items by clicking on their header. This sets the value of layout.selectedItem to
     * the clicked item, highlights its header and the layout emits a 'selectionChanged' event.
     * Default: false
     */
    selectionEnabled?: boolean;

    /**
     * Decides what will be opened in a new window if the user clicks the popout icon. If true the entire stack will
     * be transferred to the new window, if false only the active component will be opened.
     * Default: false
     */
    popoutWholeStack?: boolean;

    /**
     * Specifies if an error is thrown when a popout is blocked by the browser (e.g. by opening it programmatically).
     * If false, the popout call will fail silently.
     * Default: true
     */
    blockedPopoutsThrowError?: boolean;

    /**
     * Specifies if all popouts should be closed when the page that created them is closed. Popouts don't have a
     * strong dependency on their parent and can exist on their own, but can be quite annoying to close by hand. In
     * addition, any changes made to popouts won't be stored after the parent is closed.
     * Default: true
     */
    closePopoutsOnUnload?: boolean;

    /**
     * Specifies if the popout icon should be displayed in the header-bar.
     * Default: true
     */
    showPopoutIcon?: boolean;

    /**
     * Specifies if the maximise icon should be displayed in the header-bar.
     * Default: true
     */
    showMaximiseIcon?: boolean;

    /**
     * Specifies if the close icon should be displayed in the header-bar.
     * Default: true
     */
    showCloseIcon?: boolean;
}
