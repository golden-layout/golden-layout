
$(function () {
  var queryParams = getQueryParams();
  var layout = queryParams.layout || '';
  var config = null;
  switch (layout.toLowerCase()) {
    case 'responsive':
      config = createResponsiveConfig();
      break;
    case 'tab-dropdown':
      config = createTabDropdownConfig();
      break;
    default:
      config = createStandardConfig();
      break;
  }

  window.myLayout = new GoldenLayout(config);

  myLayout.registerComponent('hey', function (container, state) {
    if (state.bg) {
      container
        .getElement()
        .text('hey');
    }
  });

  myLayout.init();

  function getQueryParams() {
    var params = {};
    window.location.search.replace(/^\?/, '').split('&').forEach(function(pair) {
      var parts = pair.split('=');
      if (parts.length > 1) {
        params[decodeURIComponent(parts[0]).toLowerCase()] = decodeURIComponent(parts[1]);
      }
    });

    return params;
  }

  function createStandardConfig() {
    return {
      content: [
        {
          type: 'row',
          content: [
          {
            width: 80,
            type: 'column',
            content: [
              {
                title: 'Fnts 100',
                type: 'component',
                componentName: 'hey',
              },
              {
                type: 'row',
                content: [
                  {
                    type: 'component',
                    title: 'Golden',
                    componentName: 'hey',
                    width: 30,
                    componentState: { bg: 'golden_layout_spiral.png' }
                  },
                  {
                    title: 'Layout',
                    type: 'component',
                    componentName: 'hey',
                    componentState: { bg: 'golden_layout_text.png' }
                  }
                ]
              },
              {
                type: 'stack',
                content: [
                  {
                    type: 'component',
                    title: 'Acme, inc.',
                    componentName: 'hey',
                    componentState: {
                      companyName: 'Stock X'
                    }
                  },
                  {

                    type: 'component',
                    title: 'LexCorp plc.',
                    componentName: 'hey',
                    componentState: {
                      companyName: 'Stock Y'
                    }
                  },
                  {
                    type: 'component',
                    title: 'Springshield plc.',
                    componentName: 'hey',
                    componentState: {
                      companyName: 'Stock Z'
                    }
                  }
                ]
              }
            ]
          },
            {
              width: 20,
              type: 'column',
              content: [
                {
                  type: 'component',
                  title: 'Performance',
                  componentName: 'hey'
                },
                {
                  height: 40,
                  type: 'component',
                  title: 'Market',
                  componentName: 'hey'
                }
              ]
            }
          ]
        }
      ]
    };
  }

  function createResponsiveConfig() {
    return {
        settings: {
          responsive: true
        },
        dimensions: {
          minItemWidth: 250
        },
        content: [
          {
            type: 'row',
            content: [
            {
              width: 30,
              type: 'column',
              content: [
                {
                  title: 'Fnts 100',
                  type: 'component',
                  componentName: 'hey',
                },
                {
                  type: 'row',
                  content: [
                    {
                      type: 'component',
                      title: 'Golden',
                      componentName: 'hey',
                      width: 30,
                      componentState: { bg: 'golden_layout_spiral.png' }
                    }
                  ]
                },
                {
                  type: 'stack',
                  content: [
                    {
                      type: 'component',
                      title: 'Acme, inc.',
                      componentName: 'hey',
                      componentState: {
                        companyName: 'Stock X'
                      }
                    },
                    {

                      type: 'component',
                      title: 'LexCorp plc.',
                      componentName: 'hey',
                      componentState: {
                        companyName: 'Stock Y'
                      }
                    },
                    {
                      type: 'component',
                      title: 'Springshield plc.',
                      componentName: 'hey',
                      componentState: {
                        companyName: 'Stock Z'
                      }
                    }
                  ]
                }
              ]
            },
            {
              width: 30,
              title: 'Layout',
              type: 'component',
              componentName: 'hey',
              componentState: { bg: 'golden_layout_text.png' }
            },
            {
              width: 20,
              type: 'component',
              title: 'Market',
              componentName: 'hey'
            },
            {
              width: 20,
              type: 'column',
              content: [
                {
                  height: 20,
                  type: 'component',
                  title: 'Performance',
                  componentName: 'hey'
                },
                {
                  height: 80,
                  type: 'component',
                  title: 'Profile',
                  componentName: 'hey'
                }
              ]
            }
          ]
        }
      ]
    };    
  }    

  function createTabDropdownConfig() {
    return {
      content: [
        {
          type: 'row',
          content: [
          {
            width: 30,
            type: 'column',
            content: [
              {
                title: 'Fnts 100',
                type: 'component',
                componentName: 'hey',
              },
              {
                type: 'row',
                content: [
                  {
                    type: 'component',
                    title: 'Golden',
                    componentName: 'hey',
                    width: 30,
                    componentState: { bg: 'golden_layout_spiral.png' }
                  }
                ]
              },
              {
                type: 'stack',
                content: [
                  {
                    type: 'component',
                    title: 'Acme, inc.',
                    componentName: 'hey',
                    componentState: {
                      companyName: 'Stock X'
                    }
                  },
                  {

                    type: 'component',
                    title: 'LexCorp plc.',
                    componentName: 'hey',
                    componentState: {
                      companyName: 'Stock Y'
                    }
                  },
                  {
                    type: 'component',
                    title: 'Springshield plc.',
                    componentName: 'hey',
                    componentState: {
                      companyName: 'Stock Z'
                    }
                  }
                ]
              }
            ]
          },
          {
            width: 20,
            type: 'stack',
            content: [
              {
                type: 'component',
                title: 'Market',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Performance',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Trend',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Balance',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Budget',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Curve',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Standing',
                componentName: 'hey'
              },
              {
                type: 'component',
                title: 'Lasting',
                componentName: 'hey',
                componentState: { bg: 'golden_layout_spiral.png' }
              },
              {
                type: 'component',
                title: 'Profile',
                componentName: 'hey'
              }
            ]
          },
          {
            width: 30,
            title: 'Layout',
            type: 'component',
            componentName: 'hey',
            componentState: { bg: 'golden_layout_text.png' }
          }
          ]
        }
      ]
    };
  }
});
