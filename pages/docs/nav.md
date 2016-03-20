<ul id="subnav">
	<li class="head first">Configuration</li>
	<li {{#if fileIs_Config}}class="active"{{/if}}>
		<a href="Config.html">Layout Config</a>
		<div class="isActiveIndicator orangeGradient"></div>
	</li>
	<li {{#if fileIs_ItemConfig}}class="active"{{/if}}>
		<a href="ItemConfig.html">Item Config</a>
		<div class="isActiveIndicator orangeGradient"></div>
	</li>

	<li class="head">API</li>
	<li {{#if fileIs_GoldenLayout}}class="active"{{/if}}>
		<a href="GoldenLayout.html">GoldenLayout</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_GoldenLayout}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
	<li {{#if fileIs_Item}}class="active"{{/if}}>
		<a href="Item.html">ContentItem</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_Item}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
	<li {{#if fileIs_Container}}class="active"{{/if}}>
		<a href="Container.html">Container</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_Container}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
	<li {{#if fileIs_BrowserWindow}}class="active"{{/if}}>
		<a href="BrowserWindow.html">BrowserWindow</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_BrowserWindow}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
	<li {{#if fileIs_Header}}class="active"{{/if}}>
		<a href="Header.html">Header</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_Header}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
	<li {{#if fileIs_Tab}}class="active"{{/if}}>
		<a href="Tab.html">Tab</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_Tab}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
	<li {{#if fileIs_EventEmitter}}class="active"{{/if}}>
		<a href="EventEmitter.html">EventEmitter</a>
		<div class="isActiveIndicator orangeGradient"></div>
		{{#if fileIs_EventEmitter}}
			<ul class="overview">
				{{#each subNav}}
				<li><a href="#{{this}}">{{this}}</a></li>
				{{/each}}
			</ul>
		{{/if}}
	</li>
</ul>