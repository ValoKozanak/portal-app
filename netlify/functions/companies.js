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

    // Companies endpoint - reaguje na všetky metódy
    if (path.includes('/api/companies')) {
      
      // GET - získať firmy
      if (httpMethod === 'GET') {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data || [])
        };
      }

      // POST - vytvoriť novú firmu
      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        
        const { data, error } = await supabase
          .from('companies')
          .insert([body])
          .select();

        if (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'Firma bola úspešne uložená',
            company: data[0]
          })
        };
      }

      // PUT - aktualizovať firmu
      if (httpMethod === 'PUT') {
        const body = JSON.parse(event.body || '{}');
        const companyId = body.id;
        
        if (!companyId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID firmy je povinné' })
          };
        }

        const { data, error } = await supabase
          .from('companies')
          .update(body)
          .eq('id', companyId)
          .select();

        if (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Firma bola úspešne aktualizovaná',
            company: data[0]
          })
        };
      }

      // DELETE - vymazať firmu
      if (httpMethod === 'DELETE') {
        const companyId = event.queryStringParameters?.id;
        
        if (!companyId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'ID firmy je povinné' })
          };
        }

        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', companyId);

        if (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Firma bola úspešne vymazaná'
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
