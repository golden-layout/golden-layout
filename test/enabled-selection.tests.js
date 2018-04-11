const testTools = require('./test.tools.js');

describe('content items are abled to to emit events that bubble up the tree', () => {
  let layout, stackA, stackB;
  const onselectionChanged = jest.fn();

  test('creates a layout', async () => {
    layout = await testTools.createLayout({
      settings: {
        selectionEnabled: true,
      },
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

  test('clicks a header and it selects a stack', () => {
    const headerElement = stackA.element.find('.lm_header');
    expect(headerElement).toHaveLength(1);
    expect(onselectionChanged.mock.calls).toHaveLength(0);
    expect(layout.selectedItem).toBe(null);
    expect(headerElement.hasClass('lm_selectable')).toBe(true);
    expect(stackA.element.hasClass('lm_selected')).toBe(false);

    headerElement.trigger('click');

    expect(onselectionChanged.mock.calls).toHaveLength(1);
    expect(layout.selectedItem).toBe(stackA);
    expect(stackA.element.hasClass('lm_selected')).toBe(true);
  });

  test('clicks changes selection', () => {
    const headerElement = stackB.element.find('.lm_header');
    expect(headerElement).toHaveLength(1);
    expect(onselectionChanged.mock.calls).toHaveLength(1);
    expect(layout.selectedItem).toBe(stackA);
    expect(headerElement.hasClass('lm_selectable')).toBe(true);
    expect(stackA.element.hasClass('lm_selected')).toBe(true);

    headerElement.trigger('click');

    expect(onselectionChanged.mock.calls).toHaveLength(2);
    expect(layout.selectedItem).toBe(stackB);
    expect(stackA.element.hasClass('lm_selected')).toBe(false);
    expect(stackB.element.hasClass('lm_selected')).toBe(true);
  });

  test('changes selection programatically', () => {
    const headerElement = stackA.element.find('.lm_header');
    expect(headerElement).toHaveLength(1);
    expect(onselectionChanged.mock.calls).toHaveLength(2);
    expect(layout.selectedItem).toBe(stackB);
    expect(headerElement.hasClass('lm_selectable')).toBe(true);
    expect(stackA.element.hasClass('lm_selected')).toBe(false);

    layout.selectItem(stackA);

    expect(onselectionChanged.mock.calls).toHaveLength(4);
    expect(layout.selectedItem).toBe(stackA);
    expect(stackA.element.hasClass('lm_selected')).toBe(true);
    expect(stackB.element.hasClass('lm_selected')).toBe(false);
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
