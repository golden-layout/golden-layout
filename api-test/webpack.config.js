// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require("copy-webpack-plugin");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WriteFileWebpackPlugin = require('../node_modules/write-file-webpack-plugin');

module.exports = {
    entry: [
        "./api-test/main.ts"
    ],

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/'),
    },

    devtool: 'inline-source-map',

    devServer: {
        port: 3000,
        index: "api-test/index.html"
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        "configFile": "./tsconfig.json",
                    },
                },
                exclude: /node_modules/,
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
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            env: JSON.stringify(process.env)
        }),
        new CopyWebpackPlugin(
            {
                patterns: [
                    { context: './api-test/', from: 'index.html', to: '.', force: true },
                    { context: './api-test/', from: 'styles.css', to: '.', force: true },
                ]
            },
            { copyUnmodified: true, }
        ),
        new WriteFileWebpackPlugin({
        })
    ]
};
