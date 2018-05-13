Tracing.js - Javascript function tracing.
===

**Tracing.js** is a library/utility to help you debug and trace javascript code.

Have you ever had the need to know when a function is called? Check its parameters or the return value? Of course you have, is part of regular development. This is very easy to accomplish with your code you just write some debugging output into them, or set up a breakpoint so the debugger will fire up when the code is called.

What about third party code? Or native functions? You have the source code so is easy to go there and modify it or again, set up a breakpoint, but sometimes you don't feel like it or the code is minified and with native functions you don't have any of these options.

**Tracing.js** is here to help.

Simply put, **Tracing.js** will allow you to set functions of your own to be called before or after target functions get called. It is like events for function invocations.

If you don't want to run specific code when this happens you can set up a regular trace for those functions and **Tracing.js** will print useful information when these functions get called, things like the parameters used and the return values if any.

It even works for constructors and functions that have other objects attached to themselves, like jQuery's $.

# Usage

###     Tracing.before(fnName, fn)

Sets a function to be called right before the invocation of the function named by _fnName_. The function _fn_ will be called with the same context as the original function and will be passed the following parameters:

* fnName
  The name of the function you are tracing.
* arguments
  An array of arguments passed to the function.
* depth
  Trace depth, an integer representing the depth of traced calls. (This is not a stack depth per se unless you are actually tracing every function).

Returns Tracing.js itself so calls can be chained.

Examples:

```javascript
> function myFunction() { console.log("Inside function!"); }
> Tracing.before("myFunction", function (fnName, arguments, depth) { console.log("Before calling!"); } )
> myFunction()
Before calling!
Inside function!
```

Tracing jQuery:

```javascript
> Tracing.before('$', function(fnName, args, depth) { console.log("jQuery will be called!"); } );
> $("div")
jQuery will be called!
> $(document)
jQuery will be called!
```

Native functions (be careful with these!) :

```javascript
> Tracing.before('Array.prototype.push', function(fnName, args, depth) { console.log("An array about to get bigger with: " + args[0]); });
> var myArray = [];
> myArray.push(1)
An array about to get bigger with: 1
1
> myArray.push(132)
An array about to get bigger with: 132
2
```

###     Tracing.after(fnName, fn)

Sets a function to be called just after the invocation of the function named by _fnName_. The function _fn_ will be called with the same context as the original function and will be passed the following parameters:

* fnName
  The name of the function you are tracing.
* retval
  The return value of the function after being called.
* depth
  Trace depth, an integer representing the depth of traced calls. (This is not a stack depth per se).

Returns Tracing.js itself so calls can be chained.

Examples:

```javascript
> function myFunction() { console.log("Inside function!"); }
> Tracing.after("myFunction", function (fnName, retval, depth) { console.log("After calling!"); } )
> myFunction()
Inside function!
After calling!
```

Native functions:

```javascript
> Tracing.after('Array.prototype.slice', function(fnName, retval, depth) {
      console.log("Sliced: "); console.log( retval );
  });
> [1,2,3,4,5].slice(0,3)
Sliced:
[1, 2, 3]
[1, 2, 3]
```

###     Tracing.trace(fnName, ...)

Sets tracing on the given functions (you can pass as many functions names as you want). When the target functions get called information about them will be printed, such as the arguments and the return value, this is very useful when debugging specially recursive functions.

Returns Tracing.js itself so calls can be chained.

Example:

```javascript
// Recursive version of common operators.
function add (a, b) {
    if (b > 0) return add(++a, --b);
    return a;
}
function multiply (a, b, accum) {
    accum = accum || 0;
    if (b > 0) return multiply(a, --b, add(accum, a));
    return accum;
}
function square (x) {
    return multiply(x, x);
}

Tracing.untrace().trace('square', 'multiply', 'add');
> square(2)
>  square called with arguments: (2)
>    multiply called with arguments: (2, 2)
>      add called with arguments: (0, 2)
>        add called with arguments: (1, 1)
>          add called with arguments: (2, 0)
>          add returned: 2
>        add returned: 2
>      add returned: 2
>      multiply called with arguments: (2, 1, 2)
>        add called with arguments: (2, 2)
>          add called with arguments: (3, 1)
>            add called with arguments: (4, 0)
>            add returned: 4
>          add returned: 4
>        add returned: 4
>        multiply called with arguments: (2, 0, 4)
>        multiply returned: 4
>      multiply returned: 4
>    multiply returned: 4
>  square returned: 4
4

Tracing.untrace()
square(15)
225
```

###     Tracing.untrace(...)

Removes tracing from the given function names, restoring the original code. You can pass as many function names as you want or if you call it without arguments it will remove every trace currently set.

Returns Tracing.js itself so calls can be chained.

Example:

```javascript
> function myFunction() { }
> Tracing.trace("myFunction")
> myFunction()
>    myFunction called with arguments: ()
>    myFunction returned: undefined
> myFunction(1,2,3)
>    myFunction called with arguments: (1, 2, 3)
>    myFunction returned: undefined
> Tracing.untrace()
> myFunction(1,2,3)
>
```

## Final remarks

That's it, feel free to use the code however you see fit.

If you have any questions or comments please feel free to contact me at ebobby@ebobby.org. Pull requests are welcome. You can also visit my website at: http://ebobby.org/
