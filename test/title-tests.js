describe('content items are abled to to emit events that bubble up the tree', () => {
  let layout, itemWithTitle, itemWithoutTitle, stack;

  it('creates a layout', () => {
    layout = testTools.createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentName: 'testComponent',
              title: 'First Title',
              id: 'hasTitle',
            },
            {
              type: 'component',
              componentName: 'testComponent',
              id: 'noTitle',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  it('applies titles from configuration', () => {
    itemWithTitle = layout.root.getItemsById('hasTitle')[0];
    itemWithoutTitle = layout.root.getItemsById('noTitle')[0];

    expect(itemWithTitle.config.title).toBe('First Title');
    expect(itemWithoutTitle.config.title).toBe('testComponent');
  });

  it('displays the title on the tab', () => {
    stack = layout.root.getItemsByType('stack')[0];
    expect(stack.header.tabs).toHaveLength(2);
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe('First Title');
    expect(stack.header.tabs[1].element.find('.lm_title').html()).toBe('testComponent');
  });

  it('updates the title when calling setTitle on the item', () => {
    itemWithTitle.setTitle('Second Title');
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe('Second Title');
  });

  it('updates the title when calling setTitle from the container', () => {
    itemWithTitle.container.setTitle('Third Title');
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe('Third Title');
  });

  it('Persists the title', () => {
    expect(layout.toConfig().content[0].content[0].title).toBe('Third Title');
  });

  it('supports html in title', () => {
    itemWithTitle.container.setTitle('title <b>with</b> html');
    expect(stack.header.tabs[0].element.find('.lm_title').html()).toBe('title <b>with</b> html');
    expect(stack.header.tabs[0].element.find('.lm_title').text()).toBe('title with html');
    expect(stack.header.tabs[0].element.attr('title')).toBe('title with html');
  });

  it('destroys the layout', () => {
    layout.destroy();
  });
});
