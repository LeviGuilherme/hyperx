const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/hyperx.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false
    }
  },
  output: {
    filename: 'hyperx.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'HyperX',
      type: 'window',
      export: 'default'
    },
    globalObject: 'window',
    publicPath: '/dist/'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'demo/components', to: 'components' },
        { from: 'demo/hpxconfig.json', to: 'hpxconfig.json' },
        { from: 'demo/index.html', to: 'index.html' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'demo'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
  },
};
