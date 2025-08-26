const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cesta k databáze
const dbPath = path.join(__dirname, 'portal.db');

console.log('🧹 Začínam čistenie databázy...');

// Vytvorenie pripojenia k databáze
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Chyba pri pripojení k databáze:', err.message);
    return;
  }
  console.log('✅ Pripojené k databáze');
});

// Funkcia na vyčistenie faktúr
function cleanupInvoices() {
  return new Promise((resolve, reject) => {
    console.log('🗑️ Mažem všetky faktúry...');
    
    // Mazanie vydaných faktúr
    db.run("DELETE FROM issued_invoices", function(err) {
      if (err) {
        console.error('❌ Chyba pri mazaní vydaných faktúr:', err.message);
        reject(err);
        return;
      }
      console.log(`✅ Vymazaných ${this.changes} vydaných faktúr`);
      
      // Mazanie prijatých faktúr
      db.run("DELETE FROM received_invoices", function(err) {
        if (err) {
          console.error('❌ Chyba pri mazaní prijatých faktúr:', err.message);
          reject(err);
          return;
        }
        console.log(`✅ Vymazaných ${this.changes} prijatých faktúr`);
        resolve();
      });
    });
  });
}

// Funkcia na vyčistenie transakcií
function cleanupTransactions() {
  return new Promise((resolve, reject) => {
    console.log('🗑️ Mažem všetky transakcie...');
    
    // Mazanie bankových transakcií
    db.run("DELETE FROM bank_transactions", function(err) {
      if (err) {
        console.error('❌ Chyba pri mazaní bankových transakcií:', err.message);
        reject(err);
        return;
      }
      console.log(`✅ Vymazaných ${this.changes} bankových transakcií`);
      
      // Mazanie pokladničných transakcií
      db.run("DELETE FROM cash_transactions", function(err) {
        if (err) {
          console.error('❌ Chyba pri mazaní pokladničných transakcií:', err.message);
          reject(err);
          return;
        }
        console.log(`✅ Vymazaných ${this.changes} pokladničných transakcií`);
        resolve();
      });
    });
  });
}

// Funkcia na resetovanie auto-increment
function resetAutoIncrement() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Resetujem auto-increment...');
    
    db.run("DELETE FROM sqlite_sequence WHERE name IN ('issued_invoices', 'received_invoices', 'bank_transactions', 'cash_transactions')", function(err) {
      if (err) {
        console.error('❌ Chyba pri resetovaní auto-increment:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Auto-increment resetovaný');
      resolve();
    });
  });
}

// Hlavná funkcia
async function cleanupDatabase() {
  try {
    await cleanupInvoices();
    await cleanupTransactions();
    await resetAutoIncrement();
    
    console.log('🎉 Čistenie databázy dokončené!');
    console.log('💡 Teraz môžete znovu importovať dáta z MDB');
    
  } catch (error) {
    console.error('❌ Chyba pri čistení databázy:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Chyba pri zatváraní databázy:', err.message);
      } else {
        console.log('✅ Databáza zatvorená');
      }
    });
  }
}

// Spustenie čistenia
cleanupDatabase();
