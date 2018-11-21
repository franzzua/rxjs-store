const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = env => ({
    entry: './index.ts',
    output: {
        path: require('path').join(__dirname, './dist'),
        libraryTarget: 'commonjs'
    },
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
    plugins: [
        new BundleAnalyzerPlugin({
            analyzerPort: 9999
        })
    ]
});