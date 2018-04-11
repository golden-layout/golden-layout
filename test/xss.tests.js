const GoldenLayout = require('../dist/goldenlayout');

describe('Basic XSS filtering is applied', () => {
  const filterFn = GoldenLayout.__lm.utils.filterXss;

  test('escapes tags', () => {
    const escapedString = filterFn('>\'>"><img src=x onerror=alert(0)>');
    expect(escapedString).toBe('&gt;\'&gt;"&gt;&lt;img src=x on&#101;rror=alert(0)&gt;');
  });

  test('escapes javascript urls', () => {
    const escapedString = filterFn('javascript:alert("hi")'); // jshint ignore:line
    expect(escapedString).toBe('j&#97;va&#115;cript:alert("hi")');
  });

  test('escapes expression statements', () => {
    const escapedString = filterFn('expression:alert("hi")'); // jshint ignore:line
    expect(escapedString).toBe('expr&#101;ssion:alert("hi")');
  });

  test('escapes onload statements', () => {
    let escapedString = filterFn('onload=alert("hi")'); // jshint ignore:line
    expect(escapedString).toBe('onlo&#97;d=alert("hi")');

    escapedString = filterFn('onLoad=alert("hi")'); // jshint ignore:line
    expect(escapedString).toBe('onlo&#97;d=alert("hi")');
  });

  test('escapes onerror statements', () => {
    let escapedString = filterFn('onerror=alert("hi")'); // jshint ignore:line
    expect(escapedString).toBe('on&#101;rror=alert("hi")');

    escapedString = filterFn('onError=alert("hi")'); // jshint ignore:line
    expect(escapedString).toBe('on&#101;rror=alert("hi")');
  });
});
