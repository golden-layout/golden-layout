# Golden-Layout Toolchain Documentation

## Requirements

### JS Code

- Use up-to-date JavaScript, with an option to upgrade to typescript
- Produce an ES2015 + ESM version to consume with webpack based embedders
- Produce an ES5 + ESM version to consume with webpack based embedders and older targets
- Produce an ES5 + UMD bundle to consume baremetal
- Do **not** bundle any dependencies.

### Styles

- Use a CSS preprocessor to get better scalability
- Include an autoprefixer to compile the styles to all supported browsers
- Separate themes from base style to be imported by default
- Keep the option to ship sass mixins such as Angular Material

## Idea

- Use babel to perform ESnext -> Downlevel transpilation with webpack/babel-loader
- Once upgrade to TS is done -> replace babel-loader by ts-loader
- Use less/sass-loader to transpile styles.
- Ship it roughly in this directory structure

---

- root
  - src (input code)
    - js
      - LayoutManager.js
    - less
      - base.less
      - theme-dark.less
      - theme-light.less
    - index.js
  - dist (output products)
    - css
      - goldenlayout.css
    - umd (completely bundled variant)
      - goldenlayout.min.js
      - goldenlayout.min.js.map
      - goldenlayout.js
    - module (ES5 code, ESM modules)
      - index.js
      - js
        - LayoutManager.js
    - es2015 (ES6 code, ESM modules)
      - index.js
      - js
        - LayoutManager.js

---
