const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        "./demo/app.js"
    ],

    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist/demo'),
    },

    resolve: {
        alias: {
            "jquery": process.env.ZEPTO ? "zepto" : "jquery"
        },
    },

    watch: true,
    devtool: "cheap-module-source-map",
    devServer: {
        port: 3000,
        index: "./demo/index.html"
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader",
                    },
                    {
                        loader: "less-loader",
                    }
                ],
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

    plugins: [
        new webpack.DefinePlugin({
            env: JSON.stringify(process.env)
        }),
        new HtmlWebpackPlugin({
            filename: "./demo/index.html"
        })
    ]
};
