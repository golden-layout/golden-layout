const error = 2;
const warn = 1;
const ignore = 0;

module.exports = {
  extends: ['eslint-config-airbnb', 'plugin:jest/recommended', 'prettier'],
  plugins: ['prettier', 'jest', 'react', 'json'],
  'env': {
    'browser': true,
    'es6': true,
    'jquery': true
  },
  'parser': 'babel-eslint',
  'parserOptions': {
    'sourceType': 'module'
  },
  'globals': {
    'lm': warn,
  },  
  'rules': {
    'block-scoped-var': warn,
    'class-methods-use-this': warn,
    'consistent-return': warn,
    'func-names': ignore,
    'guard-for-in': ignore,
    'import/no-mutable-exports': warn,
    'no-continue': warn,
    'no-multi-assign': warn,
    'no-new': warn,
    'no-param-reassign': [
      'warn',
      {
        'props': true
      }
    ],
    'no-plusplus': ignore,
    'no-prototype-builtins': warn,
    'no-restricted-syntax': warn,
    'no-shadow': warn,
    'no-undef-init': ignore,
    'no-undef': ignore,
    'no-undefined': ignore,
    'no-underscore-dangle': ignore,
    'no-unused-expressions': ignore,
    'no-unused-vars': warn,
    'no-use-before-define': warn,
    'no-var': warn,
    'prefer-destructuring': warn,
    'prefer-rest-params': warn,
    'prefer-spread': warn,
    'prettier/prettier': [
      warn,
      {
        printWidth: 100,
        tabWidth: 2,
        bracketSpacing: true,
        trailingComma: 'es5',
        singleQuote: true,
      },
    ],
    'strict': ignore,
    'vars-on-top': warn,
  },
};
