# Golden Layout

[![NPM version](https://img.shields.io/npm/v/golden-layout)](https://www.npmjs.com/package/golden-layout) [![License](https://img.shields.io/github/license/golden-layout/golden-layout)](https://img.shields.io/github/license/golden-layout/golden-layout)

<!-- [![NPM version](https://badge.fury.io/js/golden-layout.svg)](http://badge.fury.io/js/golden-layout) [![Build Status](https://travis-ci.org/deepstreamIO/golden-layout.svg?branch=master)](https://travis-ci.org/deepstreamIO/golden-layout) -->

<!-- ![Screenshot](https://cloud.githubusercontent.com/assets/512416/4584449/e6c154a0-4ffa-11e4-81a8-a7e5f8689dc5.PNG) -->

Please note that this project is currently undergoing a larger maintenance and refactoring, we're targeting a 2.0 release somewhere in H1 2020.

## Features

* Full touch support
* Native popup windows
* Completely themeable
* Comprehensive API
* Powerful persistence
* Works in IE8+, Firefox, Chrome
* Reponsive design


## Installation / Usage

**IMPORTANT: This section refers to the unreleased 2.0 version of golden-layout, so keep this in mind and use the v1.5.9 tag for current works.**

golden-layout is shipped via npm, so to use it, run `npm i -S golden-layout`. 
If you are using webpack or another module bundler, you may wish to install it as dev-dep instead. 
We are shipping an UMD version, an ES5 + ES-Module version and an ES2015+ES-Module version of the library within the package.
Modern bundlers such as webpack should pick up the ES2015 version and transpile the code according to your applications configuration.

## Demo App

We have a demo application embedded within this repository, to run it, run:

```sh
git clone github.com/golden-layout/golden-layout
cd golden-layout
npm ci # (or npm i, if you use an old npm version)
npm run start-jquery
# the app is served at localhost:3000 and uses hot-reload, so you can hack right away within the library and the application.
```

## Development

Internally, we are using webpack and babel to have a build process. 
To get started, follow the steps described in demo-app. 
You can get a complete build by running `npm run build`, which will compile all versions of the app into the `dist` folder.

