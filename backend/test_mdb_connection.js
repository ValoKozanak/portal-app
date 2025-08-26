const ADODB = require('node-adodb');
const path = require('path');

// Cesta k MDB súboru pre firmu 11111111
const mdbPath = path.join(__dirname, 'zalohy', '2025', '11111111_2025', 'PohodaXX.mdb');

console.log('Testujem pripojenie k MDB súboru:', mdbPath);

try {
  // Vytvorenie pripojenia k MDB súboru
  const connection = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${mdbPath};`);
  
  // Testovací dotaz
  const query = "SELECT COUNT(*) as count FROM [FA]";
  
  connection.query(query)
    .then(data => {
      console.log('✅ Pripojenie úspešné!');
      console.log('Počet záznamov v tabuľke FA:', data[0].count);
      
      // Test dotazu na prijaté faktúry
      const receivedQuery = "SELECT COUNT(*) as count FROM [FA] WHERE RelTpFak = 11";
      return connection.query(receivedQuery);
    })
    .then(data => {
      console.log('Počet prijatých faktúr (RelTpFak = 11):', data[0].count);
    })
    .catch(error => {
      console.error('❌ Chyba pri čítaní MDB:', error.message);
    });
    
} catch (error) {
  console.error('❌ Chyba pri vytváraní pripojenia:', error.message);
}


