const path = require('path');

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
  },
};
