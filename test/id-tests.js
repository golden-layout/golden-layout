describe('Dynamic ids work properly', () => {
  let layout, item;

  it('creates a layout', () => {
    layout = testTools.createLayout({
      content: [
        {
          type: 'component',
          componentName: 'testComponent',
        },
      ],
    });
  });

  it('finds the item', () => {
    item = layout.root.contentItems[0].contentItems[0];
    expect(item.isComponent).toBe(true);
  });

  it('has no id initially', () => {
    expect(item.config.id).toBe(undefined);
    expect(item.hasId('id_1')).toBe(false);
    expect(item.hasId('id_2')).toBe(false);
  });

  it('adds the first id as a string', () => {
    item.addId('id_1');
    expect(item.hasId('id_1')).toBe(true);
    expect(item.hasId('id_2')).toBe(false);
    expect(item.config.id).toBe('id_1');
    expect(layout.root.getItemsById('id_1')[0]).toBe(item);
  });

  it('adds the second id to an array', () => {
    item.addId('id_2');
    expect(item.config.id instanceof Array).toBe(true);
    expect(item.config.id).toHaveLength(2);
    expect(item.config.id[0]).toBe('id_1');
    expect(item.config.id[1]).toBe('id_2');
    expect(item.hasId('id_1')).toBe(true);
    expect(item.hasId('id_2')).toBe(true);
    expect(layout.root.getItemsById('id_1')[0]).toBe(item);
    expect(layout.root.getItemsById('id_2')[0]).toBe(item);
  });

  it('doesn\t add duplicated ids', () => {
    item.addId('id_2');
    expect(item.config.id instanceof Array).toBe(true);
    expect(item.config.id).toHaveLength(2);
    expect(item.config.id[0]).toBe('id_1');
    expect(item.config.id[1]).toBe('id_2');
    expect(layout.root.getItemsById('id_1')[0]).toBe(item);
    expect(layout.root.getItemsById('id_2')[0]).toBe(item);
  });

  it('removes ids', () => {
    item.removeId('id_2');
    expect(item.hasId('id_1')).toBe(true);
    expect(item.hasId('id_2')).toBe(false);
    expect(item.config.id).toHaveLength(1);
  });

  it('throws error when trying to remove a non-existant id', () => {
    let error;

    try {
      item.removeId('id_2');
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
  });

  it('destroys the layout', () => {
    layout.destroy();
  });
});
