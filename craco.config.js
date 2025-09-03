const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "crypto": require.resolve("crypto-browserify"),
        "util": require.resolve("util/"),
        "buffer": require.resolve("buffer/"),
        "process": require.resolve("process/browser"),
        "stream": require.resolve("stream-browserify"),
        "path": false,
        "os": false,
        "fs": false,
        "vm": false,
        "querystring": false,
        "url": false,
        "http": false,
        "https": false,
        "zlib": false,
        "assert": false,
        "constants": false,
        "domain": false,
        "events": false,
        "punycode": false,
        "string_decoder": false,
        "sys": false,
        "timers": false,
        "tty": false
      };

      // Add plugins
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        new webpack.DefinePlugin({
          'process.env': {},
          'process.version': JSON.stringify(process.version),
          'process.platform': JSON.stringify(process.platform),
          'process.arch': JSON.stringify(process.arch),
          'process.browser': true,
          'process.node': false
        })
      );

      return webpackConfig;
    }
  }
};
