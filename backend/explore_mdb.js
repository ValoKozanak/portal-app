const ADODB = require('node-adodb');
const path = require('path');

// Cesta k Access databáze
const dbPath = path.join(__dirname, 'zalohy', 'extracted', 'PohodaXX.mdb');

console.log('🔍 Preskúmavam Access databázu:', dbPath);

// Vytvorenie pripojenia
const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${dbPath};`);

async function exploreDatabase() {
  try {
    console.log('📋 Získavam zoznam tabuliek...');
    
    // Získanie zoznamu tabuliek
    const tables = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📊 Nájdené tabuľky:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.TABLE_NAME}`);
    });
    
    // Hľadanie tabuliek súvisiacich s faktúrami
    console.log('\n🔍 Hľadám tabuľky súvisiace s faktúrami...');
    const invoiceTables = tables.filter(table => 
      table.TABLE_NAME.toLowerCase().includes('fakt') ||
      table.TABLE_NAME.toLowerCase().includes('invoice') ||
      table.TABLE_NAME.toLowerCase().includes('doklad') ||
      table.TABLE_NAME.toLowerCase().includes('vydan')
    );
    
    if (invoiceTables.length > 0) {
      console.log('\n💰 Nájdené tabuľky s faktúrami:');
      invoiceTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.TABLE_NAME}`);
      });
      
      // Preskúmanie prvej tabuľky s faktúrami
      if (invoiceTables.length > 0) {
        const firstTable = invoiceTables[0].TABLE_NAME;
        console.log(`\n📋 Preskúmavam tabuľku: ${firstTable}`);
        
        // Získanie štruktúry tabuľky
        const columns = await connection.query(`
          SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = '${firstTable}'
          ORDER BY ORDINAL_POSITION
        `);
        
        console.log('\n📊 Štruktúra tabuľky:');
        columns.forEach(col => {
          console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });
        
        // Získanie prvých 5 riadkov
        const sampleData = await connection.query(`
          SELECT TOP 5 * FROM [${firstTable}]
        `);
        
        console.log(`\n📄 Prvých 5 riadkov z tabuľky ${firstTable}:`);
        console.log(JSON.stringify(sampleData, null, 2));
      }
    }
    
    // Hľadanie tabuliek s firmami/partnerami
    console.log('\n🏢 Hľadám tabuľky s firmami...');
    const companyTables = tables.filter(table => 
      table.TABLE_NAME.toLowerCase().includes('firma') ||
      table.TABLE_NAME.toLowerCase().includes('partner') ||
      table.TABLE_NAME.toLowerCase().includes('company') ||
      table.TABLE_NAME.toLowerCase().includes('adresar')
    );
    
    if (companyTables.length > 0) {
      console.log('\n🏢 Nájdené tabuľky s firmami:');
      companyTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.TABLE_NAME}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Chyba pri preskúmaní databázy:', error);
  }
}

exploreDatabase();
