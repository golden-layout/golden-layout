describe('it is possible to select elements from the tree using selectors', () => {
  let layout;

  it('creates a layout with elements that have ids', () => {
    const config = {
      content: [
        {
          type: 'column',
          content: [
            {
              type: 'component',
              id: 'simpleStringId',
              componentName: 'testComponent',
            },
            {
              type: 'column',
              id: ['outerColumn', 'groupA', 'groupB'],
              content: [
                {
                  type: 'column',
                  id: ['groupB'],
                },
              ],
            },
          ],
        },
      ],
    };
    layout = testTools.createLayout(config);
    testTools.verifyPath('column.0.stack.0.component', layout, expect);
    testTools.verifyPath('column.1.column.0.column', layout, expect);
  });

  it('finds an item by string id', () => {
    expect(layout.isInitialised).toBe(true);
    const items = layout.root.getItemsById('simpleStringId');
    expect(items).toHaveLength(1);
    expect(items[0].isComponent).toBe(true);
  });

  it('returns an empty array if no item was found for id', () => {
    const items = layout.root.getItemsById('doesNotExist');
    expect(items instanceof Array).toBe(true);
    expect(items).toHaveLength(0);
  });

  it('finds items by an id from an array', () => {
    let items = layout.root.getItemsById('groupB');
    expect(items).toHaveLength(2);

    items = layout.root.getItemsById('groupA');
    expect(items).toHaveLength(1);
  });

  it('finds items by type', () => {
    const items = layout.root.getItemsByType('column');
    expect(items).toHaveLength(3);
    expect(items[0].type).toBe('column');
    expect(items[1].type).toBe('column');
  });

  it('returns an empty array if no item was found for type', () => {
    const items = layout.root.getItemsByType('row');
    expect(items instanceof Array).toBe(true);
    expect(items).toHaveLength(0);
  });

  it('finds the component instance by name', () => {
    const components = layout.root.getComponentsByName('testComponent');
    expect(components).toHaveLength(1);
    expect(components[0].isTestComponentInstance).toBe(true);
  });

  it('allows for chaining', () => {
    const innerColumns = layout.root.getItemsById('outerColumn')[0].getItemsByType('column');

    expect(innerColumns).toHaveLength(1);
    expect(innerColumns[0].type).toBe('column');
  });
});
