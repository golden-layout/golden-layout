Simple Angular integration
======================================

When it comes to using GoldenLayout with Angular there's a large number of approaches. This tutorial covers the most basic one. For a more advances use case, please have a look at [this tutorial](angular-complex.html).

### Keeping it dead simple

This will be our app: Two controllers, nothing to it.

	angular.module( 'userModule', [] )
		.controller( 'user', function( $scope ){
			$scope.name = 'John Dee';
		})
		.controller( 'userDetails', function( $scope ){
			$scope.age = 38;
		});

Our aim is to lay them out side by side with a splitter in between them:

<p data-height="268" data-theme-id="7376" data-slug-hash="c1b7d914ceb5504f2a2425f918b8511c" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/c1b7d914ceb5504f2a2425f918b8511c/'>Angular Simple</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

### Why can't I just add `ng-app` to the body tag?

Angular looks for `ng-app` attributes and works its magic once the document is ready. However, so does GoldenLayout. So in order to make the two work together you have to follow these three steps:

- Create a Layout with GoldenLayout
- Load your templates into GoldenLayout's containers
- Bootstrap Angular

### Creating the layout

This one should be fairly straight forward by now. If not, have a look at the [getting started tutorial](getting-started.html). Two container, side by side, without headers. 
The only thing note-worthy is the `{ templateId: 'userNameTemplate' }` bit. This will be used to tell our component which template to load.

	myLayout = new GoldenLayout({
		settings:{
			hasHeaders: false
		},
		content:[{
			type: 'row',
			content: [{
				type: 'component',
				componentName: 'template',
				componentState: { templateId: 'userNameTemplate' }
			},{
				type: 'component',
				componentName: 'template',
				componentState: { templateId: 'userDetailTemplate' }
			}]
		}]
	});

### Loading Templates

For this example we'll store our html in [template tags](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template). (Not supported in IE). This is only one of many ways to store and retrieve pieces of html. You could also use Angular's `$templateCache` or `ng-include` method, RequireJS' text plugin, hidden divs, Ajax or a number of other approaches.

	<template type="text/html" id="userNameTemplate">
		<div ng-controller="user" class="section">
			<strong>Username</strong> {{name}}
		</div>
	</template>

	<template type="text/html" id="userDetailTemplate">
		<div ng-controller="userDetails" class="section">
			<strong>Age</strong> {{age}}
		</div>
	</template>

Our component will retrieve the template's html and inject it into the container.

	myLayout.registerComponent( 'template', function( container, state ){
		var templateHtml = $( '#' + state.templateId ).html();
		container.getElement().html( templateHtml );
	});

### Bootstrapping our App

All that's left now is to create our layout and, once it's initialised, bootstrap Angular.

	myLayout.on( 'initialised', function(){
		angular.bootstrap( document.body, [ 'userModule' ]);
	});

	myLayout.init();