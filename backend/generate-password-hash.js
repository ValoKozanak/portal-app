const bcrypt = require('bcryptjs');

const password = 'password';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Chyba pri generovaní hashu:', err);
    return;
  }
  
  console.log('Heslo:', password);
  console.log('Hash:', hash);
  
  // Overenie hashu
  bcrypt.compare(password, hash, (err, result) => {
    if (err) {
      console.error('Chyba pri overovaní hashu:', err);
      return;
    }
    console.log('Hash je správny:', result);
  });
});
