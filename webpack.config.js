const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const nodeExternals = require('webpack-node-externals');
module.exports = env => ({
    entry: './index.ts',
    output: {
        path: require('path').join(__dirname, './dist'),
        libraryTarget: 'commonjs'
    },
    devtool: false,
    mode: env && env.prod ? 'production' : 'development',
    watch: !(env && env.prod),
    module: {
        rules: [
            {
                test: /\.ts/,
                loader: 'awesome-typescript-loader',
            },

            {
                test: /\.js/,
                loader: '@angular-devkit/build-optimizer/webpack-loader',
                options: {
                    sourceMap: false
                }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        mainFields: ['module','main']
    },
    externals: nodeExternals(),
    plugins: [
        new BundleAnalyzerPlugin({
            analyzerPort: 9999
        })
    ]
});