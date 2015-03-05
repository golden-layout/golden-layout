
var myLayout;

$(function(){
	var config = {
			content: [{
					type: 'row',
					isClosable: false,
					content: [{
							type:'component',
							componentName: 'example',
							componentState: { text: 'Component 1' }
					},
					{
							type:'component',
							componentName: 'example',
							componentState: { text: 'Component 2' }
					}]
			}]
	};

	var addMenuItem = function( title, text ) {
			var element = $( '<li>' + text + '</li>' );
			$( '#menuContainer' ).append( element );

			var newItemConfig = {
					title: title,
					type: 'component',
					componentName: 'example',
					componentState: { text: text }
			};
		
			element.click(function(){
					myLayout.root.contentItems[ 0 ].addChild( newItemConfig );
			});
	};
	
	myLayout = new window.GoldenLayout( config, $('#layoutContainer') );

	myLayout.registerComponent( 'example', function( container, state ){
			container.getElement().html( '<h2>' + state.text + '</h2>');
	});

	myLayout.init();
	addMenuItem( 'Add me!', 'You\'ve added me!' );
	addMenuItem( 'Me too!', 'You\'ve added me too!' );
});

