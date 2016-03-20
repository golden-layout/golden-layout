Using popout windows
=====================================

Almost every office program, graphic suite or text editor supports multi window setups – which makes perfect sense, seeing that it helps a lot with utilising desktop space or using parts of an app as standalone widgets.

##### So how come web-apps so rarely do this?

Opening new windows from a web-page was traditionally used for aggressive advertisement – until browser-vendors started introducing all sorts of constrains and security features. This makes it now very hard for advertisers to annoy you with popup-ads, but even harder for web-apps to use them.

##### How can GoldenLayout make any difference with that?

GoldenLayout deals with the cross browser quirks and vendor limitations around popouts – and there are many. But more importantly, GoldenLayout allows to use popouts in a way that mitigates most security concerns: by loading the same URL in every window and passing instructions about what to create as GET-parameter. This fulfils the same-origin policy and keeps programatical communication between windows to a minimum.

##### So, all good? Can I just use popouts free from care?

Unfortunately: no. GoldenLayout makes it easy to create production ready apps with multi window support, all the way back to IE 8, but there are a few things you as a developer still needs to consider.

### Communication between windows

JavaScript's global namespace is on a per-window basis. So if your component is in a new window it won't be able to easily access objects in the old one.

Fortunately GoldenLayout comes with a cross-window eventHub that facilitate communication in a simple and reliable way.

	//window A
	myLayout.eventHub.emit( 'sayHi', { name: 'Joe' } );

	//window B
	myLayout.eventHub.on( 'sayHi', function( user ){
		alert( 'Hi ' + user.name );
	});

### Keeping the state up to date

GoldenLayout doesn't copy your current component to the new window, but rather creates an entirely new one with the same state. It is therefor important to store everything you want to persist as part of the state-object, either by calling `container.setState( state )` or `container.extendState( state )`.

### Keeping elements in the body

When opening a new window, GoldenLayout loads the current page, but removes the body's inner HTML. This might sound a bit radical, but works brilliantly in practice. There might however be some things within your page's body that you'd like to keep. GoldenLayout moves `style`, `link` and `template` tags automatically to the `<head>`, for everything else, just add a class `gl_keep` to your element, e.g..

	<body>
		...
		// Template in a script tag that you want to use in a new window
		<script type="text/html" class="gl_keep">
			<div>{{someTemplate}}</div>
		</script>
	</body>

### Blocked programmatic popouts

Most browsers only allow popouts to open as a direct consequence of a click (or some other user input). If the popout however is openend programmatically, it will most likely be blocked and the browser will show a warning like these:

<img src="../assets/images/popup_blocked_chrome.png" alt="Popup blocked Warning in Chrome"/>

<img src="../assets/images/popup_blocked_ff.png" alt="Popup blocked Warning in Firefox"/>

<img src="../assets/images/popup_blocked_ie.png" alt="Popup blocked Warning in Internet Explorer"/>


This might happen when you load a layout with open windows from a serialised state as well as when calling myItem.popout(). Here's how to deal with it:

	try{
		myLayout.init();
	} catch( e ) {
		if( e.type === 'popoutBlocked' ) {
			/*
			 * Ask the user to allow popouts for your domain, 
			 * then call myLayout.init(); again.
			 * Same for myItem.popout();
			 */
		}
	}

Once the user has allowed popouts for your domain he'll never be asked again.

### Location Bar

<img src="../assets/images/popout_location_bar.png" alt="location bar" />

Your pop-up will display a location bar - which helps to avoid phishing attacks (opening something that looks like your bank login etc.) but takes up space for your web-app. Unfortunately this is a security feature and can't be turned off (even though there's a locationbar:'no' option when opening the window, but it will just be ignored).
