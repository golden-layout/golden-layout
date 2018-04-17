import webpack from 'webpack'
import chalk from 'chalk'
import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import postcssNext from 'postcss-cssnext'
import postcssImport from 'postcss-import'
import postcssExtend from 'postcss-extend'
import postcssReporter from 'postcss-reporter'
import StyleLintPlugin from 'stylelint-webpack-plugin'
import BrowserSyncPlugin from 'browser-sync-webpack-plugin'
import WebpackCompileHooksPlugin from './webpack_plugins/WebpackCompileHooksPlugin.js'
import MinifyPlugin from 'babel-minify-webpack-plugin';
import _ from 'lodash'
const { execSync } = require('child_process')
const concat = require('concat-files')
const Walker = require( 'walker' )
const fs = require('fs')
const extractLESS = new ExtractTextPlugin({filename: 'css/[name].css'})
const extractStyles = new ExtractTextPlugin({ filename: 'css/[name].css' })

var compileHooksIsRunning = false
var data = { files: [], directories: [] }
var basePath = path.resolve( __dirname)
var jsPath = path.join( basePath, 'src/js' )

const postcssProcessors = [
  postcssImport,
  postcssExtend,
  postcssNext,
  postcssReporter({ clearReportedMessages: true }),
]

const scssProcessors = [
  postcssReporter({ clearReportedMessages: true }),
]


var babelQuery = {
  cacheDirectory: false,
  plugins: [
    'transform-runtime',
  ],
  presets: [
    'es2015',
    'stage-2'
  ]
}


