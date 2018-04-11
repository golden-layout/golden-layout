const testTools = require('./test.tools.js');

describe('The layout can handle empty stacks', () => {
  let myLayout;

  test('Creates an initial layout', async () => {
    myLayout = await testTools.createLayout({
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 1' },
            },
            {
              type: 'component',
              componentName: 'testComponent',
              componentState: { text: 'Component 2' },
            },
            {
              isClosable: false,
              type: 'stack',
              content: [],
            },
          ],
        },
      ],
    });
  });

  test('can manipulate the layout tree with an empty item present', () => {
    const row = myLayout.root.contentItems[0];
    expect(row.isRow).toBe(true);

    row.addChild({
      type: 'component',
      componentName: 'testComponent',
    });
  });

  test('can add children to the empty stack', () => {
    const stack = myLayout.root.contentItems[0].contentItems[2];
    expect(stack.isStack).toBe(true);
    expect(stack.contentItems).toHaveLength(0);

    stack.addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    expect(stack.contentItems).toHaveLength(1);
  });

  test('destroys the layout', () => {
    myLayout.destroy();
  });
});
