const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => ({
    entry: './entry/index.ts',
    output: {
        path: require('path').join(__dirname, '../dist')
    },
    mode: env.prod ? 'production' : 'development',
    module: {
        rules: [
            {
                test: /\.ts/,
                use: [
                    {
                        loader: 'awesome-typescript-loader',
                        options: {
                            configFileName: './configs/tsconfig.json',
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        mainFields: ['module','main']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './entry/index.html'
        })
    ]
});