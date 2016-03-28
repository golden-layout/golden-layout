
$(function(){
  var config = {
    content:[
      {
        type: 'row',
        content:[
        {
            width: 80,
            type: 'column',
            content:[
              {
                title: 'Fnts 100',
                type: 'component',
                componentName: 'hey',
              },
              {
                type: 'row',
                content:[
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
                content:[
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

  window.myLayout = new GoldenLayout( config );

  myLayout.registerComponent( 'hey', function( container, state ) {
    if( state.bg ) {
      container
        .getElement()
        .text( 'hey');
    }
  });

  myLayout.init();
});
