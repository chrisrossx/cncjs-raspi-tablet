const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
    entry: './src/app.js',
    mode: "development",
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js'
    },
    // resolve: {
    //     mainFields: ['director'],
    //   },
    plugins: [
        // new webpack.ProvidePlugin({
        //     $: "jQuery",
        //     jQuery: "jQuery"
        // }),
        new NodePolyfillPlugin(),
        new MiniCssExtractPlugin(), // Plug-in Loader for sperate css into seperate bundle of just css,
        new CleanWebpackPlugin() // Deletes dist folder old files before running build. prevents stale files
    ],
    module: {
        rules: [
            // start scss
            {
                test: /\.(scss)$/,
                use: [{
                    loader: MiniCssExtractPlugin.loader // Extracts css into seperate file rather that style-loader which imbeds into js file
                }, {
                    loader: 'css-loader', // translates CSS into CommonJS modules
                }, {
                    loader: 'postcss-loader', // Run post css actions
                    options: {
                        postcssOptions: {
                            plugins: [
                                'precss',
                                'autoprefixer'
                            ]
                        }
                    }
                }, {
                    loader: 'sass-loader' // compiles Sass to CSS
                }]
            },
            // end scss        

            // start Fontawesome 5.6
            {
                test: /\.(svg|eot|woff|woff2|ttf)$/,
                type: 'asset/inline'
            }
            // end Fontawesome


        ]
    }
};