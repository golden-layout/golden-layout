
var srcContext = require.context('../src', true, /(^app)\.js$/);
srcContext.keys().forEach(srcContext);

var testsContext = require.context('./specs', true, /\.js$/);
testsContext.keys().forEach(testsContext);