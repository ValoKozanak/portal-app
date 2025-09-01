const axios = require('axios');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path } = event;

    // Dropbox test endpoint
    if (path === '/api/dropbox/test') {
      const token = process.env.DROPBOX_ACCESS_TOKEN;

      if (!token) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dropbox token nie je nastavený' })
        };
      }

      // Test Dropbox API
      try {
        const response = await axios({
          method: 'POST',
          url: 'https://api.dropboxapi.com/2/users/get_current_account',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            account: response.data,
            message: 'Dropbox API funguje!'
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Dropbox API chyba',
            details: error.message
          })
        };
      }
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
