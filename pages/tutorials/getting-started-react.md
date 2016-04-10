
<link href="../assets/css/getting-started.css" type="text/css" rel="stylesheet" />
Ok, let’s start with the basics:

#### Building Blocks
Layouts in GoldenLayout are created out of three building blocks: Rows, Columns and Stacks

<ul class="building-blocks">
    <li>
        <img src="../assets/images/getting-started/row.png" width="154" height="94" alt="basic building block row"/>
        <p><em>Rows</em> arrange components horizontally along the x-axis</p>
    </li>
    <li>
        <img src="../assets/images/getting-started/column.png" width="154" height="94" alt="basic building block row"/>
        <p><em>Columns</em> arrange components vertically along the y-axis</p>
    </li>
    <li>
        <img src="../assets/images/getting-started/stack.png" width="154" height="94" alt="basic building block row"/>
        <p><em>Stacks</em> arrange components on top of each other along the z-axis as tabs</p>
    </li>
</ul>

All three of these building blocks can be nested within each other infinitely.

<img class="centered" src="../assets/images/getting-started/nested.png" width="326" height="150" />

#### Config to Model
Have you ever used HTML? Manipulated the DOM using JavaScript? Perfect – then you know how GoldenLayout works. GoldenLayouts are created out of JSON config (think HTML) that looks like this:

    var myLayout = new GoldenLayout({
        content: [{
            type: 'row',
            content:[{
                type:'react-component',
                component: 'test-component',
                props: { label: 'A' }
            },{
                type: 'column',
                content:[{
                    type:'react-component',
                    component: 'test-component',
                    props: { label: 'B' }
                },{
                    type:'react-component',
                    component: 'test-component',
                    props: { label: 'C' }
                }]
            }]
        }]
    });

The JSON config is processed and the layout engine builds up an object tree from it. This object tree remains interactive and can (if required) be manipulated using JavaScript (think DOM), e.g.

    //Open the element with 'someId' in a new window
    myLayout.root.getItemsById( 'someId' )[ 0 ].popout();

    //Add another component to the layout
    myLayout.root.contentItems[ 0 ].addChild({
        type:'react-component',
        component: 'testComponent',
        props: { label: 'X' }
    });

#### Components
GoldenLayout works with any react component. Just register them with `registerComponent()`:

    var TestComponent = React.createClass({
        render: function() {
            return (<h1>{this.props.label}</h1>)
        }
    });

    myLayout.registerComponent( 'testComponent', TestComponent );

    //Once all components are registered, call
    myLayout.init();

And that's all it takes to create a layout. Make sure to include jQuery, React and ReactDOM in a way that makes it accessible to GoldenLayout.

<p data-height="268" data-theme-id="7376" data-slug-hash="yOveme" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/9cb7e16c6e3a5ad427297cc4d390b971/'>Gettins started with React</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

#### Container & EventHub
Now that we've got the basics covered, let's look at some more advanced features.

[Containers](../docs/Container.html) represent the panel your component lives in. They expose a lot of useful methods, e.g. `setTitle()` or `close()` and emit events like `resize`. The container a component lives in is exposed via a special property called `glContainer`. The container also allows you to access the layout-tree above your component. For example, to move the whole component into a new window, you'd call:

    this.props.glContainer.parent.popout();

Communicating between components is always tricky, but with GoldenLayout it can be even harder if your components are distributed across multiple windows and screens. This is why GoldenLayout comes with an [EventHub](docs/EventEmitter.html) - an EventEmitter that's global to all windows and can be used for inter-component communication, even across windows. The eventHub is exposed through a property called `glEventHub`. To raise an event across all windows, you'd call:

    this.props.glEventHub.emit( 'something-happend', {some: 'data' });

Here's a ReactJS example making use of these features (give it a go, pop one or both components out and see how they're still able to interact):

<p data-height="268" data-theme-id="7376" data-slug-hash="XdabGJ" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/wolframhempel/pen/XdabGJ/'>Complex usage with React</a> by Wolfram Hempel (<a href='http://codepen.io/wolframhempel'>@wolframhempel</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>