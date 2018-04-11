const GoldenLayout = require('../dist/goldenlayout');
const testTools = require('./test.tools.js');

describe('emits events when items are created', () => {
  const onItemCreated = jest.fn();
  const onStackCreated = jest.fn();
  const onComponentCreated = jest.fn();
  const onRowCreated = jest.fn();
  const onColumnCreated = jest.fn();
  let layout;

  test('creates a layout', () => {
    layout = new GoldenLayout({
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

    layout.registerComponent('testComponent', testTools.TestComponent);
  });

  test('registeres listeners', () => {
    expect(onItemCreated).not.toHaveBeenCalled();
    expect(onStackCreated).not.toHaveBeenCalled();
    expect(onRowCreated).not.toHaveBeenCalled();
    expect(onColumnCreated).not.toHaveBeenCalled();
    expect(onComponentCreated).not.toHaveBeenCalled();

    layout.on('itemCreated', onItemCreated);
    layout.on('stackCreated', onStackCreated);
    layout.on('rowCreated', onRowCreated);
    layout.on('columnCreated', onColumnCreated);
    layout.on('componentCreated', onComponentCreated);

    layout.init();
  });

  test('has called listeners', () => {
    expect(onItemCreated.mock.calls).toHaveLength(6);
    expect(onStackCreated.mock.calls).toHaveLength(2);
    expect(onRowCreated.mock.calls).toHaveLength(1);
    expect(onColumnCreated.mock.calls).toHaveLength(1);
    expect(onComponentCreated.mock.calls).toHaveLength(1);
  });

  test('provided the right arguments', () => {
    expect(onComponentCreated.mock.calls[0][0].type).toEqual('component');
    expect(onStackCreated.mock.calls[0][0].type).toEqual('stack');
    expect(onColumnCreated.mock.calls[0][0].type).toEqual('column');
    expect(onRowCreated.mock.calls[0][0].type).toEqual('row');
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
