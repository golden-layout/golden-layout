const testTools = require('./test.tools.js');
const waitsFor = require('./awaits');

describe('it can popout components into browserwindows', () => {
  let layout, browserPopout;

  test('creates a layout', async () => {
    layout = await testTools.createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentA',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'componentB',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  /**
   * TODO Run this in a more browserlike environment so it's not blocked
   */
  xit('opens testComponent in a new window', () => {
    expect(layout.openPopouts).toHaveLength(0);
    const component = layout.root.getItemsById('componentA')[0];
    browserPopout = component.popout();

    expect(browserPopout.getWindow().closed).toBe(false);
    expect(layout.openPopouts).toHaveLength(1);
  });

  /**
   * TODO This test doens't run since karma injects
   * all sorts of stuff into the new window which throws errors
   * before GoldenLayout can initialise...
   */
  /* global xit */
  xit('serialises the new window', async () => {
    expect(layout.openPopouts).toHaveLength(1);

    await waitsFor(() => layout.openPopouts[0].isInitialised);

    const config = layout.toConfig();
    expect(config.openPopouts).toHaveLength(1);
    expect(typeof config.openPopouts[0].left).toBe('number');
    expect(typeof config.openPopouts[0].top).toBe('number');
    expect(config.openPopouts[0].width > 0).toBe(true);
    expect(config.openPopouts[0].height > 0).toBe(true);
    expect(config.openPopouts[0].config.content[0].type).toBe('component');
  });

  xit('closes the open window', async () => {
    browserPopout.close();

    await waitsFor(() => browserPopout.getWindow().closed && layout.openPopouts.length === 0);
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
