// helper file for webpack build system
// whatever is imported/exported here will be included in the build
import 'less/test.less'
import 'less/goldenlayout-base.less'
import 'less/goldenlayout-dark-theme.less'
//
// Layout
export { default } from 'js/LayoutManager'
//
// container
export { default as ItemContainer } from 'js/container/ItemContainer'
//
// controls
export { default as BrowserPopout } from 'js/controls/BrowserPopout'
export { default as Header } from 'js/controls/Header'
export { default as HeaderButton } from 'js/controls/HeaderButton'
export { default as Tab } from 'js/controls/Tab'
//
// items
export { default as Component } from 'js/items/Component'
export { default as Root } from 'js/items/Root'
export { default as RowOrColumn } from 'js/items/RowOrColumn'
export { default as Stack } from 'js/items/Stack'
//
// utils
export { default as BubblingEvent } from 'js/utils/BubblingEvent'
export { default as ConfigMinifier } from 'js/utils/ConfigMinifier'
export { default as DragListener } from 'js/utils/DragListener'
export { default as EventEmitter } from 'js/utils/EventEmitter'
export { default as EventHub } from 'js/utils/EventHub'
export { default as ReactComponentHandler } from 'js/utils/ReactComponentHandler'

if(env.ZEPTO){
  require('script-loader!../node_modules/zepto/dist/zepto.js');
  require('../lib/zepto-extras.js');
}
