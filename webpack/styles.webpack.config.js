/**
 * This file compiles the less files.
 */
const path = require("path");
const minicss = require("mini-css-extract-plugin");

module.exports = (env, argv) => ({
    entry: path.resolve("src/less/goldenlayout-base.less"),
    devtool: argv.mode === "production" ? "source-map" : "inline-source-map",
    mode: argv.mode,
    module: {
        rules: [{
            test: /\.less$/,
            exclude: /node_modules/,
            use: [
                minicss.loader,
                "css-loader",
                "less-loader"
            ],
        }],
    },
    plugins: [
        new minicss({
            filename: "./css/[name].css",
        }),
    ],
    optimization: {
        removeEmptyChunks: true,
    },
});
