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

    // HR employees endpoint
    if (httpMethod === 'GET' && path.includes('/api/hr/employees')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 1,
            name: 'Test Zamestnanec',
            email: 'zamestnanec@test.sk',
            position: 'Programátor',
            department: 'IT',
            hire_date: '2024-01-01',
            salary: 2500,
            status: 'active'
          }
        ])
      };
    }

    // HR attendance endpoint
    if (httpMethod === 'GET' && path.includes('/api/hr/attendance')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 1,
            employee_id: 1,
            date: '2025-09-01',
            check_in: '08:00',
            check_out: '17:00',
            hours_worked: 8
          }
        ])
      };
    }

    // HR leave requests endpoint
    if (httpMethod === 'GET' && path.includes('/api/hr/leave-requests')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          {
            id: 1,
            employee_id: 1,
            start_date: '2025-09-15',
            end_date: '2025-09-20',
            type: 'dovolenka',
            status: 'approved'
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
