# Structure

## Overview

The following diagram shows structure of a Golden Layout object.

```
+-----------------+      +------------+     +---------------+
| Layout Manager  +------+ GroundItem +-----+ ComponentItem |
| (GoldenLayout   |      | (hidden)   |     | (root item)   |
|  or             |      +------------+     +---------------+
|  VirtualLayout) |                    OR
|                 |                         +---------------+
|                 |                    -----+ Stack         +---+
|                 |                         | (root item)   |   |   +----------------+
|                 |                         +---------------+   +---+ ComponentItem  |
|                 |                                             |   +----------------+
|                 |                                             |
|                 |                                             +--- more components
|                 |                                             |
|                 |                    OR
|                 |                         +---------------+
|                 |                    -----+ RowOrColumn   +---+
|                 |                         | (root item)   |   |   +-------------+
|                 |                         +---------------+   +---+ RowOrColumn +---+
|                 |                                             |   +-------------+   |
|                 |                                             |                     +--- more RowOrColumns, Stacks
|                 |                                             |                     |
|                 |                                             |
|                 |                                             |   +-------------+
|                 |                                             +---+ Stack Item  +---+
|                 |                                             |   +-------------+   |   +----------------+
|                 |                                             |                     +---+ ComponentItem  |
|                 |                                             |                     |   +----------------+
|                 |                                             |                     |
|                 |                                             |                     +--- more Components
|                 |                                             |                     |
|                 |                                             |
|                 |                                             +--- more RowOrColumns, Stacks
|                 |                                             |
|                 |
|     openPopouts +-----------------------+
|                 |                       |   +-----------------+     +------------+     +---------------+
+-----------------+                       +---+ LayoutManager   +-----+ GroundItem +-----+ ComponentItem |
                                          |   | (BrowserPopout) |     +------------+     +---------------+
                                          |   +-----------------+
                                          |
                                          +--- more BrowserPopouts
                                          |


|    Permanent                        |    Replaced whenever a layout is loaded                                    |
+-------------------------------------+----------------------------------------------------------------------------+
```

A `GoldenLayout` (or `VirtualLayout`) object is a descendant of a `LayoutManager` object.  So when an instance of either of these is created, a `LayoutManager` is created. Upon creation, an instance of a `GroundItem` content item is also created. It will remain in existence for the life of the `LayoutManager` object. The other objects (`ComponentItem`, `RowOrColumn`, `Stack` and `BrowserPopout`) make up a layout and are loaded when a Layout is loaded or modified.  These objects will be destroyed when a layout is closed or a new layout is loaded.

A layout consists of 2 sets of elements:
1. A tree of `ContentItem`s making up the main layout. The main layout excludes popouts.
2. A list of `BrowserPopout`s.  These are the open popouts which appear above the main layout.

## Main Layout
The main layout is a tree of `ContentItem`s. The root of the tree is either a `ComponentItem`, `Stack` or a `RowOrColumn` content item.

If the root is a `ComponentItem`, then the layout will only have one component/element which the user cannot manipulate with Golden Layout in any way. To the user, it will appear as if Golden Layout was not present - just the component/element.

If the root is a `RowOrColumn`, then it will be the root of the tree.  Each `RowOrColumn` object will have one or more content item children. A child can be a `RowOrColumn`, or `Stack`. The leaves of the tree will be `Stack` content items.

## GroundItem
The `GroundItem` exists so that all content items in a layout have a parent content item.  This includes the root content item.  The `GroundItem` can have no more than one child content item (which would be the root content item). If there is no layout loaded, then the GroundItem will have 0 children and the root item will be undefined.

`GroundItem` is not exposed to the API. All its methods and properties are accessed via `LayoutManager`.

## RowOrColumn

A layout tree consists of rows and columns with `stack`s forming the leaves of the tree. Normally, the descendants in the tree hierarchy alternate between row and column.  That is, if the root is a row, then its children will be columns.  In turn, the grand children will be rows.  This will alternate until the descendant child is a `stack`.

Each row or column can have one or more children. The size of children along the main axis is specified by each child's `size` property. The size of all the children in the cross axis direction is specified by the parent's size.  For example, if a `RowOrColumn` is a row, then each of its children's width is specified by the child's `size` property.  However each of the children's height is specified by that `RowOrColumn`'s (ie, the parent of the children) size property.  Sizing is further discussed [here](../sizing-components/index.md).

## Stack

## ComponentItem

## BrowserPopout
