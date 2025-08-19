const { db } = require('./database');

// Skript na kontrolu súborov v databáze
db.all(`
  SELECT id, original_name, file_type, category, company_id
  FROM files 
  ORDER BY created_at DESC
`, [], (err, files) => {
  if (err) {
    console.error('Chyba pri načítaní súborov:', err);
    return;
  }

  console.log(`Našlo sa ${files.length} súborov v databáze:`);
  console.log('='.repeat(80));
  
  files.forEach(file => {
    console.log(`ID: ${file.id} | Názov: ${file.original_name} | Typ: ${file.file_type} | Kategória: ${file.category} | Firma: ${file.company_id}`);
  });
  
  console.log('='.repeat(80));
  
  // Zoskupíme súbory podľa kategórií
  const filesByCategory = {};
  files.forEach(file => {
    const category = file.category || 'unknown';
    if (!filesByCategory[category]) {
      filesByCategory[category] = [];
    }
    filesByCategory[category].push(file);
  });
  
  console.log('Súbory podľa kategórií:');
  Object.keys(filesByCategory).forEach(category => {
    console.log(`${category}: ${filesByCategory[category].length} súborov`);
  });
});
