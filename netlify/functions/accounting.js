const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Simple test endpoint - reaguje na všetky GET requests
    if (httpMethod === 'GET' && path.includes('/api/accounting')) {
      // Pre invoice endpoints vracame prázdny array
      if (path.includes('/received-invoices') || path.includes('/issued-invoices')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([])
        };
      }

      // Pre ostatné accounting endpointy vracame test objekt
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Accounting function funguje!',
          timestamp: new Date().toISOString(),
          path: event.path,
          method: event.httpMethod
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
