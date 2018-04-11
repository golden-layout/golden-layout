const GoldenLayout = require('../dist/goldenlayout');
const waitsFor = require('./awaits');

describe('Creates the right structure based on the provided config', async () => {
  const createLayout = function(config) {
    const myLayout = new GoldenLayout(config);
    const TestComponent = ({ label }) => label;

    myLayout.registerComponent('test-component', TestComponent);

    myLayout.init();

    return myLayout;
  };

  test('creates the right primitive types: component only', async () => {
    const layout = createLayout({
      content: [
        {
          type: 'react-component',
          component: 'test-component',
          props: { label: 'A' },
        },
      ],
    });

    await waitsFor(() => layout.isInitialised);

    expect(layout.isInitialised).toBe(true);
    expect(layout.root.isRoot).toBe(true);
    expect(layout.root.contentItems).toHaveLength(1);
    expect(layout.root.contentItems[0].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems[0].isComponent).toBe(true);

    layout.destroy();
  });

  test('creates the right primitive types: stack and component', async () => {
    const layout = createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'react-component',
              component: 'test-component',
              props: { label: 'A' },
            },
          ],
        },
      ],
    });

    await waitsFor(() => layout.isInitialised);

    expect(layout.isInitialised).toBe(true);
    expect(layout.root.isRoot).toBe(true);
    expect(layout.root.contentItems).toHaveLength(1);
    expect(layout.root.contentItems[0].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems[0].isComponent).toBe(true);

    layout.destroy();
  });

  test('creates the right primitive types: row and two component', async () => {
    const layout = createLayout({
      content: [
        {
          type: 'row',
          content: [
            {
              type: 'react-component',
              component: 'test-component',
              props: { label: 'A' },
            },
            {
              type: 'react-component',
              component: 'test-component',
              props: { label: 'A' },
            },
          ],
        },
      ],
    });

    await waitsFor(() => layout.isInitialised);

    expect(layout.isInitialised).toBe(true);
    expect(layout.root.contentItems).toHaveLength(1);
    expect(layout.root.contentItems[0].isRow).toBe(true);
    expect(layout.root.contentItems[0].contentItems[0].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems[1].isStack).toBe(true);
    expect(layout.root.contentItems[0].contentItems).toHaveLength(2);
    expect(layout.root.contentItems[0].contentItems[0].contentItems[0].isComponent).toBe(true);
    expect(layout.root.contentItems[0].contentItems[1].contentItems[0].isComponent).toBe(true);

    layout.destroy();
  });

  test('creates the right primitive types: stack -> column -> component', async () => {
    const layout = createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'column',
              content: [
                {
                  type: 'react-component',
                  component: 'test-component',
                  props: { label: 'A' },
                },
              ],
            },
          ],
        },
      ],
    });

    await waitsFor(() => layout.isInitialised);

    expect(layout.isInitialised).toBe(true);

    expect(layout.root.contentItems).toHaveLength(1);
    expect(layout.root.contentItems[0].isStack).toBe(true);

    expect(layout.root.contentItems[0].contentItems).toHaveLength(1);
    expect(layout.root.contentItems[0].contentItems[0].isColumn).toBe(true);

    expect(layout.root.contentItems[0].contentItems[0].contentItems).toHaveLength(1);
    expect(layout.root.contentItems[0].contentItems[0].contentItems[0].isStack).toBe(true);

    expect(layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems).toHaveLength(
      1
    );
    expect(
      layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems[0].isComponent
    ).toBe(true);

    layout.destroy();
  });
});
