const path = require('path')
const CopyPlugin = require("copy-webpack-plugin")
/*const CompressionPlugin = require("compression-webpack-plugin")
const WebpackBundleAnalyzer = require('webpack-bundle-analyzer')*/

const srcDir = path.join(__dirname, 'src')
const destDir = path.join(__dirname, 'dist')

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
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
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
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
                { from: path.resolve(srcDir, 'styles.css'), to: path.resolve(destDir, 'styles.css') },
                { from: path.resolve(__dirname, 'node_modules/itm-webassembly/em_bin'), to: path.resolve(destDir) }, // NOTE: dest dir should be em_bin but webpack is funny
                { from: path.resolve(__dirname, 'node_modules/itm-webassembly/itm-webassembly.js'), to: path.resolve(destDir) }
            ]
        }),
        /*new CompressionPlugin({
            test: 'bundle.js'
        }),
        new WebpackBundleAnalyzer.BundleAnalyzerPlugin()*/
    ]
}