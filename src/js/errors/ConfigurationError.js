lm.errors.ConfigurationError = function(message, node) {
  Error.call(this);

  this.name = 'Configuration Error';
  this.message = message;
  this.node = node;
};

lm.errors.ConfigurationError.prototype = new Error();
