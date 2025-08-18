// Simulovaný File Service - pripravený na AWS S3 integráciu
// Pre aktiváciu S3: nainštalujte @aws-sdk/client-s3 a odkomentujte S3 kód

// AWS S3 konfigurácia (pre budúcu integráciu)
const s3Config = {
  region: process.env.REACT_APP_AWS_REGION || 'eu-central-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'portal-files'
};

// Simulované úložisko súborov (v reálnej aplikácii by to bolo S3)
const fileStorage = new Map<string, FileData>();

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  companyId: number;
  description?: string;
  tags?: string[];
  s3Key?: string; // S3 kľúč pre súbor
  url?: string; // Pre-signed URL pre sťahovanie
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileService {
  // Generovanie S3 kľúča pre súbor
  private generateS3Key(companyId: number, category: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `companies/${companyId}/${category}/${timestamp}_${sanitizedFileName}`;
  }

  // Nahrávanie súboru (simulované - pripravené na S3)
  async uploadFile(
    file: File, 
    companyId: number, 
    category: string, 
    metadata: Partial<FileData>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileData> {
    try {
      const s3Key = this.generateS3Key(companyId, category, file.name);
      
      // Simulácia progress tracking
      if (onProgress) {
        const simulateProgress = () => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
            }
            onProgress({
              loaded: Math.floor((progress / 100) * file.size),
              total: file.size,
              percentage: Math.floor(progress)
            });
          }, 200);
        };
        simulateProgress();
      }

      // Simulácia nahrávania
      await new Promise(resolve => setTimeout(resolve, 2000));

      const fileData: FileData = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        category,
        uploadedBy: metadata.uploadedBy || '',
        uploadedAt: new Date().toISOString(),
        companyId,
        description: metadata.description,
        tags: metadata.tags,
        s3Key: s3Key,
        url: `https://simulated-s3.com/${s3Key}` // Simulovaný URL
      };

      // Uloženie do simulovaného úložiska
      fileStorage.set(fileData.id, fileData);

      // Uloženie metadát do databázy (tu by bolo API volanie)
      await this.saveFileMetadata(fileData);

      return fileData;
    } catch (error) {
      console.error('Chyba pri nahrávaní súboru:', error);
      throw new Error('Nepodarilo sa nahrať súbor');
    }
  }

  // Generovanie pre-signed URL pre sťahovanie (simulované)
  async getDownloadUrl(s3Key: string, fileName: string): Promise<string> {
    try {
      // Simulácia oneskorenia
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // V simulovanom prostredí vrátime blob URL pre stiahnutie
      // V reálnej aplikácii by tu bolo generovanie pre-signed URL z S3
      return `blob:simulated-s3/${s3Key}`;
    } catch (error) {
      console.error('Chyba pri generovaní download URL:', error);
      throw new Error('Nepodarilo sa vygenerovať odkaz na sťahovanie');
    }
  }

  // Nová metóda pre simulované sťahovanie súboru
  async downloadFile(s3Key: string, fileName: string): Promise<void> {
    try {
      // Nájdeme súbor v simulovanom úložisku
      let fileData: FileData | undefined;
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileData = file;
          break;
        }
      }

      if (!fileData) {
        throw new Error('Súbor nebol nájdený');
      }

      // Simulácia oneskorenia
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vytvoríme simulovaný obsah súboru podľa typu
      let fileContent: string;
      let mimeType: string;

      if (fileData.type.includes('pdf')) {
        // Simulovaný PDF obsah
        fileContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Simulovaný PDF súbor: ${fileName}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;
        mimeType = 'application/pdf';
      } else if (fileData.type.includes('image')) {
        // Pre obrázky vytvoríme jednoduchý SVG
        fileContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
    Simulovaný obrázok: ${fileName}
  </text>
</svg>`;
        mimeType = 'image/svg+xml';
      } else if (fileData.type.includes('text') || fileData.type.includes('document')) {
        // Pre textové súbory
        fileContent = `Simulovaný textový súbor: ${fileName}

Tento súbor bol vytvorený v simulovanom prostredí.
Dátum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}
Veľkosť: ${fileData.size} bajtov
Kategória: ${fileData.category}

Obsah súboru:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat.`;
        mimeType = 'text/plain';
      } else {
        // Pre ostatné typy
        fileContent = `Simulovaný súbor: ${fileName}
