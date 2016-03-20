Using GoldenLayout with Angular
============================================

Angular’s popularity is exploding and it’s easy to see why: It provides a set of solutions to common problems and good integration-points for usage of third part components.

Using Angular within third party components (e.g. GoldenLayout) however can be challenging. But fear not, this tutorial is here to help.

The main challenges are
-	working with multiple modules
-	bootstrapping a module directly into a DOM element at runtime
-	injecting external dependencies (container, state) into a module
-	communicating between modules

To address these we’ll build a user management app consisting of two modules: a list of users and a user-detail panel.

- 	Each module will live in its own GoldenLayout container
-	Selecting an user in the list will show its details in the detail panel (communication between modules)
-	Both modules can be opened in their own popout window, but communication still has to work.
-	The initially selected user will be configured as part of GoldenLayout’s component state (external dependency).

### Here’s the result
<p data-height="268" data-theme-id="7376" data-slug-hash="9cc03061dd363f9b3d014ad4c6b7937d" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/9cc03061dd363f9b3d014ad4c6b7937d/'>Angular and GoldenLayout</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

### The user list

	angular.module('userlist', [] )
	.controller('userlistController', function( $scope, $timeout, container, state ) {

		var selectedUser = {};

		//Some demo users
		$scope.users = [
			{ name: 'Jackson Turner', street: '217 Tawny End', img: 'men/1.jpg' },
			{ name: 'Megan Perry', street: '77 Burning Ramp', img: 'women/1.jpg' },
			{ name: 'Ryan Harris', street: '12 Hazy Apple Route', img: 'men/2.jpg' },
			{ name: 'Jennifer Edwards', street: '33 Maple Drive', img: 'women/2.jpg' },
			{ name: 'Noah Jenkins', street: '423 Indian Pond Cape', img: 'men/3.jpg' }
		];
		
		// Change the selected user
		$scope.select = function( user ) {
			selectedUser.isSelected = false;
			user.isSelected = true;
			selectedUser = user;
			container.extendState({ selectedUserIndex: $scope.users.indexOf( user ) });
			container.layoutManager.eventHub.emit( 'userSelected', user );
		};

		// Select the initial user, based on the Component config
		$timeout(function(){
			$scope.select( $scope.users[ state.selectedUserIndex ] );
		});
	});

### The details panel

	angular.module('userdetails', [] )
	.controller('userdetailsController', function( $scope, container, state ) {
		$scope.user = state.user || null;

		container.layoutManager.eventHub.on( 'userSelected', function( user ){
			$scope.user = user;
			container.extendState({ user: user });
			$scope.$apply();
		});
	});

### Communicating between modules
Communication between modules is facilitated by an EventHub. This EventHub is part of GoldenLayout and can be 
accessed as `myLayout.eventHub` or `container.layoutManager.eventHub`. It's just a normal [EventEmitter](../docs/EventEmitter.html) - but with a twist: It works across all open popout windows in both directions. This happens implicitly, so as far as usage is concerned just use the usual on, off and emit methods.

	
### Injecting container and state
You’ve probably noticed the code that selects the initial user based on a configured state.
	
	$timeout(function(){
		$scope.select( $scope.users[ state.selectedUserIndex ] );
	});

`selectedUserIndex` is part of the GoldenLayout configuration and will be passed to the component's constructor function.
From there it needs to get into Angular. Since the bootstrapping process for Angular modules is pretty much always the same, we'll write a generic component for it and tell it via configuration which template to load and which module to create. Our component configuration would therefor look like this 

	componentName: 'angularModule',
	componentState: {
		module: 'userlist',
		templateId: 'userlistTemplate',
		selectedUserIndex: 2
	}

and the component that uses it like this

	var AngularModuleComponent = function( container, state ) {
		
		// Templates are stored in template tags in the DOM.
		var html = $( '#' + state.templateId ).html(),
			element = container.getElement();
		
		// Write the template's html into the container
		element.html( html );

		// Inject container and state into the module. If multiple instances of
		// the same module are created this will override the previous module's container
		// and state with the current (correct) one
		angular
			.module( state.module )
			.value( 'container', container )
			.value( 'state', state );

		// Actually kick off Angular's magic
		angular.bootstrap( element[ 0 ], [ state.module ] );
	};