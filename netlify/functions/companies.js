const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Companies endpoint - reaguje na v?etky met?dy
    if (path.includes('/api/companies')) {
      if (httpMethod === 'GET') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify([]) // Pr?zdny array pre frontend
        };
      }
      
      if (httpMethod === 'POST') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Firma bola ?spe?ne ulo?en?',
            companyId: 1
          })
        };
      }
      
      if (httpMethod === 'PUT') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Firma bola ?spe?ne aktualizovan?'
          })
        };
      }
      
      if (httpMethod === 'DELETE') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Firma bola ?spe?ne vymazan?'
          })
        };
      }
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
