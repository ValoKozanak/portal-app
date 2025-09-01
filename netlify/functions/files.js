const { createClient } = require('@supabase/supabase-js');

// Inicializácia Supabase klienta
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // Files endpoint
    if (httpMethod === 'GET' && path.includes('/api/files/company')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 1,
            name: 'test.mdb',
            type: 'database',
            size: 1024000,
            uploaded_at: '2025-09-01T12:00:00Z',
            company_id: 1
          }
        ])
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
