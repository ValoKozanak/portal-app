const ADODB = require('node-adodb');
const path = require('path');

// Cesta k MDB súboru pre firmu 11111111
const mdbPath = path.join(__dirname, 'zalohy', '2025', '11111111_2025', 'PohodaXX.mdb');

console.log('Kontrolujem štruktúru MDB súboru:', mdbPath);

try {
  // Vytvorenie pripojenia k MDB súboru
  const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
  
  // Testovací dotaz - získať všetky tabuľky
  const tablesQuery = "SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0";
  
  connection.query(tablesQuery)
    .then(data => {
      console.log('✅ Pripojenie úspešné!');
      console.log('Dostupné tabuľky:');
      data.forEach(table => {
        console.log('  -', table.Name);
      });
      
      // Test dotazu na tabuľku FA
      const faQuery = "SELECT COUNT(*) as count FROM [FA]";
      return connection.query(faQuery);
    })
    .then(data => {
      console.log('Počet záznamov v tabuľke FA:', data[0].count);
      
      if (data[0].count > 0) {
        // Získať príklad záznamu
        const sampleQuery = "SELECT TOP 1 * FROM [FA]";
        return connection.query(sampleQuery);
      }
    })
    .then(data => {
      if (data && data.length > 0) {
        console.log('Príklad záznamu z FA:');
        console.log('  Stĺpce:', Object.keys(data[0]));
        console.log('  Hodnoty:', data[0]);
      }
    })
    .catch(error => {
      console.error('❌ Chyba pri čítaní MDB:', error.message);
    });
    
} catch (error) {
  console.error('❌ Chyba pri vytváraní pripojenia:', error.message);
}


