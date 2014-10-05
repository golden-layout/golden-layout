
var config = {
  settings:{showPopoutIcon:false},
  dimensions:{borderWidth: 20},
  content: [{
    type: 'row',
    content:[{
      type: 'stack',
      width: 60,
      activeItemIndex: 1,
      content:[{
        type: 'component',
        componentName: 'testComponent',
        title:'Component 1'
      },{
        type: 'component',
        componentName: 'testComponent',
        title:'Component 2'
      }]
    },{
      type: 'column',
      content:[{
        type: 'component',
        componentName: 'testComponent'
      },{
        type: 'component',
        componentName: 'testComponent'
      }]
    }]
  }]
};

var TestComponent = function( container, state ) {
  this.element = $(
    '<table class="test">' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
      '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
    '</table>'
  );

  this.tds = this.element.find( 'td' );
  this.tds.click( this._highlight.bind( this ) );
  this.container = container;
  this.container.getElement().append( this.element );

  if( state.tiles ) {
    this._applyState( state.tiles );
  }
};

TestComponent.prototype._highlight = function( e ) {
  $( e.target ).toggleClass( 'active' );
  this._serialize();
};

TestComponent.prototype._serialize = function() {
  var state = '',
    i;

  for( i = 0; i < this.tds.length; i++ ) {
    state += $( this.tds[ i ] ).hasClass( 'active' ) ? '1' : '0';
  }

  this.container.extendState({ tiles: state });
};

TestComponent.prototype._applyState = function( state ) {
  for( var i = 0; i < this.tds.length; i++ ) {
    if( state[ i ] === '1' ){
      $( this.tds[ i ] ).addClass( 'active' );
    }
  }
};


$(function(){
  var createLayout = function( config, container ) {
    var layout = new GoldenLayout( config, $(container) );
    layout.registerComponent( 'testComponent', TestComponent );
    layout.init();
    return layout;
  };
  
  var layoutA = createLayout( config, '.layoutA' );
  var layoutB = createLayout( config, '.layoutB' );

  layoutA.on( 'stateChanged',function(){
    layoutB.destroy();
    layoutB =  createLayout( layoutA.toConfig(), '.layoutB' );
  });
  
  $(window).resize(function(){
    layoutA.updateSize();
    layoutB.updateSize();
  });
});