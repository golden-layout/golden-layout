const testsContext = require.context('./dist', true, /\.js$/);
testsContext.keys().forEach(testsContext);