const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

class DropboxBackendService {
  constructor() {
    this.accessToken = process.env.DROPBOX_ACCESS_TOKEN;
    this.baseUrl = 'https://api.dropboxapi.com';
    this.contentUrl = 'https://content.dropboxapi.com';
  }

  // Kontrola, či je služba inicializovaná
  isInitialized() {
    return !!this.accessToken;
  }

  // Získanie MDB súboru z Dropbox
  async getMDBFile(companyIco, year = '2025') {
    if (!this.accessToken) {
      throw new Error('Dropbox access token nie je nastavený');
    }

    try {
      // Cesta k MDB súboru v Dropbox
      const dropboxPath = `/portal-app-mdb-files/zalohy/${year}/${companyIco}_${year}/${companyIco}_${year}.mdb`;
      
      console.log(`🔍 Hľadám MDB súbor v Dropbox: ${dropboxPath}`);

      // Stiahnutie súboru z Dropbox
      const response = await axios({
        method: 'POST',
        url: `${this.contentUrl}/2/files/download`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: dropboxPath
          })
        },
        responseType: 'arraybuffer'
      });

      // Vytvorenie dočasného súboru
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `${companyIco}_${year}.mdb`);
      
      // Uloženie súboru do dočasného adresára
      fs.writeFileSync(tempFilePath, response.data);
      
      console.log(`✅ MDB súbor stiahnutý z Dropbox: ${tempFilePath}`);
      
      return tempFilePath;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.error(`❌ MDB súbor nebol nájdený v Dropbox: ${dropboxPath}`);
        throw new Error('MDB súbor nebol nájdený v Dropbox');
      }
      
      console.error('❌ Chyba pri sťahovaní MDB súboru z Dropbox:', error.message);
      throw new Error(`Chyba pri sťahovaní MDB súboru: ${error.message}`);
    }
  }

  // Vyčistenie dočasných súborov
  cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Dočasný súbor vyčistený: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Chyba pri vyčistení dočasného súboru:', error.message);
    }
  }

  // Kontrola, či MDB súbor existuje v Dropbox
  async checkMDBFileExists(companyIco, year = '2025') {
    if (!this.accessToken) {
      return false;
    }

    try {
      const dropboxPath = `/portal-app-mdb-files/zalohy/${year}/${companyIco}_${year}/${companyIco}_${year}.mdb`;
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/2/files/get_metadata`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          path: dropboxPath
        }
      });

      return true;
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return false;
      }
      throw error;
    }
  }

  // Získanie zoznamu dostupných MDB súborov
  async listMDBFiles() {
    if (!this.accessToken) {
      throw new Error('Dropbox access token nie je nastavený');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/2/files/list_folder`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          path: '/portal-app-mdb-files/zalohy',
          recursive: true
        }
      });

      return response.data.entries
        .filter(entry => entry.name.endsWith('.mdb'))
        .map(entry => ({
          name: entry.name,
          path: entry.path_lower,
          size: entry.size,
          modified: entry.server_modified
        }));
    } catch (error) {
      console.error('❌ Chyba pri získavaní zoznamu MDB súborov:', error.message);
      throw error;
    }
  }
}

module.exports = new DropboxBackendService();
