const { db } = require('./database');

// Funkcia na opravu kódovania názvov súborov
function fixFileEncoding() {
  console.log('🔧 Opravujem kódovanie názvov súborov...');
  
  db.all('SELECT id, original_name FROM files', [], (err, files) => {
    if (err) {
      console.error('❌ Chyba pri načítaní súborov:', err);
      return;
    }
    
    console.log(`📁 Našlo sa ${files.length} súborov na kontrolu`);
    
    files.forEach(file => {
      try {
        // Skúsime dekódovať názov súboru
        let fixedName = file.original_name;
        
        // Ak názov obsahuje poškodené znaky, skúsime ho opraviť
        if (fixedName.includes('Ã')) {
          // Pokus o opravu UTF-8 kódovania
          try {
            // Skúsime dekódovať ako UTF-8
            const buffer = Buffer.from(fixedName, 'latin1');
            fixedName = buffer.toString('utf8');
          } catch (e) {
            console.log(`⚠️  Nepodarilo sa opraviť: ${file.original_name}`);
          }
        }
        
        // Ak sa názov zmenil, aktualizujeme databázu
        if (fixedName !== file.original_name) {
          db.run('UPDATE files SET original_name = ? WHERE id = ?', 
            [fixedName, file.id], 
            function(err) {
              if (err) {
                console.error(`❌ Chyba pri aktualizácii súboru ${file.id}:`, err);
              } else {
                console.log(`✅ Opravený súbor ${file.id}: "${file.original_name}" → "${fixedName}"`);
              }
            }
          );
        }
      } catch (error) {
        console.error(`❌ Chyba pri spracovaní súboru ${file.id}:`, error);
      }
    });
    
    console.log('✅ Oprava kódovania dokončená');
  });
}

// Spustíme opravu
fixFileEncoding();
















