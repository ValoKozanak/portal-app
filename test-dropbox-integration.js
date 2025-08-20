// Test súbor pre Dropbox integráciu
// Spustite: node test-dropbox-integration.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Testovanie Dropbox integrácie...\n');

// Test 1: Kontrola environment premenných
console.log('1️⃣ Kontrola environment premenných:');
const requiredEnvVars = [
  'REACT_APP_DROPBOX_APP_KEY',
  'REACT_APP_DROPBOX_APP_SECRET',
  'REACT_APP_DROPBOX_REDIRECT_URI'
];

let envVarsOk = true;
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`   ❌ ${varName} - chýba`);
    envVarsOk = false;
  } else {
    console.log(`   ✅ ${varName} - nastavené`);
  }
});

if (!envVarsOk) {
  console.log('\n⚠️  Nastavte chýbajúce environment premenné v .env súbore');
  console.log('   Pozrite si env.example súbor pre príklad');
}

// Test 2: Kontrola súborov
console.log('\n2️⃣ Kontrola súborov:');
const requiredFiles = [
  'src/components/DropboxIntegration.tsx',
  'src/services/dropboxService.ts',
  'src/pages/DropboxCallback.tsx',
  'env.example'
];

let filesOk = true;
requiredFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${filePath} - existuje`);
  } else {
    console.log(`   ❌ ${filePath} - chýba`);
    filesOk = false;
  }
});

// Test 3: Kontrola package.json dependencies
console.log('\n3️⃣ Kontrola dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  if (dependencies.dropbox) {
    console.log(`   ✅ dropbox@${dependencies.dropbox} - nainštalované`);
  } else {
    console.log('   ❌ dropbox - chýba v dependencies');
  }
} catch (error) {
  console.log('   ❌ Nepodarilo sa načítať package.json');
}

// Test 4: Kontrola routing
console.log('\n4️⃣ Kontrola routing:');
try {
  const appContent = fs.readFileSync('src/App.tsx', 'utf8');
  if (appContent.includes('DropboxCallback')) {
    console.log('   ✅ DropboxCallback route - pridané');
  } else {
    console.log('   ❌ DropboxCallback route - chýba');
  }
} catch (error) {
  console.log('   ❌ Nepodarilo sa načítať App.tsx');
}

// Test 5: Kontrola integrácie v dashboardoch
console.log('\n5️⃣ Kontrola integrácie v dashboardoch:');
const dashboardFiles = [
  'src/pages/AdminDashboard.tsx',
  'src/components/CompanyDashboard.tsx',
  'src/pages/AccountantDashboard.tsx'
];

dashboardFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('DropboxIntegration')) {
      console.log(`   ✅ ${path.basename(filePath)} - Dropbox integrácia pridaná`);
    } else {
      console.log(`   ❌ ${path.basename(filePath)} - Dropbox integrácia chýba`);
    }
  } catch (error) {
    console.log(`   ❌ Nepodarilo sa načítať ${filePath}`);
  }
});

// Test 6: Kontrola TypeScript typov
console.log('\n6️⃣ Kontrola TypeScript typov:');
try {
  const dropboxServiceContent = fs.readFileSync('src/services/dropboxService.ts', 'utf8');
  const requiredTypes = [
    'DropboxFile',
    'DropboxUploadResult',
    'DropboxAuthResult'
  ];
  
  requiredTypes.forEach(type => {
    if (dropboxServiceContent.includes(`interface ${type}`)) {
      console.log(`   ✅ ${type} - definovaný`);
    } else {
      console.log(`   ❌ ${type} - chýba`);
    }
  });
} catch (error) {
  console.log('   ❌ Nepodarilo sa načítať dropboxService.ts');
}

// Test 7: Kontrola dokumentácie
console.log('\n7️⃣ Kontrola dokumentácie:');
const docsFiles = [
  'DROPBOX_INTEGRATION_GUIDE.md',
  'env.example'
];

docsFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${filePath} - existuje`);
  } else {
    console.log(`   ❌ ${filePath} - chýba`);
  }
});

// Zhrnutie
console.log('\n📊 ZHRNUTIE TESTOVANIA:');
console.log('========================');

if (envVarsOk && filesOk) {
  console.log('✅ Dropbox integrácia je pripravená na použitie!');
  console.log('\n🚀 Ďalšie kroky:');
  console.log('   1. Vytvorte Dropbox aplikáciu na https://www.dropbox.com/developers/apps');
  console.log('   2. Nastavte APP_KEY a APP_SECRET v .env súbore');
  console.log('   3. Nastavte OAuth redirect URI v Dropbox App Console');
  console.log('   4. Spustite aplikáciu: npm start');
  console.log('   5. Otestujte Dropbox integráciu v dashboardoch');
} else {
  console.log('❌ Dropbox integrácia nie je úplne pripravená');
  console.log('\n🔧 Opravte chyby a spustite test znova');
}

console.log('\n📖 Pre viac informácií pozrite DROPBOX_INTEGRATION_GUIDE.md');
