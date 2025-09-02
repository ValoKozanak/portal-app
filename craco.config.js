const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "crypto": require.resolve("crypto-browserify"),
          "util": require.resolve("util/"),
          "buffer": require.resolve("buffer/"),
          "process": require.resolve("process/browser"),
          "stream": require.resolve("stream-browserify"),
          "path": false,
          "os": false,
          "fs": false,
          "vm": false
        }
      }
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        new webpack.DefinePlugin({
          'process.env': {},
          'process.version': JSON.stringify(process.version),
          'process.platform': JSON.stringify(process.platform),
          'process.arch': JSON.stringify(process.arch),
        })
      ]
    }
  }
};
