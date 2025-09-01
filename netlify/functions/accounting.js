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
  // Používame existujúcu štruktúru: /Portal/Zalohy/2025/ICO_2025/ICO_2025.mdb
  return `/Portal/Zalohy/2025/${icoHash}_2025`;
}

// Načítanie MDB súboru z Dropboxu
async function downloadMdbFromDropbox(companyICO, dbxClient = dbx) {
  try {
    const companyPath = getCompanyFolderPath(companyICO);
    const mdbFileName = `${companyICO}_2025.mdb`;
    const mdbPath = `${companyPath}/${mdbFileName}`;
    
    console.log('🔍 Hľadám MDB súbor:', mdbPath);
    
    // Skontrolujeme, či súbor existuje
    try {
      await dbxClient.filesGetMetadata({ path: mdbPath });
    } catch (error) {
      console.log('❌ MDB súbor nebol nájdený:', mdbPath);
      return null;
    }
    
    // Stiahneme súbor
    const response = await dbxClient.filesDownload({ path: mdbPath });
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
    if (httpMethod === 'POST' && (path.includes('/api/accounting/refresh-invoices') || path.includes('/api/accounting/refresh-received-invoices'))) {
      const companyId = path.split('/').pop();
      
      console.log('🔄 Refresh invoices pre companyId:', companyId);
      
      // Získanie tokenu z request headers
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const dropboxToken = authHeader ? authHeader.replace('Bearer ', '') : process.env.DROPBOX_ACCESS_TOKEN;
      
      console.log('🔑 Používam Dropbox token:', dropboxToken ? 'EXISTUJE' : 'CHÝBA');
      
      // Vytvorenie Dropbox klienta s tokenom
      const userDbx = new Dropbox({
        accessToken: dropboxToken,
        fetch: fetch
      });
      
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
      console.log('🔍 Dropbox Access Token:', process.env.DROPBOX_ACCESS_TOKEN ? 'EXISTUJE' : 'CHÝBA');
      console.log('📁 Očakávaná cesta:', getCompanyFolderPath(company.ico));
      
      // Stiahnutie MDB súboru z Dropboxu s user tokenom
      const mdbBlob = await downloadMdbFromDropbox(company.ico, userDbx);
      
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

    // Test endpoint pre Dropbox prístup
    if (httpMethod === 'GET' && path.includes('/api/accounting/test-dropbox')) {
      const companyId = path.split('/').pop();
      
      console.log('🧪 Test Dropbox prístupu pre companyId:', companyId);
      console.log('🔑 Dropbox Access Token:', process.env.DROPBOX_ACCESS_TOKEN ? 'EXISTUJE' : 'CHÝBA');
      
      // Získanie tokenu z request headers (ak je poslaný z frontendu)
      const authHeader = event.headers.authorization || event.headers.Authorization;
      const dropboxToken = authHeader ? authHeader.replace('Bearer ', '') : process.env.DROPBOX_ACCESS_TOKEN;
      
      console.log('🔑 Používam token:', dropboxToken ? 'EXISTUJE' : 'CHÝBA');
      
      // Vytvorenie Dropbox klienta s tokenom
      const testDbx = new Dropbox({
        accessToken: dropboxToken,
        fetch: fetch
      });
      
      try {
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
        
        // Test Dropbox prístupu
        const companyPath = getCompanyFolderPath(company.ico);
        console.log('📁 Testujem cestu:', companyPath);
        
        // Skúsime získať metadata zložky
        try {
          const folderMetadata = await testDbx.filesGetMetadata({ path: companyPath });
          console.log('✅ Zložka nájdená:', folderMetadata.result);
          
          // Skúsime získať zoznam súborov
          const filesList = await testDbx.filesListFolder({ path: companyPath });
          console.log('📄 Súbory v zložke:', filesList.result.entries);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Dropbox prístup funguje!',
              company: {
                name: company.name,
                ico: company.ico
              },
              dropboxPath: companyPath,
              folderExists: true,
              files: filesList.result.entries.map(file => ({
                name: file.name,
                path: file.path_display,
                size: file.size
              }))
            })
          };
          
        } catch (dropboxError) {
          console.log('❌ Dropbox chyba:', dropboxError);
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Dropbox zložka nebola nájdená',
              company: {
                name: company.name,
                ico: company.ico
              },
              dropboxPath: companyPath,
              error: dropboxError.message
            })
          };
        }
        
      } catch (error) {
        console.error('❌ Chyba v test Dropbox:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
          })
        };
      }
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
            expenses: {
              total: 0,
              count: 0,
              details: []
            },
            revenue: {
              total: 3800.50,
              count: 2,
              details: [
                {
                  account: '601',
                  account_name: 'Materiál',
                  amount: 1500.00,
                  count: 1
                },
                {
                  account: '602',
                  account_name: 'Energie',
                  amount: 2300.50,
                  count: 1
                }
              ]
            },
            profit: 3800.50,
            isProfit: true,
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