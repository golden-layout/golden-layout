var webpack = require('webpack')
var path = require('path')

module.exports = function (config) {
  config.set({
    logLevel: config.LOG_INFO,
    browsers: ['Chrome'],
    colors: true,
    client: {
      clearContext: false
    },
    failOnEmptyTestSuite: false,
    coverageReporter: {
      reporters: [
        { type: 'text' },
        { type: 'html', subdir: 'html' }
      ],
    },
    frameworks: [
      'jasmine',
      'webpack'
    ],
    files: [
      'test/tests.index.js',
      'dist/css/goldenlayout-base.css',
      'dist/css/themes/goldenlayout-light-theme.css',
      { pattern: 'dist/img/*', included: false }
    ],
    preprocessors: {
      'test/tests.index.js': ['webpack', 'sourcemap']
    },
    reporters: config.coverage ? ['progress', 'coverage'] : ['progress', 'kjhtml'],
    webpack: {
      cache: true,
      devtool: 'inline-source-map',
      resolve: {
        extensions: ['.js'],
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            enforce: 'pre',
            use: ['source-map-loader']
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin({
          env: JSON.stringify(process.env)
        }),
      ]
    },

  });
};
