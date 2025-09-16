// craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // ----- Resolve fallbacks (browser polyfills) -----
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        crypto: require.resolve('crypto-browserify'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        // nepoužívame: nechaj zakázané
        path: false, os: false, fs: false, vm: false, querystring: false, url: false,
        http: false, https: false, zlib: false, assert: false, constants: false,
        domain: false, events: false, punycode: false, string_decoder: false, sys: false, timers: false, tty: false,
      };

      // ----- Plugins -----
      webpackConfig.plugins = webpackConfig.plugins || [];
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        }),
        // Dôležité: NEPREPISUJ process.env (CRA ho vkladá sama).
        // Len doplň doplnkové flagy, aby nevznikal "DefinePlugin: Conflicting values for 'process.env'".
        new webpack.DefinePlugin({
          'process.browser': 'true',
          'process.node': 'false',
        })
      );

      return webpackConfig;
    },
  },

  // ----- Dev server (CRACO 6/7) — fix "allowedHosts[0] should be a non-empty string" -----
  devServer: (cfg) => {
    // povoľ localhost, 127.0.0.1 a tvoju doménu
    cfg.allowedHosts = ['localhost', '127.0.0.1', '.client-portal.sk'];
    return cfg;
  },
};
