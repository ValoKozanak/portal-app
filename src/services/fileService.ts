// SimulovanA? File Service - pripravenA? na AWS S3 integrA?ciu
// Pre aktivA?ciu S3: nainL?talujte @aws-sdk/client-s3 a odkomentujte S3 kAld

// AWS S3 konfigurA?cia (pre budAscu integrA?ciu)
const s3Config = {
  region: process.env.REACT_APP_AWS_REGION || 'eu-central-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'portal-files'
};

// SimulovanA? AsloLlisko sAsborov (v reA?lnej aplikA?cii by to bolo S3)
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
  s3Key?: string; // S3 k?lAs?T pre sAsbor
  url?: string; // Pre-signed URL pre sLAahovanie
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileService {
  // Generovanie S3 k?lAs?Ta pre sAsbor
  private generateS3Key(companyId: number, category: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `companies/${companyId}/${category}/${timestamp}_${sanitizedFileName}`;
  }

  // NahrA?vanie sAsboru (simulovanA? - pripravenA? na S3)
  async uploadFile(
    file: File, 
    companyId: number, 
    category: string, 
    metadata: Partial<FileData>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileData> {
    try {
      const s3Key = this.generateS3Key(companyId, category, file.name);
      
      // SimulA?cia progress tracking
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

      // SimulA?cia nahrA?vania
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
        url: `https://simulated-s3.com/${s3Key}` // SimulovanA? URL
      };

      // UloLlenie do simulovanA?ho AsloLliska
      fileStorage.set(fileData.id, fileData);

      // UloLlenie metadA?t do databA?zy (tu by bolo API volanie)
      await this.saveFileMetadata(fileData);

      return fileData;
    } catch (error) {
      console.error('Chyba pri nahrA?vanA? sAsboru:', error);
      throw new Error('Nepodarilo sa nahraLA sAsbor');
    }
  }

  // Generovanie pre-signed URL pre sLAahovanie (simulovanA?)
  async getDownloadUrl(s3Key: string, fileName: string): Promise<string> {
    try {
      // SimulA?cia oneskorenia
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // V simulovanom prostredA? vrA?time blob URL pre stiahnutie
      // V reA?lnej aplikA?cii by tu bolo generovanie pre-signed URL z S3
      return `blob:simulated-s3/${s3Key}`;
    } catch (error) {
      console.error('Chyba pri generovanA? download URL:', error);
      throw new Error('Nepodarilo sa vygenerovaLA odkaz na sLAahovanie');
    }
  }

  // NovA? metAlda pre simulovanA? sLAahovanie sAsboru
  async downloadFile(s3Key: string, fileName: string): Promise<void> {
    try {
      // NA?jdeme sAsbor v simulovanom AsloLlisku
      let fileData: FileData | undefined;
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileData = file;
          break;
        }
      }

      if (!fileData) {
        throw new Error('SAsbor nebol nA?jdenA?');
      }

      // SimulA?cia oneskorenia
      await new Promise(resolve => setTimeout(resolve, 1000));

      // VytvorA?me simulovanA? obsah sAsboru pod?la typu
      let fileContent: string;
      let mimeType: string;

      if (fileData.type.includes('pdf')) {
        // SimulovanA? PDF obsah
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
(SimulovanA? PDF sAsbor: ${fileName}) Tj
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
        // Pre obrA?zky vytvorA?me jednoduchA? SVG
        fileContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
    SimulovanA? obrA?zok: ${fileName}
  </text>
</svg>`;
        mimeType = 'image/svg+xml';
      } else if (fileData.type.includes('text') || fileData.type.includes('document')) {
        // Pre textovA? sAsbory
        fileContent = `SimulovanA? textovA? sAsbor: ${fileName}

Tento sAsbor bol vytvorenA? v simulovanom prostredA?.
DA?tum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}
Ve?lkosLA: ${fileData.size} bajtov
KategAlria: ${fileData.category}

Obsah sAsboru:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat.`;
        mimeType = 'text/plain';
      } else {
        // Pre ostatnA? typy
        fileContent = `SimulovanA? sAsbor: ${fileName}
Typ: ${fileData.type}
Ve?lkosLA: ${fileData.size} bajtov
KategAlria: ${fileData.category}
DA?tum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}`;
        mimeType = 'application/octet-stream';
      }

      // VytvorA?me blob s reA?lnym obsahom
      const blob = new Blob([fileContent], { 
        type: mimeType
      });
      
      // VytvorA?me URL pre blob
      const url = window.URL.createObjectURL(blob);
      
      // VytvorA?me do?TasnA? link pre sLAahovanie
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Vy?TistA?me
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Chyba pri sLAahovanA? sAsboru:', error);
      throw new Error('Nepodarilo sa stiahnuLA sAsbor');
    }
  }

  // NovA? metAlda pre otvorenie sAsboru v prehliada?Ti
  async openFileInBrowser(s3Key: string, fileName: string): Promise<void> {
    try {
      // NA?jdeme sAsbor v simulovanom AsloLlisku
      let fileData: FileData | undefined;
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileData = file;
          break;
        }
      }

      if (!fileData) {
        throw new Error('SAsbor nebol nA?jdenA?');
      }

      // VytvorA?me simulovanA? obsah sAsboru (rovnakA? ako pri sLAahovanA?)
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
(SimulovanA? PDF sAsbor: ${fileName}) Tj
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
    SimulovanA? obrA?zok: ${fileName}
  </text>
</svg>`;
        mimeType = 'image/svg+xml';
      } else if (fileData.type.includes('text') || fileData.type.includes('document')) {
        fileContent = `SimulovanA? textovA? sAsbor: ${fileName}

Tento sAsbor bol vytvorenA? v simulovanom prostredA?.
DA?tum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}
Ve?lkosLA: ${fileData.size} bajtov
KategAlria: ${fileData.category}

Obsah sAsboru:
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat.`;
        mimeType = 'text/plain';
      } else {
        fileContent = `SimulovanA? sAsbor: ${fileName}
Typ: ${fileData.type}
Ve?lkosLA: ${fileData.size} bajtov
KategAlria: ${fileData.category}
DA?tum vytvorenia: ${new Date().toLocaleDateString('sk-SK')}`;
        mimeType = 'application/octet-stream';
      }

      // VytvorA?me blob
      const blob = new Blob([fileContent], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      // OtvorA?me v novom okne/tabe
      const newWindow = window.open(url, '_blank');
      
      // Vy?TistA?me URL po chvA?li
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

    } catch (error) {
      console.error('Chyba pri otvA?ranA? sAsboru:', error);
      throw new Error('Nepodarilo sa otvoriLA sAsbor');
    }
  }

  // NovA? metAlda pre zA?skanie URL pre nA?h?lad
  async getPreviewUrl(s3Key: string, fileName: string): Promise<string> {
    try {
      // NA?jdeme sAsbor v simulovanom AsloLlisku
      let fileData: FileData | undefined;
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileData = file;
          break;
        }
      }

      if (!fileData) {
        throw new Error('SAsbor nebol nA?jdenA?');
      }

      // VytvorA?me simulovanA? obsah sAsboru
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
(SimulovanA? PDF sAsbor: ${fileName}) Tj
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
    SimulovanA? obrA?zok: ${fileName}
  </text>
