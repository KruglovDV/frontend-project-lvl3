const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: './src/index.js',
  plugins: [
      new HtmlWebpackPlugin({
        title: 'Development',
        template: 'index.html',
      }),
  ],
};
