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

      // Pre financial analysis endpoint vracame správnu štruktúru
      if (path.includes('/financial-analysis')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            total: 0,
            income: 0,
            expenses: 0,
            profit: 0,
            revenue: 0,
            costs: 0,
            margin: 0,
            period: '2025',
            currency: 'EUR'
          })
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
