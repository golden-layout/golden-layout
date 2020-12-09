// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: [
        "./api-test/styles.css",
        "./api-test/golden-layout.less",
        "./api-test/main.ts",
    ],

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/'),
    },

    devtool: 'inline-source-map',

    devServer: {
        port: 3000,
        writeToDisk: true,
        publicPath: '/api-test/dist/',
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            {
                test: /(.ts|.tsx)$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        "configFile": "./tsconfig.json",
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
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
                    },
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
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "index.html")
        }),
    ]
};
