import { merge } from 'webpack-merge';

import * as common from './webpack.common.js';

import TerserPlugin from 'terser-webpack-plugin';
export default merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      })
    ]
  }
});
