const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Unread count endpoint
    if (httpMethod === 'GET' && path.includes('/api/messages/user/') && path.includes('/unread-count')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          unreadCount: 0
        })
      };
    }

    // Messages endpoint
    if (httpMethod === 'GET' && path.includes('/api/messages')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([])
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
