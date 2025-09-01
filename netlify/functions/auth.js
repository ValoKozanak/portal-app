const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Login endpoint
    if (httpMethod === 'POST' && path.includes('/api/auth/login')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token: 'test_token_123',
          user: {
            id: 1,
            email: 'user@portal.sk',
            name: 'Test User',
            role: 'user',
            status: 'active'
          },
          message: 'Auth function funguje!'
        })
      };
    }

    // Test endpoint
    if (httpMethod === 'GET' && path.includes('/api/auth')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Auth function funguje!',
          path: path,
          method: httpMethod,
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint nen?jden?' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
