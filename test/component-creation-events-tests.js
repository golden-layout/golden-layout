describe('emits events when components are created', () => {
  let layout,
    eventListener = window.jasmine.createSpyObj('eventListener', ['show', 'shown']);

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
          ],
        },
      ],
    });

    function Recorder(container) {
      container.getElement().html('that worked');
      container.on('show', eventListener.show);
      container.on('shown', eventListener.shown);
    }

    layout.registerComponent('testComponent', Recorder);
  });

  it('registers listeners', () => {
    expect(eventListener.show).not.toHaveBeenCalled();
    expect(eventListener.shown).not.toHaveBeenCalled();

    layout.init();
  });

  it('has called listeners', () => {
    expect(eventListener.show.calls).toHaveLength(1);
    expect(eventListener.shown.calls).toHaveLength(1);
  });

  it('destroys the layout', () => {
    layout.destroy();
  });
});
