describe('The layout can be manipulated at runtime', () => {
  let myLayout;

  it('Creates an initial layout', () => {
    myLayout = testTools.createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });
  });

  it('has the right initial structure', () => {
    testTools.verifyPath('stack.0.component', myLayout, expect);
  });

  it('adds a child to the stack', () => {
    myLayout.root.contentItems[0].addChild({
      type: 'component',
      componentName: 'testComponent',
    });

    expect(myLayout.root.contentItems[0].contentItems).toHaveLength(2);
    testTools.verifyPath('stack.1.component', myLayout, expect);
  });

  it('replaces a component with a row of components', () => {
    const oldChild = myLayout.root.contentItems[0].contentItems[1];
    const newChild = {
      type: 'row',
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    };

    myLayout.root.contentItems[0].replaceChild(oldChild, newChild);

    testTools.verifyPath('stack.1.row.0.stack.0.component', myLayout, expect);
    testTools.verifyPath('stack.1.row.1.stack.0.component', myLayout, expect);
  });

  it('Has setup parents correctly', () => {
    const component = testTools.verifyPath('stack.1.row.1.stack.0.component', myLayout, expect);
    expect(component.isComponent).toBe(true);
    expect(component.parent.isStack).toBe(true);
    expect(component.parent.parent.isRow).toBe(true);
    expect(component.parent.parent.parent.isStack).toBe(true);
    expect(component.parent.parent.parent.parent.isRoot).toBe(true);
  });

  it('Destroys a component and its parent', () => {
    const stack = testTools.verifyPath('stack.1.row.1.stack', myLayout, expect);
    expect(stack.contentItems).toHaveLength(1);
    stack.contentItems[0].remove();
    expect(stack.contentItems).toHaveLength(0);
  });
});
