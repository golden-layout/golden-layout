ddescribe( 'destroy layout works and emits bubbling events', function(){

    var layout;

    it( 'creates a layout', function(){
        layout = testTools.createLayout({
            content: [{
                type: 'stack',
                content: [{
                    type: 'column',
                    content:[{
                        type: 'component',
                        componentName: 'testComponent'
                    }]
                }]
            }]
        });

        testTools.verifyPath( 'stack.0.column.0.stack.0.component', layout, expect );
    });

    it( 'emits "itemDestroyed" events', function(){
        var invocations = [],
            eventName = 'itemDestroyed';

        runs(function(){
            layout.root
                .contentItems[ 0 ]
                .contentItems[ 0 ]
                .contentItems[ 0 ]
                .contentItems[ 0 ]
                .on( eventName, function(){
                    invocations.push( 'component' );
                });

            layout.root
                .contentItems[ 0 ]
                .contentItems[ 0 ]
                .contentItems[ 0 ]
                .on( eventName, function(){ invocations.push( 'stackBottom' ); });

            layout.root
                .contentItems[ 0 ]
                .contentItems[ 0 ]
                .on( eventName, function(){ invocations.push( 'column' ); });

            layout.root
                .contentItems[ 0 ]
                .on( eventName, function(){ invocations.push( 'stackTop' ); });

            layout.root.on( eventName, function( event ){
                invocations.push( 'root' );
            });

            layout.on( eventName, function(){
                invocations.push( 'layout' );
            });

            layout.destroy();
        });

        runs(function(){
            expect( invocations.length ).toBe( 20 );
            expect( invocations ).toEqual( [
                // events for component (+ bubbling)
                'component',
                'stackBottom',
                'column',
                'stackTop',
                'root',
                'layout',

                // events for stackBottom (+ bubbling)
                'stackBottom',
                'column',
                'stackTop',
                'root',
                'layout',

                // events for column (+ bubbling)
                'column',
                'stackTop',
                'root',
                'layout',

                // events for stackTop (+ bubbling)
                'stackTop',
                'root',
                'layout',

                // events for root (+ bubbling)
                'root',
                'layout'
            ] );
        });
    });
});