const testTools = require('./test.tools.js');
const $ = require('jquery');

describe('supports drag creation', () => {
  let layout, dragSrc;

  test('creates a layout', async () => {
    layout = await testTools.createLayout({
      content: [
        {
          type: 'stack',
          content: [
            {
              type: 'component',
              componentState: { html: '<div id="dragsource"></div>' },
              componentName: 'testComponent',
            },
          ],
        },
      ],
    });

    expect(layout.isInitialised).toBe(true);
  });

  test('creates a drag source', () => {
    dragSrc = layout.root.contentItems[0].element.find('#dragsource');
    expect(dragSrc).toHaveLength(1);

    layout.createDragSource(dragSrc, {
      type: 'component',
      componentState: { html: '<div class="dragged"></div>' },
      componentName: 'testComponent',
    });
  });

  test('creates a new components if dragged', () => {
    expect($('.dragged')).toHaveLength(0);

    let mouse = $.Event('mousedown');
    mouse.pageX = dragSrc.position().left;
    mouse.pageY = dragSrc.position().top;
    mouse.button = 0;
    dragSrc.trigger(mouse);

    mouse = $.Event('mousemove');
    mouse.pageX = dragSrc.position().left + 50;
    mouse.pageY = dragSrc.position().top + 50;
    dragSrc.trigger(mouse);

    dragSrc.trigger('mouseup');

    expect($('.dragged')).toHaveLength(1);
    const node = testTools.verifyPath('row.0', layout, expect);
    expect(node.element.find('.dragged')).toHaveLength(1);
  });

  test('destroys the layout', () => {
    layout.destroy();
  });
});
