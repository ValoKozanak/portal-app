const { db } = require('./database');

// Test databázy
db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="dropbox_settings"', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Dropbox settings table exists:', rows.length > 0);
    if (rows.length > 0) {
      console.log('Table found:', rows[0]);
    }
  }
  
  // Test vloženia dát
  const testData = {
    companyId: 1,
    companyEmail: 'test@test.com',
    folderPath: '/test/path',
    shareLink: 'https://test.com',
    permissions: {
      canView: true,
      canEdit: false,
      canUpload: true,
      canDelete: false
    }
  };
  
  const query = `
    INSERT OR REPLACE INTO dropbox_settings 
    (company_id, company_email, folder_path, share_link, is_shared, can_view, can_edit, can_upload, can_delete, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  const params = [
    testData.companyId,
    testData.companyEmail,
    testData.folderPath,
    testData.shareLink,
    1,
    testData.permissions.canView ? 1 : 0,
    testData.permissions.canEdit ? 1 : 0,
    testData.permissions.canUpload ? 1 : 0,
    testData.permissions.canDelete ? 1 : 0
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Error inserting test data:', err);
    } else {
      console.log('Test data inserted successfully. Last ID:', this.lastID);
    }
    
    // Test načítania dát
    db.get('SELECT * FROM dropbox_settings WHERE company_id = ?', [testData.companyId], (err, row) => {
      if (err) {
        console.error('Error reading test data:', err);
      } else {
        console.log('Test data read successfully:', row);
      }
      process.exit();
    });
  });
});
