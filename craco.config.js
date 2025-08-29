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
          "path": require.resolve("path-browserify"),
          "os": require.resolve("os-browserify/browser"),
          "querystring": require.resolve("querystring-es3"),
          "url": require.resolve("url"),
          "assert": require.resolve("assert"),
          "constants": require.resolve("constants-browserify"),
          "domain": require.resolve("domain-browser"),
          "events": require.resolve("events"),
          "http": require.resolve("http-browserify"),
          "https": require.resolve("https-browserify"),
          "punycode": require.resolve("punycode"),
          "string_decoder": require.resolve("string_decoder"),
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
  },
  devServer: {
    allowedHosts: 'all'
  }
};
