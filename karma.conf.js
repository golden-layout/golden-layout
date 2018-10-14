var webpack = require('webpack')
var path = require('path')

module.exports = function (config) {
  config.set({
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
  ],
  files: [
      'lib/jquery.js',
      'dist/js/goldenlayout.js',
      'test/tests.index.js',
  ],
  preprocessors: {
      'test/tests.index.js': ['webpack', 'sourcemap'],
  },
  reporters: config.coverage ? ['progress', 'coverage'] : ['progress', 'kjhtml'],
    webpack: {
    cache: true,
    devtool: 'inline-source-map',
    resolve: {
        alias: {
            'js': path.join(__dirname, 'src/js_es6'),
            'less': path.join(__dirname, path.join('src', 'less')),
            'css': path.join(__dirname, path.join('src', 'css')),            
        }
    },          
    module: {
        loaders: [
        {
          test: /\.less$/,
          use: [ 'ignore-loader' ]

        },        
        {
          test: /\.css$/,
          use: [ 'ignore-loader' ]

        },        
        {
            enforce: 'pre',
            test: /\.js$/,
            include: /test/,
            exclude: /node_modules/,
            use: [{ loader: 'babel-loader' }]
        },
        {
            enforce: 'pre',
            test: /\.js$/,
            include: /src\/js_es6/,
            exclude: /node_modules/,
            use: [{ loader: 'istanbul-instrumenter-loader', query: { esModules: true } }]
        },

        {
            test: /\.js$/,
            include: /src/,
            exclude: /node_modules|test/,
            use: [{ loader: 'babel-loader' }]
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