Typ: ${fileData.type}
Veľkosť: ${fileData.size} bajtov
Kategória: ${fileData.category}
Dátum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}`;
        mimeType = 'application/octet-stream';
      }

      // Vytvoríme blob s reálnym obsahom
      const blob = new Blob([fileContent], { 
        type: mimeType
      });
      
      // Vytvoríme URL pre blob
      const url = window.URL.createObjectURL(blob);
      
      // Vytvoríme dočasný link pre sťahovanie
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Vyčistíme
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Chyba pri sťahovaní súboru:', error);
      throw new Error('Nepodarilo sa stiahnuť súbor');
    }
  }

  // Nová metóda pre otvorenie súboru v prehliadači
  async openFileInBrowser(s3Key: string, fileName: string): Promise<void> {
    try {
      // Nájdeme súbor v simulovanom úložisku
      let fileData: FileData | undefined;
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileData = file;
          break;
        }
      }

      if (!fileData) {
        throw new Error('Súbor nebol nájdený');
      }

      // Vytvoríme simulovaný obsah súboru (rovnaký ako pri sťahovaní)
      let fileContent: string;
      let mimeType: string;

      if (fileData.type.includes('pdf')) {
        fileContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Simulovaný PDF súbor: ${fileName}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;
        mimeType = 'application/pdf';
      } else if (fileData.type.includes('image')) {
        fileContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
    Simulovaný obrázok: ${fileName}
  </text>
</svg>`;
        mimeType = 'image/svg+xml';
      } else if (fileData.type.includes('text') || fileData.type.includes('document')) {
        fileContent = `Simulovaný textový súbor: ${fileName}

Tento súbor bol vytvorený v simulovanom prostredí.
Dátum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}
Veľkosť: ${fileData.size} bajtov
Kategória: ${fileData.category}

Obsah súboru:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat.`;
        mimeType = 'text/plain';
      } else {
        fileContent = `Simulovaný súbor: ${fileName}
Typ: ${fileData.type}
Veľkosť: ${fileData.size} bajtov
Kategória: ${fileData.category}
Dátum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}`;
        mimeType = 'application/octet-stream';
      }

      // Vytvoríme blob
      const blob = new Blob([fileContent], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      // Otvoríme v novom okne/tabe
      const newWindow = window.open(url, '_blank');
      
      // Vyčistíme URL po chvíli
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

    } catch (error) {
      console.error('Chyba pri otváraní súboru:', error);
      throw new Error('Nepodarilo sa otvoriť súbor');
    }
  }

  // Nová metóda pre získanie URL pre náhľad
  async getPreviewUrl(s3Key: string, fileName: string): Promise<string> {
    try {
      // Nájdeme súbor v simulovanom úložisku
      let fileData: FileData | undefined;
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileData = file;
          break;
        }
      }

      if (!fileData) {
        throw new Error('Súbor nebol nájdený');
      }

      // Vytvoríme simulovaný obsah súboru
      let fileContent: string;
      let mimeType: string;

      if (fileData.type.includes('pdf')) {
        fileContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Simulovaný PDF súbor: ${fileName}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;
        mimeType = 'application/pdf';
      } else if (fileData.type.includes('image')) {
        fileContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
    Simulovaný obrázok: ${fileName}
  </text>
</svg>`;
        mimeType = 'image/svg+xml';
      } else {
        // Pre ostatné typy vrátime prázdny string - nepodporujeme náhľad
        return '';
      }

      // Vytvoríme blob a URL
      const blob = new Blob([fileContent], { type: mimeType });
      return window.URL.createObjectURL(blob);

    } catch (error) {
      console.error('Chyba pri generovaní náhľadu:', error);
      throw new Error('Nepodarilo sa vygenerovať náhľad');
    }
  }

  // Mazanie súboru (simulované)
  async deleteFile(s3Key: string): Promise<void> {
    try {
      // Simulácia mazania z S3
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mazanie z simulovaného úložiska
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileStorage.delete(id);
          break;
        }
      }
      
      // Mazanie metadát z databázy (tu by bolo API volanie)
      await this.deleteFileMetadata(s3Key);
    } catch (error) {
      console.error('Chyba pri mazaní súboru:', error);
      throw new Error('Nepodarilo sa vymazať súbor');
    }
  }

  // Získanie súborov pre firmu (simulované)
  async getCompanyFiles(companyId: number): Promise<FileData[]> {
    try {
      // Simulácia API volania
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vrátime súbory z simulovaného úložiska pre danú firmu
      const companyFiles = Array.from(fileStorage.values()).filter(
        file => file.companyId === companyId
      );
      
      return companyFiles;
    } catch (error) {
      console.error('Chyba pri získavaní súborov:', error);
      throw new Error('Nepodarilo sa načítať súbory');
    }
  }

  // Uloženie metadát do databázy
  private async saveFileMetadata(fileData: FileData): Promise<void> {
    try {
      // API volanie na uloženie metadát
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) {
        throw new Error('Nepodarilo sa uložiť metadáta súboru');
      }
    } catch (error) {
      console.error('Chyba pri ukladaní metadát:', error);
      throw error;
    }
  }

  // Mazanie metadát z databázy
  private async deleteFileMetadata(s3Key: string): Promise<void> {
    try {
      // API volanie na mazanie metadát
      const response = await fetch(`/api/files/${encodeURIComponent(s3Key)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Nepodarilo sa vymazať metadáta súboru');
      }
    } catch (error) {
      console.error('Chyba pri mazaní metadát:', error);
      throw error;
    }
  }

  // Kontrola veľkosti súboru
  validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  // Kontrola typu súboru
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }
}

export const fileService = new FileService();

/*
=== INŠTRUKCIE PRE AWS S3 INTEGRÁCIU ===

1. Nainštalujte AWS SDK v3:
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

2. Odkomentujte a upravte S3 kód:
   - Nahraďte simulované úložisko skutočným S3 klientom
   - Odkomentujte S3 upload/delete operácie
   - Nastavte správne environment premenné

3. Príklad S3 integrácie:
   import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   const s3Client = new S3Client({
     region: process.env.REACT_APP_AWS_REGION,
     credentials: {
       accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY!
     }
   });

4. Environment premenné (.env):
   REACT_APP_AWS_REGION=eu-central-1
   REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_id
   REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_access_key
   REACT_APP_S3_BUCKET_NAME=portal-files

5. CORS nastavenia pre S3 bucket:
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
       "ExposeHeaders": []
     }
   ]
*/