module.exports = (env) => {
  const stylesType = process.env.STYLES // postcss or scss
  const stylesExtension = stylesType === 'scss' ? '.scss' : '.css'

  return {
    context: path.resolve(__dirname, 'src'),

    entry: {
      main: './app.js',
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].js',
    },

    watch: env.dev,

    devtool: 'cheap-module-source-map',

    devServer: {
      contentBase: path.join(__dirname, "dist"),
      watchContentBase: true,
    },

    module: {
      rules: [
        {
          test: /\.less$/,
          use: extractLESS.extract([ 'css-loader', 'less-loader' ])

        },
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'src/js'),
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                plugins: ['transform-runtime'],
              },
            },
            {
              loader: 'eslint-loader',
              options: {
                cache: true,
                emitWarning: true,
                configFile: '.eslintrc',
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: extractStyles.extract({
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true,
                  plugins: postcssProcessors,
                },
              },
            ],
            publicPath: '../',
          }),
        },
        {
          test: /\.scss$/,
          use: extractStyles.extract({
            use: [
              {
                loader: "css-loader",
                options: {
                  sourceMap: true,
                },
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true,
                  plugins: scssProcessors,
                },
              },
              {
                loader: "sass-loader",
                options: {
                  sourceMap: true,
                },
              },
            ],
            publicPath: '../',
          }),
        },
        {
          test: /.*\.(gif|png|jpe?g|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'assets/[name].[ext]',
              },
            },
          ],
        },
        {
          test: /\.(woff2?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'assets/[name].[ext]',
              },
            },
          ],
        },
      ],
    },

    plugins: [
    new CopyWebpackPlugin([
        // // {output}/file.txt
        // { from: 'path/to/file.txt' },
        // // {output}/path/to/build/file.txt
        // { from: 'path/to/file.txt', to: 'path/to/build/file.txt' },
        // // {output}/path/to/build/directory/file.txt
        // { from: 'path/to/file.txt', to: 'path/to/build/directory' },
        // // Copy directory contents to {output}/
        // { from: 'path/to/directory' },
        // Copy directory contents to {output}/path/to/build/directory/
        { from: '../lib/tracing.js/tracing.js', to: 'lib/' },
        { from: 'my_traces.js' },
        { from: '../lib/jquery.js', to: 'lib/' },
        // // {output}/file/without/extension
        // {
        //     from: 'path/to/file.txt',
        //     to: 'file/without/extension',
        //     toType: 'file'
        // },
        // // {output}/directory/with/extension.ext/file.txt
        // {
        //     from: 'path/to/file.txt',
        //     to: 'directory/with/extension.ext',
        //     toType: 'dir'
        // }
    ], {
        ignore: [
            // Doesn't copy any files with a txt extension
            // '*.txt'
        ]
    }),
    new WebpackCompileHooksPlugin({
        onBuildStart: function(){
          console.log(chalk.cyan("\n>>> onBuildStart\n"))
          if(compileHooksIsRunning) return
          compileHooksIsRunning = true

          var namespace = function( segments, node ) {
            for( var i = 0; i < segments.length; i++ ) {
              if( segments[ i ].length === 0 ) continue;
              if( !node[ segments[ i ] ] ) {
                node[ segments[ i ] ] = {};
              }
              node = node[ segments[ i ] ];
            }
          }

          var walker = Walker( jsPath ) // jshint ignore:line
          var newlineFile = '/../../build/newline.txt'
          var preWrapFile = '/../../build/wrapperStart.txt'
          var nsFile = '/../../build/ns.js'
          var postWrapFile = '/../../build/wrapperEnd.txt'

          var earlyFiles = [ 
            newlineFile,
            preWrapFile,
            '/../../build/ns.js',
            '/utils/utils.js',
            '/utils/EventEmitter.js',
            '/utils/DragListener.js',
           ]

          walker.on( 'file', function( file ) {
            var filePath = file.replace( jsPath, '' )
            // console.log('processing file:', filePath)
            if( earlyFiles.indexOf( filePath ) === -1 ) {
              data.files.push( filePath )
            }
          })

          walker.on( 'dir', function( dir ) {
            // console.log('processing dir:', dir)
            data.directories.push( dir )
          })

          walker.on( 'end', function() {
            data.files.sort()
            fs.writeFileSync( jsPath + newlineFile, '\n\n\n' )
            fs.writeFileSync( jsPath + preWrapFile, '(function($){\n' )
            fs.writeFileSync( jsPath + postWrapFile, '\n})(window.$);' )
            data.files = (earlyFiles.concat( data.files )).concat([postWrapFile])
            data.directories.sort()
            var directories = {}
            data.directories.forEach( function( dir ) {
              namespace( dir.replace( jsPath, '' ).split( path.sep ), directories )
            })
            data.directories = directories
            fs.writeFileSync( jsPath + nsFile, 'var lm=' + JSON.stringify( data.directories ) + ';\n' )
          })
        },

        onBuildEnd: function(){
          console.log(chalk.cyan("\n>>> onBuildEnd\n"))
          var distFile = 'dist/goldenlayout.js'
          var newlineFile = jsPath + data.files[0]
          var fileArray = _.flatten(_.map(data.files, (p) => [jsPath + p, newlineFile]))
          // console.log('final files:', fileArray)
          concat(fileArray, distFile, function(err) {
            if (err) throw err
          })
          data.files = []
          data.directories = []
          compileHooksIsRunning = false
          }
      }),

      new webpack.DefinePlugin({
        LANG: JSON.stringify("en"),
      }),

      new webpack.optimize.CommonsChunkPlugin({
        name: "common",
      }),

      new HtmlWebpackPlugin({
        template: 'index.html'
      }),

      extractStyles,
      extractLESS,

      new StyleLintPlugin({
        configFile: '.stylelintrc',
        context: 'src/' + stylesType,
        files: '**/*' + stylesExtension,
        failOnError: false,
        quiet: true,
      }),

      env.dev ? () => null : new MinifyPlugin,

      new BrowserSyncPlugin({
        files: "dist/**/*.*",
        hostname: "localhost",
        port: 8080,
        server: { baseDir: ['dist'] },
        reloadDelay: 50,
        injectChanges: false,
        reloadDebounce: 500,
        reloadOnRestart: true,
      }),
    ],
    resolve: {
        alias: {
            'less': path.join(__dirname, 'src/less'),
            'css': path.join(__dirname, 'src/css'),
        }
    },    
  }
}
