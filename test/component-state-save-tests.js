describe("Sets and retrieves a component's state", () => {
  let myLayout, myComponent;

  it('Can create a most basic layout', () => {
    runs(() => {
      myLayout = new window.GoldenLayout({
        content: [
          {
            type: 'component',
            componentName: 'testComponent',
            componentState: { testValue: 'initial' },
          },
        ],
      });

      myLayout.registerComponent('testComponent', function(container, state) {
        this.container = container;
        this.state = state;
        myComponent = this;
      });

      myLayout.init();
    });

    waitsFor(() => myLayout.isInitialised);

    runs(() => {
      expect(myComponent.state.testValue).toBe('initial');
    });
  });

  it('returns the initial state', () => {
    const config = myLayout.toConfig();
    expect(config.content[0].content[0].componentState.testValue).toBe('initial');
  });

  it('emits stateChanged when a component updates its state', () => {
    let stateChanges = 0;

    myLayout.on('stateChanged', () => {
      stateChanges++;
    });

    runs(() => {
      myComponent.container.setState({ testValue: 'updated' });
    });

    waitsFor(() => stateChanges !== 0);

    runs(() => {
      expect(stateChanges).toBe(1);
    });
  });

  it('returns the updated state', () => {
    const config = myLayout.toConfig();
    expect(config.content[0].content[0].componentState.testValue).toBe('updated');
  });

  it('Destroys the layout', () => {
    myLayout.destroy();
    expect(myLayout.root.contentItems).toHaveLength(0);
  });
});
