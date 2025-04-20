const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      popup: './src/popup/popup.js',
      background: './src/background/background.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
    },
    devtool: isProduction ? false : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup']
      }),
      new CopyPlugin({
        patterns: [
          { from: './src/manifest.json', to: 'manifest.json' },
          { from: './src/config.json', to: 'config.json' }
        ]
      })
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ]
    }
  };
}; 