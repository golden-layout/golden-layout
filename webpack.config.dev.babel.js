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
const concat = require('concat-files')
const Walker = require( 'walker' )
const fs = require('fs')
const extractLESS = new ExtractTextPlugin({filename: path.join('css', 'goldenlayout.css')})
const extractStyles = new ExtractTextPlugin({ filename: path.join('css', 'goldenlayout.css') })

console.log('process.env', process.env.ZEPTO)

var compileHooksIsRunning = false
var data = { files: [], directories: [] }
var basePath = path.resolve( __dirname)
var jsPath = path.join( basePath, process.env.ES6 ?  path.join('src', 'js_es6') : path.join('src', 'js'))
var jsDir = path.join('dist', 'js')
var cssDir = path.join('dist', 'css')
var distFile = 'goldenlayout.js' // for Prototype build only (ES6 is managed by webpack config)

const postcssProcessors = [
  postcssImport,
  postcssExtend,
  postcssNext,
  postcssReporter({ clearReportedMessages: true }),
]

const scssProcessors = [
  postcssReporter({ clearReportedMessages: true }),
]


module.exports = (env) => {
  const stylesType = process.env.STYLES // postcss or scss
  const stylesExtension = stylesType === 'scss' ? '.scss' : '.css'

  return {
    context: path.resolve(__dirname, 'src'),

    resolve: {
        alias: {
            'js': jsPath,
            'less': path.join(__dirname, path.join('src', 'less')),
            'css': path.join(__dirname, path.join('src', 'css')),
        }
    },    

    entry: {
      // non-ES6 (Prototype/concat build) needs a dummy name or it will overwrite
      [process.env.ES6 ? 'goldenlayout' : 'dummy']: env.dev ? ('.' + path.sep + 'app.js') : ('.' + path.sep + 'index.js'),
    },


    externals: {
      "jQuery": "jquery",
      "Zepto": "zepto"
    },

    output: Object.assign({
      path: path.resolve(__dirname, 'dist'),
      filename: path.join('js', '[name].js'),
    }, process.env.dev ? {} : {
      library: 'GoldenLayout',
      libraryTarget: 'umd', // should be umd for npm-package
      umdNamedDefine: true      
    }),

    watch: env.dev || env.build_watch,

    devtool: 'cheap-module-source-map',

    devServer: {
      contentBase: path.join(__dirname, "dist"),
      watchContentBase: true,
    },

    module: {
      rules: _.compact(
        (process.env.ZEPTO ? [ 
          {
            test: /\.zepto/,
            use: [ 'script-loader' ]
          },
        ] : []).concat([

        {
          test: /\.less$/,
          use: extractLESS.extract([ 'css-loader', 'less-loader' ])

        },

        {
          test: /\.js$/,
          include: path.resolve(__dirname, jsPath),
          use: [

            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                plugins: ['transform-runtime', 'transform-class-properties'],
              },
            },
            {
              loader: 'eslint-loader',
              options: {
                cache: true,
                emitWarning: true,
                configFile: '.eslintrc.js',
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
                name: path.join('assets', '[name].[ext]'),
              },
            },
          ],
        },
      

      ])),
    },

    plugins: _.compact([
        // new webpack.ProvidePlugin({
        //    'window.$': 'zepto',
        //    'Zepto': 'zepto',
        // }),

        process.env.JQUERY ? new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery",
          "window.jQuery": "jquery"
        }): null,

        new CopyWebpackPlugin(process.env.ES6 ? [] : [
              { from: path.join('..', 'lib', 'jquery.js'), to: 'lib' + path.sep },
          ].concat(env.dev ? [
              { from: 'my_traces.js' },
              { from: path.join('..', 'lib', 'tracing.js', 'tracing.js'), to: 'lib' + path.sep },
          ]: []), {
        ignore: [
            // Doesn't copy any files with a txt extension
            // '*.txt'
        ]
    }),

    process.env.ES6 ? null : new WebpackCompileHooksPlugin({
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
          var newlineFile = path.sep + path.join('..', '..', 'build', 'newline.txt')
          var preWrapFile = path.sep + path.join('..', '..', 'build', 'wrapperStart.txt')
          var nsFile = path.sep + path.join('..', '..', 'build', 'ns.js')
          var postWrapFile = path.sep + path.join('..', '..', 'build', 'wrapperEnd.txt')

          var earlyFiles = [ 
            newlineFile,
            preWrapFile,
            path.sep + path.join('..', '..', 'build', 'ns.js'),
            path.sep + path.join('utils', 'utils.js'),
            path.sep + path.join('utils', 'EventEmitter.js'),
            path.sep + path.join('utils', 'DragListener.js'),
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
          var newlineFile = jsPath + data.files[0]
          var fileArray = _.flatten(_.map(data.files, (p) => [jsPath + p, newlineFile]))
          // console.log('final files:', fileArray)
          
          data.files = []
          data.directories = []
          compileHooksIsRunning = false
          var prototypeDistFile = path.join(basePath, jsDir, distFile)
          concat(fileArray, prototypeDistFile, function(err) {
            if (err) throw err
          })              
          env.build && setTimeout(() => {
            // since we use a gulp-concat-like build process, we delete the files that webpack builds in order not to cause confusion
            try {
              console.log('unlinking...')
              fs.unlinkSync(path.join(basePath, jsDir, 'dummy.js'))                
              fs.unlinkSync(path.join(basePath, jsDir, 'dummy.js.map'))                
            } catch (err) {
              console.log('done')
            }
          }, 1000)
        }
      }),

      new webpack.DefinePlugin({
        env: JSON.stringify(process.env)
      }),

      extractStyles,
      extractLESS,

      new StyleLintPlugin({
        configFile: '.stylelintrc',
        context: path.join('src', stylesType),
        files: '**/*' + stylesExtension,
        failOnError: false,
        quiet: true,
      }),
    ].concat(env.dev ? [

      new HtmlWebpackPlugin({
        template: process.env.ES6 ? 'index_es6.html' : 'index_prototype.html',
        support_library: process.env.JQUERY ? path.join('lib', 'jquery.js'): path.join('lib', 'zepto.js')
      }),

      new MinifyPlugin,

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

    ] : [])),
  }
}
