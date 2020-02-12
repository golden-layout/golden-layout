import webpack from "webpack";
import path from "path";
import ExtractTextPlugin from "extract-text-webpack-plugin";
import postcssNext from "postcss-cssnext";
import postcssImport from "postcss-import";
import postcssExtend from "postcss-extend";
import postcssReporter from "postcss-reporter";
import _ from "lodash";

const extractLESS = new ExtractTextPlugin({
    filename: path.join("css", "goldenlayout.css")
});
const extractStyles = new ExtractTextPlugin({
    filename: path.join("css", "goldenlayout.css")
});

var basePath = path.resolve(__dirname);
var jsPath = path.join(
    basePath,
    path.join("src", "js_es6"),
);

const postcssProcessors = [
    postcssImport,
    postcssExtend,
    postcssNext,
    postcssReporter({ clearReportedMessages: true })
];

const scssProcessors = [postcssReporter({ clearReportedMessages: true })];

module.exports = env => {
    return {
        context: path.resolve(__dirname, "src"),

        resolve: {
            alias: {
                js: jsPath,
                less: path.join(__dirname, path.join("src", "less")),
                css: path.join(__dirname, path.join("src", "css"))
            }
        },

        entry: {
            goldenlayout: env.dev
                ? "." + path.sep + "app.js"
                : "." + path.sep + "index.js"
        },

        externals: {
            jQuery: "jquery",
            Zepto: "zepto"
        },

        output: Object.assign(
            {
                path: path.resolve(__dirname, "dist"),
                filename: path.join("js", "[name].js")
            },
            process.env.dev
                ? {}
                : {
                      library: "GoldenLayout",
                      libraryTarget: "umd", // should be umd for npm-package
                      umdNamedDefine: true
                  }
        ),

        watch: env.dev || env.build_watch,

        devtool: "cheap-module-source-map",

        devServer: {
            contentBase: path.join(__dirname, "dist"),
            watchContentBase: true
        },

        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: extractLESS.extract(["css-loader", "less-loader"])
                },

                {
                    test: /\.js$/,
                    include: [
                        path.resolve(__dirname, jsPath),
                        path.join(__dirname, "test"),
                        path.join(__dirname, "test/specs")
                    ],
                    exclude: /node_modules/,
                    use: _.compact([
                        {
                            loader: "babel-loader",
                            query: {
                                babelrc: false,
                                cacheDirectory: true,
                                plugins: [
                                    "transform-runtime",
                                    "transform-class-properties"
                                ]
                            }
                        }
                    ])
                },
                {
                    test: /\.css$/,
                    use: extractStyles.extract({
                        use: [
                            {
                                loader: "css-loader",
                                options: {
                                    sourceMap: true
                                }
                            },
                            {
                                loader: "postcss-loader",
                                options: {
                                    sourceMap: true,
                                    plugins: postcssProcessors
                                }
                            }
                        ],
                        publicPath: "../"
                    })
                },
                {
                    test: /.*\.(gif|png|jpe?g|svg)$/i,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: "assets/[name].[ext]"
                            }
                        }
                    ]
                },
                {
                    test: /\.(woff2?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: path.join("assets", "[name].[ext]")
                            }
                        }
                    ]
                }
            ]
        },

        plugins: _.compact(
            [
                process.env.JQUERY
                    ? new webpack.ProvidePlugin({
                          $: "jquery",
                          jQuery: "jquery",
                          "window.jQuery": "jquery"
                      })
                    : null,

                new webpack.DefinePlugin({
                    env: JSON.stringify(process.env)
                }),

                extractStyles,
                extractLESS
            ].concat(
                env.dev ? [] : [/* new MinifyPlugin() */]
            )
        )
    };
};
