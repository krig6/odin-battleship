import { merge } from 'webpack-merge';

import { dirname, resolve } from 'path';

import { fileURLToPath } from 'url';

import * as common from './webpack.common.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

export default merge(common, {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: resolve(__dirname, 'dist')
    },
    port: 3000,
    open: true,
    compress: true,
    hot: true
  }
});
