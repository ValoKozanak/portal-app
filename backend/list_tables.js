const ADODB = require('node-adodb');
const path = require('path');

console.log('🔍 Zobrazujem dostupné tabuľky v MDB...');

const mdbPath = path.join(__dirname, 'zalohy', '2025', '77777777_2025', '77777777_2025.mdb');
console.log('📁 MDB cesta:', mdbPath);

const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);

async function listTables() {
  try {
    console.log('🔍 Pripájam sa k MDB...');
    
    // Skúsime jednoduchý query na testovanie pripojenia
    const testQuery = await connection.query('SELECT COUNT(*) as count FROM FA');
    console.log('✅ Pripojenie úspešné! Počet záznamov v FA:', testQuery[0].count);
    
    // Teraz skúsime získať zoznam tabuliek
    console.log('\n📋 Hľadám tabuľky...');
    
    // Skúsime rôzne spôsoby získania zoznamu tabuliek
    try {
      const tables1 = await connection.query("SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0");
      console.log('✅ Tabuľky (spôsob 1):', tables1.map(t => t.Name));
    } catch (e) {
      console.log('❌ Spôsob 1 zlyhal:', e.message);
    }
    
    try {
      const tables2 = await connection.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
      console.log('✅ Tabuľky (spôsob 2):', tables2.map(t => t.TABLE_NAME));
    } catch (e) {
      console.log('❌ Spôsob 2 zlyhal:', e.message);
    }
    
    // Skúsime priamo tabuľku pUD
    console.log('\n🔍 Testujem tabuľku pUD...');
    try {
      const pudTest = await connection.query('SELECT TOP 1 * FROM pUD');
      console.log('✅ Tabuľka pUD existuje! Počet stĺpcov:', Object.keys(pudTest[0]).length);
      console.log('📋 Stĺpce:', Object.keys(pudTest[0]));
    } catch (e) {
      console.log('❌ Tabuľka pUD neexistuje alebo je prázdna:', e.message);
    }
    
    // Skúsime iné možné názvy tabuliek
    const possibleNames = ['pUD', 'PUD', 'Pud', 'pud', 'UD', 'ud', 'Ucty', 'ucty', 'UctyDoklad', 'UctyDoklady'];
    
    console.log('\n🔍 Testujem možné názvy tabuliek...');
    for (const name of possibleNames) {
      try {
        const test = await connection.query(`SELECT TOP 1 * FROM [${name}]`);
        console.log(`✅ Tabuľka ${name} existuje! Stĺpce:`, Object.keys(test[0]));
      } catch (e) {
        console.log(`❌ Tabuľka ${name} neexistuje`);
      }
    }
    
  } catch (error) {
    console.error('❌ Chyba pri pripojení:', error.message);
  }
}

listTables().then(() => {
  console.log('\n✅ Kontrola dokončená');
  process.exit(0);
}).catch(error => {
  console.error('❌ Chyba:', error);
  process.exit(1);
});
