const { db } = require('./database');

// Skript na aktualizáciu kategórií existujúcich súborov
async function updateFileCategories() {
  console.log('Aktualizujem kategórie súborov...');

  // Najprv zistíme, ktoré súbory nemajú kategóriu
  db.all(`
    SELECT id, original_name, file_type, category 
    FROM files 
    WHERE category IS NULL OR category = '' OR category = 'other'
  `, [], (err, files) => {
    if (err) {
      console.error('Chyba pri načítaní súborov:', err);
      return;
    }

    console.log(`Našlo sa ${files.length} súborov bez kategórie`);

    files.forEach(file => {
      // Určíme kategóriu na základe typu súboru
      let category = 'other';
      
      if (file.file_type.includes('pdf') || file.file_type.includes('word') || file.file_type.includes('excel')) {
        category = 'documents';
      } else if (file.original_name.toLowerCase().includes('faktúra') || file.original_name.toLowerCase().includes('invoice')) {
        category = 'invoices';
      } else if (file.original_name.toLowerCase().includes('zmluva') || file.original_name.toLowerCase().includes('contract')) {
        category = 'contracts';
      } else if (file.original_name.toLowerCase().includes('správa') || file.original_name.toLowerCase().includes('report')) {
        category = 'reports';
      } else if (file.file_type.includes('image') || file.file_type.includes('jpeg') || file.file_type.includes('png')) {
        category = 'images';
      } else if (file.file_type.includes('zip') || file.file_type.includes('rar')) {
        category = 'archives';
      }

      // Aktualizujeme kategóriu súboru
      db.run(`
        UPDATE files 
        SET category = ? 
        WHERE id = ?
      `, [category, file.id], function(err) {
        if (err) {
          console.error(`Chyba pri aktualizácii súboru ${file.original_name}:`, err);
        } else {
          console.log(`Aktualizovaný súbor: ${file.original_name} -> ${category}`);
        }
      });
    });
  });
}

// Spustíme aktualizáciu
updateFileCategories();

console.log('Skript na aktualizáciu kategórií bol spustený.');
console.log('Počkajte chvíľku a potom skontrolujte aplikáciu.');
