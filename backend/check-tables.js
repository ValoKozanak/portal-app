const { db } = require('./database');

db.all('SELECT name FROM sqlite_master WHERE type="table"', [], (err, tables) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log('-', table.name);
    });
  }
  process.exit(0);
});
