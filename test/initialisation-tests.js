describe('Can initialise the layoutmanager', () => {
  let myLayout;

  it('Finds the layoutmanager on the global namespace', () => {
    expect(window.GoldenLayout).toBeDefined();
  });

  it('Can create a most basic layout', () => {
    myLayout = new window.GoldenLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });

    myLayout.registerComponent('testComponent', container => {
      container.getElement().html('that worked');
    });

    myLayout.init();
    expect($('.lm_goldenlayout')).toHaveLength(1);
    testTools.verifyPath('stack.0.component', myLayout, expect);
  });

  it('Destroys the layout', () => {
    myLayout.destroy();
    expect(myLayout.root.contentItems).toHaveLength(0);
  });
});
