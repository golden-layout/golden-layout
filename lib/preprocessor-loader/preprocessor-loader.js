'use strict';

var loaderUtils	= require("loader-utils");
var fs 		= require("fs");	
var path	= require("path");

module.exports = function(source) {
  this.cacheable();

  var queryString = loaderUtils.parseQuery(this.query);

  var opt = {
    "line"	: queryString.line,
    "file"	: queryString.file,
    "config"	: queryString.config,
    "cfg"	: {} 
  };

  if(queryString.line===undefined) {
    opt.line = false;
  }

  if(queryString.file===undefined) {
    opt.file = false;
  }

  var line	= "";
  var content	= "";
  var resource = this.resource;
  var fileName	= path.parse(this.resource).base; 

  if(((opt.config!==undefined)?true:false)) {
    try {
      opt.cfg = JSON.parse(fs.readFileSync(opt.config, 'utf8'));
    }
    catch(err) {
      throw "preprocess error: "+ err;
    }
  }

  if(opt.cfg!==undefined && opt.cfg.line!==undefined) {
    opt.line = opt.cfg.line;
  }

  if(opt.cfg!==undefined && opt.cfg.file!==undefined) {
    opt.file = opt.cfg.file;
  }

  var lineCount = 1;
  for(var i=0;i<source.length;i++) {
    line = line + source[i];

    if(source[i]=='\n') {
      if(opt.line) {
        line = line.replace(new RegExp('__LINE__'),""+lineCount,'g');
      }

      if(opt.file) {
        line = line.replace(new RegExp('__FILE__'),""+fileName,'g');
      }

      if(opt.config!==undefined && opt.cfg!==undefined && opt.cfg.regexes!==undefined) {
        for(var x=0;x<opt.cfg.regexes.length;x++) {
          if(opt.cfg.regexes[x].scope=="line") {
            if(opt.cfg.regexes[x].fileName=="all" || opt.cfg.regexes[x].fileName==fileName) {
              line = line.replace(new RegExp(opt.cfg.regexes[x].regex),opt.cfg.regexes[x].value,opt.cfg.regexes[x].flags);
            }
          }
        }
      }

      if(opt.config!==undefined && opt.cfg!==undefined && opt.cfg.macros!==undefined) {
        for(var x=0;x<opt.cfg.macros.length;x++) {
          if(opt.cfg.macros[x].scope=="line") {
            if(opt.cfg.macros[x].fileName=="all" || opt.cfg.macros[x].fileName==fileName) {
              line = line.replace(new RegExp(opt.cfg.macros[x].name),opt.cfg.macros[x].inline,opt.cfg.macros[x].flags);
            }
          }
        }
      } 

      if(opt.config!==undefined && opt.cfg!==undefined && opt.cfg.callbacks!==undefined) {
        for(var x=0;x<opt.cfg.callbacks.length;x++) {
          if(opt.cfg.callbacks[x].scope=="line" && (opt.cfg.callbacks[x].fileName=="all" || opt.cfg.callbacks[x].fileName==fileName)) {
            var cb = eval(opt.cfg.callbacks[x].callback);
            line = cb(line, fileName, lineCount)
          }
        }
      }

      content = content + line;
      line = "";
      lineCount++;
    }
  }

  if(opt.config!==undefined && opt.cfg!==undefined && opt.cfg.regexes!==undefined) {
    for(var i=0;i<opt.cfg.regexes.length;i++) {
      if(opt.cfg.regexes[i].scope=="source") {
        if(opt.cfg.regexes[i].fileName=="all" || opt.cfg.regexes[i].fileName==fileName) {
          content = content.replace(new RegExp(opt.cfg.regexes[i].regex),opt.cfg.regexes[i].replace-value,opt.cfg.regexes[i].replace-scope);
        }
      }
    }
  }

  if(opt.config!==undefined && opt.cfg!==undefined && opt.cfg.macros!==undefined) {
    for(var x=0;x<opt.cfg.macros.length;x++) {
      if(opt.cfg.macros[x].scope=="source") {
        if(opt.cfg.macros[x].fileName=="all" || opt.cfg.macros[x].fileName==fileName) {
          content = content.replace(new RegExp(opt.cfg.macros[x].name),opt.cfg.macros[x].inline,opt.cfg.macros[x].flags);
        }
      }
    }
  }

  if(opt.config!==undefined && opt.cfg!==undefined && opt.cfg.callbacks!==undefined) {
    for(var i=0;i<opt.cfg.callbacks.length;i++) {
      if(opt.cfg.callbacks[i].scope=="source" && (opt.cfg.callbacks[i].fileName=="all" || opt.cfg.callbacks[i].fileName==fileName)) {
        var cb = eval(opt.cfg.callbacks[i].callback);
        content = cb(content, fileName)
      }
    }
  }

  return content;
};
