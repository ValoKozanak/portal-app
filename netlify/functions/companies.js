const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Test endpoint
    if (httpMethod === 'GET' && path.includes('/api/companies')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Companies function funguje!',
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
