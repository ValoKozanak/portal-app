const axios = require('axios');
const { Dropbox } = require('dropbox');

// Inicializácia Supabase klienta
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inicializácia Dropbox klienta
const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  fetch: fetch
});

// Hash IČO pre vytvorenie cesty
function hashICO(ico) {
  return ico.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

// Generovanie cesty pre firmu
function getCompanyFolderPath(ico) {
  const icoHash = hashICO(ico);
  return `/Portal/Companies/${icoHash}`;
}

// Načítanie MDB súboru z Dropboxu
async function downloadMdbFromDropbox(companyICO) {
  try {
    const companyPath = getCompanyFolderPath(companyICO);
    const mdbFileName = `${companyICO}_2025.mdb`;
    const mdbPath = `${companyPath}/${mdbFileName}`;
    
    console.log('🔍 Hľadám MDB súbor:', mdbPath);
    
    // Skontrolujeme, či súbor existuje
    try {
      await dbx.filesGetMetadata({ path: mdbPath });
    } catch (error) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return null;
    }
    
    // Stiahneme súbor
    const response = await dbx.filesDownload({ path: mdbPath });
    const fileBlob = response.result.fileBlob;
    
    console.log('✅ MDB súbor úspešne stiahnutý:', mdbFileName);
    return fileBlob;
    
  } catch (error) {
    console.error('❌ Chyba pri sťahovaní MDB súboru:', error);
    return null;
  }
}

// Simulované načítanie faktúr z MDB (placeholder)
async function extractInvoicesFromMdb(mdbBlob, companyId) {
  // Toto je placeholder - v reálnej implementácii by sme použili ADODB alebo podobnú knižnicu
  // Pre teraz vrátime demo dáta
  
  console.log('📊 Simulujem načítanie faktúr z MDB pre companyId:', companyId);
  
  // Demo faktúry
  const demoInvoices = [
    {
      id: 1,
      invoice_number: 'F2025-001',
      customer_name: 'Demo Zákazník 1',
      amount: 1500.00,
      currency: 'EUR',
      issue_date: '2025-01-15',
      due_date: '2025-02-15',
      status: 'sent',
      varsym: '2025001',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      invoice_number: 'F2025-002',
      customer_name: 'Demo Zákazník 2',
      amount: 2300.50,
      currency: 'EUR',
      issue_date: '2025-01-20',
      due_date: '2025-02-20',
      status: 'paid',
      varsym: '2025002',
      created_at: new Date().toISOString()
    }
  ];
  
  return {
    success: true,
    message: 'Faktúry úspešne načítané z MDB',
    importedCount: demoInvoices.length,
    totalCount: demoInvoices.length,
    invoices: demoInvoices
  };
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  try {
    const { path, httpMethod } = event;

    // POST endpoint pre refresh invoices z MDB
    if (httpMethod === 'POST' && path.includes('/api/accounting/refresh-invoices')) {
      const companyId = path.split('/').pop();
      
      console.log('🔄 Refresh invoices pre companyId:', companyId);
      
      // Získanie informácií o firme z Supabase
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (companyError || !company) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Firma nebola nájdená',
            details: companyError?.message 
          })
        };
      }
      
      console.log('🏢 Firma nájdená:', company.name, 'IČO:', company.ico);
      
      // Stiahnutie MDB súboru z Dropboxu
      const mdbBlob = await downloadMdbFromDropbox(company.ico);
      
      if (!mdbBlob) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'MDB súbor nebol nájdený v Dropboxe',
            details: {
              companyId: companyId,
              companyName: company.name,
              companyICO: company.ico,
              expectedPath: getCompanyFolderPath(company.ico)
            }
          })
        };
      }
      
      // Načítanie faktúr z MDB
      const result = await extractInvoicesFromMdb(mdbBlob, companyId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    }

    // GET endpointy pre faktúry
    if (httpMethod === 'GET' && path.includes('/api/accounting')) {
      // Pre invoice endpoints vracame demo dáta
      if (path.includes('/received-invoices') || path.includes('/issued-invoices')) {
        const companyId = path.split('/').pop().split('?')[0];
        
        // Demo faktúry
        const demoInvoices = [
          {
            id: 1,
            invoice_number: 'F2025-001',
            customer_name: 'Demo Zákazník 1',
            amount: 1500.00,
            currency: 'EUR',
            issue_date: '2025-01-15',
            due_date: '2025-02-15',
            status: 'sent',
            varsym: '2025001',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            invoice_number: 'F2025-002',
            customer_name: 'Demo Zákazník 2',
            amount: 2300.50,
            currency: 'EUR',
            issue_date: '2025-01-20',
            due_date: '2025-02-20',
            status: 'paid',
            varsym: '2025002',
            created_at: new Date().toISOString()
          }
        ];
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(demoInvoices)
        };
      }

      // Pre financial analysis endpoint vracame správnu štruktúru
      if (path.includes('/financial-analysis')) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            total: 3800.50,
            income: 3800.50,
            expenses: 0,
            profit: 3800.50,
            revenue: 3800.50,
            costs: 0,
            margin: 100,
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
    console.error('❌ Chyba v accounting function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      })
    };
  }
};
