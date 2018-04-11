lm.utils.BubblingEvent = function(name, origin) {
  this.name = name;
  this.origin = origin;
  this.isPropagationStopped = false;
};

lm.utils.BubblingEvent.prototype.stopPropagation = function() {
  this.isPropagationStopped = true;
};
