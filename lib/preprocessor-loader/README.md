**To install npm install preprocessor-loader**
preprocess-loader was takened already =(.

The preprocess-loader is a loader I developed to support the [Webpack Module Bundler project](https://webpack.github.io/).  The preprocess-loader provides the ability to preprocess source files through user defined regular expressions, macros, and callback routines.  Additionally it has the ability out of the box to replace common tags like __LINE__ and __FILE__ with line number and filename.  Furthermore, all user defined logic can be applied to line scope or source scope.

To simply use the __LINE__ or __FILE__ feature you can either specify it in the configuration file below or by simply adding values to the query string.

Below is an example of using the preprocess-loader and chaining the output to babel-loader.

```
     {
        test: /\.jsx?$/,
        loaders: ["babel","preprocessor?line&file&config="+path.join(__dirname,'./cfg/preprocess.json')],
        exclude: /node_modules/
      },

```

All parameters are optional in the query string.  As previously mentioned you may optionally specify the line or file values in the configuration file.

A sample configuration file may be found below, notice it is simply json.
```
{
  "line"        : true,
  "file"        : true,
  "regexes"      : [
    {
      "fileName"        : "all",
      "scope"           : "line",
      "regex"           : "__FOO__",
      "flags"           : "g",
      "value"           : "FOO"
    }
  ],
  "macros"      : [
    {
      "fileName"        : "all",
      "scope"           : "line",
      "name"            : "MYMACRO(x,b)",
      "flags"           : "g",
      "inline"          : "function doSomething(x, b) {console.log(x+b);}"
    }
  ],
  "callbacks"   : [
    {
      "fileName": "all",
      "scope"   : "line",
      "callback": "(function fooA(line, fileName, lineNumber) { line = line.replace(new RegExp('TEST'),'HELLO','g'); return line; })"
    },
    {
      "fileName": "all",
      "scope"   : "source",
      "callback": "(function fooB(source, fileName) { console.log('FILENAME is:'+fileName); return source; })"
    }
  ]
}
```
##regexes are regular expressions
1. You may specify a specific filename or "all" if you would like it to process on all files.  
2. scope must be "line" or "source".
3. regex is the regular expression you want to use.
4. flags are the flags provide to a typical string.replace function or used in a regex
5. value is the value you would like to replace the regex with


##macros are like regular expressions (They operate in the same way)
Except they allow for macros to be expanded inline in the code like the C preprocessor.
1. You may specify a specific filename or "all" if you would like it to process on all files.  
2. scope must be "line" or "source".
3. name is the regular expression you want to use to search and replace the macro tag.
4. flags are the flags provide to a typical string.replace function or used in a regex
5. inline is the value you would like to replace the macro with.

##callbacks are user defined functions
1. You may specify a specific filename or "all" if you would like it to process on all files. 
2. scope must be "line" or "source".
3. callback is the method you supply that will be called.  For line scope three paramters are provided:
  1. line, which is the source code line
  2. fileName, which is the filename being processed
  3. lineNumber which is the current line number
3. For source scope
  1. source, is the code source file
  2. fileName, which is the filename being processed
  
**ALL CALLBACKS MUST RETURN THE LINE OR SOURCE WHEN PROCESSING IS COMPLETE**