</svg>`;
        mimeType = 'image/svg+xml';
      } else {
        // Pre ostatnA? typy vrA?time prA?zdny string - nepodporujeme nA?h?lad
        return '';
      }

      // VytvorA?me blob a URL
      const blob = new Blob([fileContent], { type: mimeType });
      return window.URL.createObjectURL(blob);

    } catch (error) {
      console.error('Chyba pri generovanA? nA?h?ladu:', error);
      throw new Error('Nepodarilo sa vygenerovaLA nA?h?lad');
    }
  }

  // Mazanie sAsboru (simulovanA?)
  async deleteFile(s3Key: string): Promise<void> {
    try {
      // SimulA?cia mazania z S3
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mazanie z simulovanA?ho AsloLliska
      for (const [id, file] of Array.from(fileStorage.entries())) {
        if (file.s3Key === s3Key) {
          fileStorage.delete(id);
          break;
        }
      }
      
      // Mazanie metadA?t z databA?zy (tu by bolo API volanie)
      await this.deleteFileMetadata(s3Key);
    } catch (error) {
      console.error('Chyba pri mazanA? sAsboru:', error);
      throw new Error('Nepodarilo sa vymazaLA sAsbor');
    }
  }

  // ZA?skanie sAsborov pre firmu (simulovanA?)
  async getCompanyFiles(companyId: number): Promise<FileData[]> {
    try {
      // SimulA?cia API volania
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // VrA?time sAsbory z simulovanA?ho AsloLliska pre danAs firmu
      const companyFiles = Array.from(fileStorage.values()).filter(
        file => file.companyId === companyId
      );
      
      return companyFiles;
    } catch (error) {
      console.error('Chyba pri zA?skavanA? sAsborov:', error);
      throw new Error('Nepodarilo sa na?TA?taLA sAsbory');
    }
  }

  // UloLlenie metadA?t do databA?zy
  private async saveFileMetadata(fileData: FileData): Promise<void> {
    try {
      // API volanie na uloLlenie metadA?t
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData)
      });

      if (!response.ok) {
        throw new Error('Nepodarilo sa uloLliLA metadA?ta sAsboru');
      }
    } catch (error) {
      console.error('Chyba pri ukladanA? metadA?t:', error);
      throw error;
    }
  }

  // Mazanie metadA?t z databA?zy
  private async deleteFileMetadata(s3Key: string): Promise<void> {
    try {
      // API volanie na mazanie metadA?t
      const response = await fetch(`/api/files/${encodeURIComponent(s3Key)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Nepodarilo sa vymazaLA metadA?ta sAsboru');
      }
    } catch (error) {
      console.error('Chyba pri mazanA? metadA?t:', error);
      throw error;
    }
  }

  // Kontrola ve?lkosti sAsboru
  validateFileSize(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  // Kontrola typu sAsboru
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }
}

export const fileService = new FileService();

/*
=== INL?TRUKCIE PRE AWS S3 INTEGRA?CIU ===

1. NainL?talujte AWS SDK v3:
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

2. Odkomentujte a upravte S3 kAld:
   - Nahra?Zte simulovanA? AsloLlisko skuto?TnA?m S3 klientom
   - Odkomentujte S3 upload/delete operA?cie
   - Nastavte sprA?vne environment premennA?

3. PrA?klad S3 integrA?cie:
   import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

   const s3Client = new S3Client({
     region: process.env.REACT_APP_AWS_REGION,
     credentials: {
       accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID!,
       secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY!
     }
   });

4. Environment premennA? (.env):
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

