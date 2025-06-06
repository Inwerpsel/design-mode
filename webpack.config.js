const path = require('path');
const dashDash = require('@greenpeace/dashdash')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    watch: true,
    entry: {
        main: './docs/demo/src/style.scss',
        // preview
        // If flag can disable all components referencing a sheet, the sheet can itself be disabled if the flag is off.
        xray: './src/css/xray.scss',
        // fullheightpreview
        // view transitions
        // tutorial


        // Demo builds
        halfmoon: './docs/demo/halfmoon/style.scss',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'docs/demo/dist'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    devtool: 'source-map',
    module: {
        rules: [
            // {
            //     test: /\.(js|jsx|mjs)$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             babelrc: true,
            //         }
            //     }
            // },
            // {
            //     test: /\.tsx?$/,
            //     use: 'ts-loader',
            //     exclude: /node_modules/,
            // },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                            sourceMap: true,
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    dashDash(),
                                    // ...other plugins
                                ],
                            },
                            sourceMap: true
                        }
                    },
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "[name].css",
            chunkFilename: "[id].css",
        }),
    ],

};
