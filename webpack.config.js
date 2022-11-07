const path = require('path')
const CopyPlugin = require("copy-webpack-plugin")

const srcDir = path.join(__dirname, 'src')
const destDir = path.join(__dirname, 'dist')

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(destDir),
    },
    devServer: {
        static: {
            directory: path.resolve(destDir)
        },
        compress: true,
        port: 8080
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: path.resolve(srcDir, 'index.html'), to: path.resolve(destDir, 'index.html') },
                { from: path.resolve(srcDir, 'styles.css'), to: path.resolve(destDir, 'styles.css') }
            ]
        })
    ]
}