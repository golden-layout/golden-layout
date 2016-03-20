Properties
--------------------------------------------
### isInitialised
True if the window has been opened and its GoldenLayout instance initialised.

Events
--------------------------------------------
### initialised
Emitted when the window has been opened and its GoldenLayout instance initialised

### closed
Emitted when the window has been closed

toConfig()
--------------------------------------------
Creates a window configuration object from the Popout. Window configurations look like this:

	{
	    "dimensions": {
	        "width": 1532,
	        "height": 100,
	        "left": 0,
	        "top": 129
	    },
	    "content": [/* your usual content config */],
	    "parentId": "4ef2ubr28tor",
	    "indexInParent": 1
	}

getGlInstance()
--------------------------------------------
Returns the GoldenLayout instance from the child window

getWindow()
--------------------------------------------
Returns the native Window object

close()
--------------------------------------------
Closes the popout

popIn()
--------------------------------------------
Returns the popout to its original position as specified in `parentId` and `indexInParent`

</div>