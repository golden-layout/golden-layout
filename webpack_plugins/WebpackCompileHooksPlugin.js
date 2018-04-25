function WebpackCompileHooksPlugin(options) {
  var defaultOptions = {
    onBuildStart: function(){},
    onBuildEnd: function(){}
  };

  this.options = Object.assign(defaultOptions, options);
}

WebpackCompileHooksPlugin.prototype.apply = function(compiler) {
  const options = this.options;
  compiler.plugin("compilation", compilation => {
    // delete require.cache[require.resolve(this.options.appConfigFile)]
    // var config = require(this.options.appConfigFile);
    this.options.onBuildStart.call()
  });

  compiler.plugin("emit", (compilation, callback) => {
    // delete require.cache[require.resolve(this.options.appConfigFile)]
    // var config = require(this.options.appConfigFile);
    this.options.onBuildEnd.call()
    callback();
  });
};

module.exports = WebpackCompileHooksPlugin;
