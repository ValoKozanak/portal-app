const { Dropbox } = require('dropbox');
require('dotenv').config();

// Test Dropbox API
async function testDropboxAPI() {
  console.log('=== TESTING DROPBOX API ===');
  
  // Kontrola environment variables
  console.log('Environment variables:');
  console.log('DROPBOX_APP_KEY:', process.env.DROPBOX_APP_KEY ? 'SET' : 'NOT SET');
  console.log('DROPBOX_APP_SECRET:', process.env.DROPBOX_APP_SECRET ? 'SET' : 'NOT SET');
  console.log('DROPBOX_ACCESS_TOKEN:', process.env.DROPBOX_ACCESS_TOKEN ? 'SET' : 'NOT SET');
  
  if (!process.env.DROPBOX_ACCESS_TOKEN) {
    console.error('❌ DROPBOX_ACCESS_TOKEN is not set!');
    console.log('You need to get an access token from Dropbox Developer Console');
    return;
  }
  
  // Inicializácia Dropbox klienta
  const dbx = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    fetch: fetch
  });
  
  try {
    // Test 1: Získanie account info
    console.log('\n--- Test 1: Account Info ---');
    const accountInfo = await dbx.usersGetCurrentAccount();
    console.log('✅ Account info:', accountInfo.result.name.display_name);
    
    // Test 2: Vytvorenie test zložky
    console.log('\n--- Test 2: Create Test Folder ---');
    const testFolderPath = '/Portal/Test/API_Test_' + Date.now();
    const createFolderResult = await dbx.filesCreateFolderV2({
      path: testFolderPath,
      autorename: true
    });
    console.log('✅ Test folder created:', createFolderResult.result.metadata.path_display);
    
    // Test 3: Vytvorenie zdieľateľného linku
    console.log('\n--- Test 3: Create Shared Link ---');
    const sharedLinkResult = await dbx.sharingCreateSharedLinkWithSettings({
      path: testFolderPath,
      settings: {
        requested_visibility: { '.tag': 'public' },
        audience: { '.tag': 'public' },
        access: { '.tag': 'viewer' }
      }
    });
    console.log('✅ Shared link created:', sharedLinkResult.result.url);
    
    // Test 4: Získanie všetkých zdieľateľných linkov
    console.log('\n--- Test 4: List Shared Links ---');
    const sharedLinksResult = await dbx.sharingListSharedLinks({
      path: '/Portal',
      direct_only: false
    });
    console.log('✅ Found shared links:', sharedLinksResult.result.links.length);
    
    // Test 5: Odvolanie zdieľateľného linku
    console.log('\n--- Test 5: Revoke Shared Link ---');
    await dbx.sharingRevokeSharedLink({
      url: sharedLinkResult.result.url
    });
    console.log('✅ Shared link revoked');
    
    // Test 6: Vymazanie test zložky
    console.log('\n--- Test 6: Delete Test Folder ---');
    await dbx.filesDeleteV2({
      path: testFolderPath
    });
    console.log('✅ Test folder deleted');
    
    console.log('\n🎉 All Dropbox API tests passed!');
    
  } catch (error) {
    console.error('❌ Dropbox API test failed:', error);
    console.error('Error details:', error.error);
    
    if (error.error && error.error.error_summary) {
      console.error('Error summary:', error.error.error_summary);
    }
    
    if (error.status === 401) {
      console.error('🔑 Authentication error - check your access token');
    } else if (error.status === 403) {
      console.error('🚫 Permission error - check your app permissions');
    }
  }
}

// Spustenie testu
testDropboxAPI();
