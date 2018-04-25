const error = 2;
const warn = 1;
const ignore = 0;

module.exports = {
  extends: ['eslint-config-airbnb', 'plugin:jest/recommended', 'prettier'],
  plugins: ['prettier', 'jest', 'react', 'json'],
  "env": {
    "browser": true,
    "es6": true,
    "jquery": true
  },
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "module"
  },
  "globals": {
      "lm": warn
  },  
  "rules": {
    "strict": ignore,
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
    "no-undef": "off",
    "no-undefined": "off",
    "no-undef-init": "off",
    "no-param-reassign": [
      "warn",
      {
        "props": true
      }
    ],
    "no-unused-vars": "warn"
  }
}
