const testTools = require('./test.tools.js');

describe('tabs apply their configuration', () => {
  let layout;

  test('creates a layout', async () => {
    layout = await testTools.createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              reorderEnabled: false,
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  test('attached a drag listener to the first tab', () => {
    let item1 = layout.root.contentItems[0].contentItems[0],
      item2 = layout.root.contentItems[0].contentItems[1],
      header = layout.root.contentItems[0].header;

    expect(header.tabs).toHaveLength(2);

    expect(item1.type).toBe('component');
    expect(item1.config.reorderEnabled).toBe(true);
    expect(header.tabs[0]._dragListener).toBeDefined();

    expect(item2.type).toBe('component');
    expect(item2.config.reorderEnabled).toBe(false);
    expect(header.tabs[1]._dragListener).not.toBeDefined();
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
