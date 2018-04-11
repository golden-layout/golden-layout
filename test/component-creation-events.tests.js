const GoldenLayout = require('../dist/goldenlayout');

describe('emits events when components are created', () => {
  let layout;
  const show = jest.fn();
  const shown = jest.fn();

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
          ],
        },
      ],
    });

    function Recorder(container) {
      container.getElement().html('that worked');
      container.on('show', show);
      container.on('shown', shown);
    }

    layout.registerComponent('testComponent', Recorder);
  });

  test('registers listeners', () => {
    expect(show).not.toHaveBeenCalled();
    expect(shown).not.toHaveBeenCalled();

    layout.init();
  });

  test('has called listeners', () => {
    expect(show.mock.calls).toHaveLength(1);
    expect(shown.mock.calls).toHaveLength(1);
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
