/* eslint-disable */

const path = require('path');
const { SourceMapDevToolPlugin } = require('webpack');

const generateCommonConfig = (isDev) => ({
    entry: path.resolve(__dirname, '..', 'src', 'index.ts'),
    resolve: {
        extensions: ['.ts'],
    },
    mode: isDev ? 'development' : 'production',
    devtool: false,
    plugins: isDev ? [new SourceMapDevToolPlugin({})] : [],
});

const generateTsLoaderBlock = (filename) => ({
    module: {
        rules: [
            {
                test: /.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, '..', filename),
                    },
                },
                exclude: /node_modules/,
            },
        ]
    },
});

const generateUmdConfig = (isDev) => {
    return {
        ...generateCommonConfig(isDev),
        ...generateTsLoaderBlock('tsconfig.module.json'),
        output: {
            filename: isDev ? './bundle/umd/golden-layout.js' : './bundle/umd/golden-layout.min.js',
            library: {
                name: 'goldenLayout',
                type: 'umd',
            }
        },
    }
}

const generateEsmConfig = (isDev) => {
    return {
        ...generateCommonConfig(isDev),
        ...generateTsLoaderBlock('tsconfig.module.json'),
        output: {
            filename: isDev ? './bundle/esm/golden-layout.js' : './bundle/esm/golden-layout.min.js',
            library: {
                type: 'module',
            }
        },
        experiments: {
            outputModule: true,
        }
    }
};

module.exports = [
    generateUmdConfig(false),
    generateUmdConfig(true),
    generateEsmConfig(false),
    generateEsmConfig(true),
];
