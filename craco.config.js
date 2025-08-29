const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "crypto": require.resolve("crypto-browserify"),
          "stream": require.resolve("stream-browserify"),
          "buffer": require.resolve("buffer"),
          "util": require.resolve("util"),
          "process": require.resolve("process/browser"),
          "timers": require.resolve("timers-browserify"),
          "tty": require.resolve("tty-browserify"),
          "vm": require.resolve("vm-browserify"),
          "zlib": require.resolve("zlib")
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
