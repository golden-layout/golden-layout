const GoldenLayout = require('../dist/goldenlayout');
const testTools = require('./test.tools.js');
const { document } = require('global');

const TestComponent = ({ label }) => label;

describe('Can initialise the layoutmanager', async () => {
  let myLayout;

  test('Finds the layoutmanager on the global namespace', () => {
    expect(GoldenLayout).toBeDefined();
  });

  test('Can create a most basic layout', async () => {
    myLayout = new GoldenLayout({
      content: [
        {
          type: 'react-component',
          component: 'test-component',
          props: { label: 'A' },
        },
      ],
    });
    myLayout.registerComponent('test-component', TestComponent);

    myLayout.init();

    expect(document.querySelectorAll('.lm_goldenlayout')).toHaveLength(1);

    await testTools.verifyPath('stack.0.component', myLayout, expect);
  });

  test('Destroys the layout', () => {
    myLayout.destroy();
    expect(myLayout.root.contentItems).toHaveLength(0);
  });
});
