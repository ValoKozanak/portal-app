const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const os = require('os');

class SpacesService {
  constructor() {
    this.s3 = new S3Client({
      region: process.env.SPACES_REGION,
      endpoint: process.env.SPACES_ENDPOINT,
      credentials: { 
        accessKeyId: process.env.SPACES_KEY, 
        secretAccessKey: process.env.SPACES_SECRET 
      },
    });
    this.bucket = process.env.SPACES_BUCKET;
  }

  // Kontrola, či je služba inicializovaná
  isInitialized() {
    return !!(this.bucket && process.env.SPACES_KEY && process.env.SPACES_SECRET);
  }

  // Generovanie kľúča pre MDB súbor
  getMdbKey(companyIco, year = '2025') {
    return `mdb/zalohy/${year}/${companyIco}_${year}/${companyIco}_${year}.mdb`;
  }

  // Generovanie upload URL pre admin
  async getPresignedUploadUrl(companyIco, year = '2025') {
    const key = this.getMdbKey(companyIco, year);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: 'application/x-msaccess',
      // NEpridávať ACL (default je private)
      // NEpridávať ChecksumAlgorithm ani x-amz-* checksum
    });
    
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 }); // 15 min
    return { url, key };
  }

  // Stiahnutie MDB súboru do buffer (pre spracovanie)
  async downloadMdbToBuffer(companyIco, year = '2025') {
    const key = this.getMdbKey(companyIco, year);
    const command = new GetObjectCommand({ 
      Bucket: this.bucket, 
      Key: key 
    });
    
    try {
      const response = await this.s3.send(command);
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        throw new Error('MDB súbor nebol nájdený v Spaces');
      }
      throw error;
    }
  }

  // Stiahnutie MDB súboru do dočasného súboru (pre existujúci kód)
  async downloadMdbToTempFile(companyIco, year = '2025') {
    const buffer = await this.downloadMdbToBuffer(companyIco, year);
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${companyIco}_${year}.mdb`);
    
    fs.writeFileSync(tempFilePath, buffer);
    return tempFilePath;
  }

  // Kontrola, či MDB súbor existuje
  async checkMdbFileExists(companyIco, year = '2025') {
    const key = this.getMdbKey(companyIco, year);
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: key,
      MaxKeys: 1
    });
    
    try {
      const response = await this.s3.send(command);
      return response.Contents && response.Contents.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Získanie zoznamu dostupných MDB súborov
  async listMdbFiles() {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: 'mdb/zalohy/'
    });
    
    try {
      const response = await this.s3.send(command);
      return response.Contents || [];
    } catch (error) {
      return [];
    }
  }

  // Migrácia existujúcich MDB súborov z lokálneho adresára
  async migrateLocalMdbFiles() {
    const localMdbDir = path.join(__dirname, '..', 'zalohy');
    if (!fs.existsSync(localMdbDir)) {
      return { migrated: 0, errors: [] };
    }

    let migrated = 0;
    const errors = [];

    try {
      const years = fs.readdirSync(localMdbDir);
      for (const year of years) {
        const yearDir = path.join(localMdbDir, year);
        if (fs.statSync(yearDir).isDirectory()) {
          const companies = fs.readdirSync(yearDir);
          for (const company of companies) {
            const mdbPath = path.join(yearDir, company, `${company}.mdb`);
            if (fs.existsSync(mdbPath)) {
              try {
                const companyIco = company.replace(`_${year}`, '');
                const key = this.getMdbKey(companyIco, year);
                
                // Upload do Spaces
                const fileBuffer = fs.readFileSync(mdbPath);
                const uploadCommand = new PutObjectCommand({
                  Bucket: this.bucket,
                  Key: key,
                  Body: fileBuffer,
                  ContentType: 'application/x-msaccess',
                  // NEpridávať ACL (default je private)
                });
                
                await this.s3.send(uploadCommand);
                migrated++;
                console.log(`✅ Migrovaný: ${company}.mdb`);
              } catch (error) {
                errors.push(`${company}.mdb: ${error.message}`);
              }
            }
          }
        }
      }
    } catch (error) {
      errors.push(`Chyba pri migrácii: ${error.message}`);
    }

    return { migrated, errors };
  }
}

module.exports = new SpacesService();
