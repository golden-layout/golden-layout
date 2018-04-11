describe('content items are abled to to emit events that bubble up the tree', () => {
  let layout;

  it('creates a layout', () => {
    layout = testTools.createLayout({
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

    testTools.verifyPath('stack.0.column.0.stack.0.component', layout, expect);
    testTools.verifyPath('stack.1.row', layout, expect);
  });

  it('emits bubbling events', () => {
    let invocations = [],
      eventName = 'eventA',
      hasReachedLayout = false;

    runs(() => {
      layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems[0].on(
        eventName,
        () => {
          invocations.push('component');
        }
      );

      layout.root.contentItems[0].contentItems[0].contentItems[0].on(eventName, () => {
        invocations.push('stackBottom');
      });

      layout.root.contentItems[0].contentItems[0].on(eventName, () => {
        invocations.push('column');
      });

      layout.root.contentItems[0].on(eventName, () => {
        invocations.push('stackTop');
      });

      layout.root.on(eventName, event => {
        invocations.push('root');
        expect(event.origin.type).toBe('component');
      });

      layout.on(eventName, () => {
        hasReachedLayout = true;
        invocations.push('layout');
      });

      layout.root.getItemsByType('row')[0].on(eventName, () => {
        expect('this').toBe('never called');
      });

      layout.root.getItemsByType('component')[0].emitBubblingEvent(eventName);
    });

    waitsFor(() => hasReachedLayout);

    runs(() => {
      expect(invocations).toHaveLength(6);
      expect(invocations[0]).toBe('component');
      expect(invocations[1]).toBe('stackBottom');
      expect(invocations[2]).toBe('column');
      expect(invocations[3]).toBe('stackTop');
      expect(invocations[4]).toBe('root');
      expect(invocations[5]).toBe('layout');
    });
  });

  it('stops propagation', () => {
    let invocations = [],
      eventName = 'eventB';

    layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems[0].on(
      eventName,
      () => {
        invocations.push('component');
      }
    );

    layout.root.contentItems[0].contentItems[0].contentItems[0].on(eventName, () => {
      invocations.push('stackBottom');
    });

    layout.root.contentItems[0].contentItems[0].on(eventName, event => {
      event.stopPropagation();
      invocations.push('column');
    });

    layout.root.contentItems[0].on(eventName, () => {
      invocations.push('stackTop');
    });

    layout.root.on(eventName, () => {
      invocations.push('root');
    });

    layout.on(eventName, () => {
      invocations.push('layout');
    });

    layout.root.getItemsByType('component')[0].emitBubblingEvent(eventName);

    expect(invocations).toHaveLength(3);
    expect(invocations[0]).toBe('component');
    expect(invocations[1]).toBe('stackBottom');
    expect(invocations[2]).toBe('column');
  });

  it('destroys the layout', () => {
    layout.destroy();
  });
});
