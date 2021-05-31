/* eslint-disable */

const { SourceMapDevToolPlugin } = require('webpack');

module.exports = {
    entry: './dist/esm/index.js',
    mode: 'production',
    output: {
        filename: './bundle/golden-layout.js',
        library: {
            name: 'goldenLayout',
            type: 'umd',
        },
    },
    devtool: false,
    plugins: [new SourceMapDevToolPlugin({
        filename: './bundle/golden-layout.js.map',
    })],
};
