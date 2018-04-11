const GoldenLayout = require('../dist/goldenlayout');
const waitsFor = require('./awaits');

describe("Sets and retrieves a component's state", () => {
  let myLayout, myComponent;

  test('Can create a most basic layout', async () => {
    myLayout = new GoldenLayout({
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

    await waitsFor(() => myLayout.isInitialised);

    expect(myComponent.state.testValue).toBe('initial');
  });

  test('returns the initial state', () => {
    const config = myLayout.toConfig();
    expect(config.content[0].content[0].componentState.testValue).toBe('initial');
  });

  test('emits stateChanged when a component updates its state', async () => {
    let stateChanges = 0;

    myLayout.on('stateChanged', () => {
      stateChanges++;
    });

    myComponent.container.setState({ testValue: 'updated' });

    await waitsFor(() => stateChanges !== 0);

    expect(stateChanges).toBe(1);
  });

  test('returns the updated state', () => {
    const config = myLayout.toConfig();
    expect(config.content[0].content[0].componentState.testValue).toBe('updated');
  });

  test('Destroys the layout', () => {
    myLayout.destroy();
    expect(myLayout.root.contentItems).toHaveLength(0);
  });
});
