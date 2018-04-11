describe('Creates the right structure based on the provided config', () => {
  const createLayout = function(config) {
    const myLayout = new window.GoldenLayout(config);

    myLayout.registerComponent('testComponent', container => {
      container.getElement().html('that worked');
    });

    myLayout.init();

    return myLayout;
  };

  it('creates the right primitive types: component only', () => {
    let layout;

    runs(() => {
      layout = createLayout({
        content: [
          {
            type: 'component',
            componentName: 'testComponent',
          },
        ],
      });
    });

    waitsFor(() => layout.isInitialised);

    runs(() => {
      expect(layout.isInitialised).toBe(true);
      expect(layout.root.isRoot).toBe(true);
      expect(layout.root.contentItems).toHaveLength(1);
      expect(layout.root.contentItems[0].isStack).toBe(true);
      expect(layout.root.contentItems[0].contentItems[0].isComponent).toBe(true);
    });

    runs(() => {
      layout.destroy();
    });
  });

  it('creates the right primitive types: stack and component', () => {
    let layout;

    runs(() => {
      layout = createLayout({
        content: [
          {
            type: 'stack',
            content: [
              {
                type: 'component',
                componentName: 'testComponent',
              },
            ],
          },
        ],
      });
    });

    waitsFor(() => layout.isInitialised);

    runs(() => {
      expect(layout.isInitialised).toBe(true);
      expect(layout.root.isRoot).toBe(true);
      expect(layout.root.contentItems).toHaveLength(1);
      expect(layout.root.contentItems[0].isStack).toBe(true);
      expect(layout.root.contentItems[0].contentItems[0].isComponent).toBe(true);
    });

    runs(() => {
      layout.destroy();
    });
  });

  it('creates the right primitive types: row and two component', () => {
    let layout;

    runs(() => {
      layout = createLayout({
        content: [
          {
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
          },
        ],
      });
    });

    waitsFor(() => layout.isInitialised);

    runs(() => {
      expect(layout.isInitialised).toBe(true);
      expect(layout.root.contentItems).toHaveLength(1);
      expect(layout.root.contentItems[0].isRow).toBe(true);
      expect(layout.root.contentItems[0].contentItems[0].isStack).toBe(true);
      expect(layout.root.contentItems[0].contentItems[1].isStack).toBe(true);
      expect(layout.root.contentItems[0].contentItems).toHaveLength(2);
      expect(layout.root.contentItems[0].contentItems[0].contentItems[0].isComponent).toBe(true);
      expect(layout.root.contentItems[0].contentItems[1].contentItems[0].isComponent).toBe(true);
    });

    runs(() => {
      layout.destroy();
    });
  });

  it('creates the right primitive types: stack -> column -> component', () => {
    let layout;

    runs(() => {
      layout = createLayout({
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
    });

    waitsFor(() => layout.isInitialised);

    runs(() => {
      expect(layout.isInitialised).toBe(true);

      expect(layout.root.contentItems).toHaveLength(1);
      expect(layout.root.contentItems[0].isStack).toBe(true);

      expect(layout.root.contentItems[0].contentItems).toHaveLength(1);
      expect(layout.root.contentItems[0].contentItems[0].isColumn).toBe(true);

      expect(layout.root.contentItems[0].contentItems[0].contentItems).toHaveLength(1);
      expect(layout.root.contentItems[0].contentItems[0].contentItems[0].isStack).toBe(true);

      expect(layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems).toHaveLength(
        1
      );
      expect(
        layout.root.contentItems[0].contentItems[0].contentItems[0].contentItems[0].isComponent
      ).toBe(true);
    });

    runs(() => {
      layout.destroy();
    });
  });
});
