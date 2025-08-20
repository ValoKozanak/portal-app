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
          "vm": require.resolve("vm-browserify")
        }
      }
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
      ]
    }
  }
};
