# Sizing components

## Size
As discussed in the [structure](../structure/index.md#row-or-column) section, the size of a `RowOrColumn` children along its main axis is specified by each child's `size` property.

Within a layout config, the size is specified in 'RowOrColumn' or 'Stack' item configs. The property is a string and consists of 2 parts:
1. Quantity
1. Unit

The quantity should only consist of characters that form valid number as it will be parsed as a number.

Unit can be one of:
* "%" (percent)
* "fr" (fractional)

If the size property is not defined, it defaults to "1fr".

The basic idea of the sizing a `RowOrColumn`'s children is as follows:
1. Get the size of a `RowOrColumn` in pixels along its main axis (width for row, height for column).
1. Subtract the size of all the splitters from the `RowOrColumn` pixel size.
1. For each child whose size is specified in percentage, allocate it a portion of the pixels as per its percentage.
1. If there are any children with fractional sizes then:
    * if not all pixels have been allocated, allocate the remaining pixels to these children according to their fractional size.
    * if all pixels or more have been allocated have been allocated, then allocate another 50% and distribute it to these children according to their fractional size.
1. Adjust allocations so that they total to 100%.
1. Redistribute pixels as best as possible to respect children which specify a minimum size (see below).

Distribution across children with fractional sizes involves totaling all the fractional sizes and then each child gets the proportion specified by its fractional size.

### Example 1

Assume a `RowOrColumn` has size 100 pixels after splitter sizes have been subtracted.

Child | Size | Pixels
------|------|-------
1     | 10%  | 10
2     | 30%  | 30
3     | 1fr  | 20
4     | 2fr  | 40

### Example 2

Assume a `RowOrColumn` has size 100 pixels after splitter sizes have been subtracted.

Child | Size      | Pixels
------|-----------|-------
1     | undefined | 25
2     | undefined | 25
3     | undefined | 25
4     | undefined | 25

If a size is undefined, then it defaults to 1fr.  If all sizes are undefined, then the `RowOrColumn` size is equally divided amongst all children (as much as possible).

## Minimum Size

