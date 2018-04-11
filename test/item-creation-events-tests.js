describe('emits events when items are created', () => {
  let layout,
    eventListener = window.jasmine.createSpyObj('eventListener', [
      'onItemCreated',
      'onStackCreated',
      'onComponentCreated',
      'onRowCreated',
      'onColumnCreated',
    ]);

  it('creates a layout', () => {
    layout = new window.GoldenLayout({
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

  it('registeres listeners', () => {
    expect(eventListener.onItemCreated).not.toHaveBeenCalled();
    expect(eventListener.onStackCreated).not.toHaveBeenCalled();
    expect(eventListener.onRowCreated).not.toHaveBeenCalled();
    expect(eventListener.onColumnCreated).not.toHaveBeenCalled();
    expect(eventListener.onComponentCreated).not.toHaveBeenCalled();

    layout.on('itemCreated', eventListener.onItemCreated);
    layout.on('stackCreated', eventListener.onStackCreated);
    layout.on('rowCreated', eventListener.onRowCreated);
    layout.on('columnCreated', eventListener.onColumnCreated);
    layout.on('componentCreated', eventListener.onComponentCreated);

    layout.init();
  });

  it('has called listeners', () => {
    expect(eventListener.onItemCreated.calls).toHaveLength(6);
    expect(eventListener.onStackCreated.calls).toHaveLength(2);
    expect(eventListener.onRowCreated.calls).toHaveLength(1);
    expect(eventListener.onColumnCreated.calls).toHaveLength(1);
    expect(eventListener.onComponentCreated.calls).toHaveLength(1);
  });

  it('provided the right arguments', () => {
    expect(eventListener.onComponentCreated.mostRecentCall.args[0].type).toEqual('component');
    expect(eventListener.onStackCreated.mostRecentCall.args[0].type).toEqual('stack');
    expect(eventListener.onColumnCreated.mostRecentCall.args[0].type).toEqual('column');
    expect(eventListener.onRowCreated.mostRecentCall.args[0].type).toEqual('row');
  });

  it('destroys the layout', () => {
    layout.destroy();
  });
});
