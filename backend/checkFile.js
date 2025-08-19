const { db } = require('./database');

const fileId = 9; // ID súboru, ktorý sa pokúšate otvoriť

db.get('SELECT * FROM files WHERE id = ?', [fileId], (err, file) => {
  if (err) {
    console.error('Chyba pri načítaní súboru:', err);
    return;
  }

  if (!file) {
    console.log(`Súbor s ID ${fileId} nebol nájdený v databáze`);
    return;
  }

  console.log('Informácie o súbore:');
  console.log('='.repeat(50));
  console.log(`ID: ${file.id}`);
  console.log(`Názov: ${file.original_name}`);
  console.log(`Typ: ${file.file_type}`);
  console.log(`Kategória: ${file.category}`);
  console.log(`Firma ID: ${file.company_id}`);
  console.log(`Cesta k súboru: ${file.file_path}`);
  console.log(`Veľkosť: ${file.file_size} bajtov`);
  console.log(`Nahraný: ${file.uploaded_by}`);
  console.log(`Vytvorený: ${file.created_at}`);
  console.log('='.repeat(50));

  // Skontrolujeme, či súbor existuje na disku
  const fs = require('fs');
  if (fs.existsSync(file.file_path)) {
    console.log('✅ Súbor existuje na disku');
    console.log(`Skutočná veľkosť: ${fs.statSync(file.file_path).size} bajtov`);
  } else {
    console.log('❌ Súbor neexistuje na disku!');
    console.log(`Hľadaná cesta: ${file.file_path}`);
    
    // Skontrolujeme, či existuje uploads priečinok
    if (fs.existsSync('uploads')) {
      console.log('✅ Uploads priečinok existuje');
      console.log('Súbory v uploads priečinku:');
      fs.readdirSync('uploads').forEach(fileName => {
        console.log(`- ${fileName}`);
      });
    } else {
      console.log('❌ Uploads priečinok neexistuje');
    }
  }
});
