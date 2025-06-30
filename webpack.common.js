import { dirname, resolve } from 'path';

import { fileURLToPath } from 'url';

import HTMLWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

export const entry = {
  bundle: resolve(__dirname, 'src/index.js')
};
export const output = {
  filename: '[name].[contenthash].js',
  path: resolve(__dirname, 'dist'),
  clean: true
};
export const module = {
  rules: [
    {
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'assets/images/[name][ext]'
      }
    }
  ]
};
export const plugins = [
  new HTMLWebpackPlugin({
    filename: 'index.html',
    template: 'src/template.html',
    title: '',
    favicon: ''
  })
];
