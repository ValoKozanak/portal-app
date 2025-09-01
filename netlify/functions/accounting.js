const axios = require('axios');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path } = event;

    // Test endpoint
    if (path === '/api/accounting/test-dropbox-token') {
      const token = process.env.DROPBOX_ACCESS_TOKEN;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenStart: token ? token.substring(0, 10) + '...' : 'none',
          message: token ? 'Token je nastavený' : 'Token nie je nastavený'
        })
      };
    }

    // Simple test endpoint
    if (path === '/api/accounting/simple-test') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Accounting function funguje!',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint nenájdený' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
