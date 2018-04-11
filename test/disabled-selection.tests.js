const testTools = require('./test.tools.js');

describe('content items are abled to to emit events that bubble up the tree', () => {
  let layout, stackA, stackB;
  const onselectionChanged = jest.fn();

  test('creates a layout', async () => {
    layout = await testTools.createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'column',
              content: [
                {
                  type: 'component',
                  componentName: 'testComponent',
                  id: 'test',
                },
                {
                  type: 'component',
                  componentName: 'testComponent',
                  id: 'test',
                },
              ],
            },
            {
              type: 'row',
            },
          ],
        },
      ],
    });
    expect(layout.isInitialised).toBe(true);
    testTools.verifyPath('stack.0.column.0.stack.0.component', layout, expect);
    testTools.verifyPath('stack.1.row', layout, expect);
  });

  test('attaches event listeners and retrieves stacks', () => {
    const components = layout.root.getItemsById('test');

    expect(components).toHaveLength(2);

    stackA = components[0].parent;
    stackB = components[1].parent;

    expect(stackA.type).toBe('stack');
    expect(stackB.type).toBe('stack');

    layout.on('selectionChanged', onselectionChanged);
  });

  test('clicks a header, but nothing happens since enableSelection == false', () => {
    const headerElement = stackA.element.find('.lm_header');

    expect(headerElement).toHaveLength(1);
    expect(onselectionChanged.mock.calls).toHaveLength(0);
    expect(layout.selectedItem).toBe(null);
    expect(headerElement.hasClass('lm_selectable')).toBe(false);

    headerElement.trigger('click');

    expect(onselectionChanged.mock.calls).toHaveLength(0);
    expect(layout.selectedItem).toBe(null);
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
