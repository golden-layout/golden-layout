import '../test.css'
import 'less/goldenlayout-base.less'
import 'less/goldenlayout-dark-theme.less'

export function trick_preprocessor_and_webpack_hmr (a) {
  // makes webpack sense that the files (in ./js & subdirs) have changed
  require('./js/' + a).default
}

window.addEventListener('load', () => {
    // 
    // set layout type
    // 
    var layout = 'responsive'

    // 
    // init
    //
    var config
    switch( layout.toLowerCase() ) {
      case 'responsive':
        config = createResponsiveConfig()
        break
      case 'tab-dropdown':
        config = createTabDropdownConfig()
        break
      default:
        config = createStandardConfig()
        break
    }

    window.myLayout = new window.GoldenLayout( config )

    myLayout.registerComponent( 'html', function( container, state ) {} )

    myLayout.init()

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
                    header: { show: 'bottom' },
                    type: 'component',
                    componentName: 'html',
                  },
                  {
                    type: 'row',
                    content: [
                      {
                        type: 'component',
                        title: 'Golden',
                        header: { show: 'right' },
                        isClosable: false,
                        componentName: 'html',
                        width: 30,
                        componentState: { bg: 'golden_layout_spiral.png' }
                      },
                      {
                        title: 'Layout',
                        header: { show: 'left', popout: false },
                        type: 'component',
                        componentName: 'html',
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
                        componentName: 'html',
                        componentState: {
                          companyName: 'Stock X'
                        }
                      },
                      {
                        type: 'component',
                        title: 'LexCorp plc.',
                        componentName: 'html',
                        componentState: {
                          companyName: 'Stock Y'
                        }
                      },
                      {
                        type: 'component',
                        title: 'Springshield plc.',
                        componentName: 'html',
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
                    componentName: 'html'
                  },
                  {
                    height: 40,
                    type: 'component',
                    title: 'Market',
                    componentName: 'html'
                  }
                ]
              }
            ]
          }
        ]
      }
    }

    function createResponsiveConfig() {
      return {
        settings: {
          responsiveMode: 'always'
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
                    componentName: 'html',
                  },
                  {
                    type: 'row',
                    content: [
                      {
                        type: 'component',
                        title: 'Golden',
                        componentName: 'html',
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
                        componentName: 'html',
                        componentState: {
                          companyName: 'Stock X'
                        }
                      },
                      {
                        type: 'component',
                        title: 'LexCorp plc.',
                        componentName: 'html',
                        componentState: {
                          companyName: 'Stock Y'
                        }
                      },
                      {
                        type: 'component',
                        title: 'Springshield plc.',
                        componentName: 'html',
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
                componentName: 'html',
                componentState: { bg: 'golden_layout_text.png' }
              },
              {
                width: 20,
                type: 'component',
                title: 'Market',
                componentName: 'html',
                componentState: {
                  className: 'market-content',
                  style: [
                    '.market-content label {',
                    '  margin-top: 10px',
                    '  display: block',
                    '  text-align: left',
                    '}',
                    '.market-content input {',
                    '  width: 250px',
                    '  border: 1px solid red',
                    '}'
                  ],
                  html: [
                    '<label for="name">Name<label>',
                    '<input id="name" type="text"></input>'
                  ]
                }
              },
              {
                width: 20,
                type: 'column',
                content: [
                  {
                    height: 20,
                    type: 'component',
                    title: 'Performance',
                    componentName: 'html'
                  },
                  {
                    height: 80,
                    type: 'component',
                    title: 'Profile',
                    componentName: 'html'
                  }
                ]
              }
            ]
          }
        ]
      }
    }

    function createTabDropdownConfig() {
      return {
        settings: {
          tabOverlapAllowance: 25,
          reorderOnTabMenuClick: false,
          tabControlOffset: 5
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
                    componentName: 'html',
                  },
                  {
                    type: 'row',
                    content: [
                      {
                        type: 'component',
                        title: 'Golden',
                        componentName: 'html',
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
                        componentName: 'html',
                        componentState: {
                          companyName: 'Stock X'
                        }
                      },
                      {
                        type: 'component',
                        title: 'LexCorp plc.',
                        componentName: 'html',
                        componentState: {
                          companyName: 'Stock Y'
                        }
                      },
                      {
                        type: 'component',
                        title: 'Springshield plc.',
                        componentName: 'html',
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
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Performance',
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Trend',
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Balance',
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Budget',
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Curve',
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Standing',
                    componentName: 'html'
                  },
                  {
                    type: 'component',
                    title: 'Lasting',
                    componentName: 'html',
                    componentState: { bg: 'golden_layout_spiral.png' }
                  },
                  {
                    type: 'component',
                    title: 'Profile',
                    componentName: 'html'
                  }
                ]
              },
              {
                width: 30,
                title: 'Layout',
                type: 'component',
                componentName: 'html',
                componentState: { bg: 'golden_layout_text.png' }
              }
            ]
          }
        ]
      }
    }
})
