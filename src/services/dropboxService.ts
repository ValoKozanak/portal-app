import { Dropbox } from 'dropbox';

// Dropbox konfigurácia
const DROPBOX_APP_KEY = process.env.REACT_APP_DROPBOX_APP_KEY || '';
const DROPBOX_APP_SECRET = process.env.REACT_APP_DROPBOX_APP_SECRET || '';
const DROPBOX_REDIRECT_URI = process.env.REACT_APP_DROPBOX_REDIRECT_URI || 'http://localhost:3000/dropbox-callback';

export interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  size: number;
  server_modified: string;
  content_hash: string;
  tag: string;
}

export interface DropboxUploadResult {
  id: string;
  name: string;
  path_lower: string;
  size: number;
  server_modified: string;
}

export interface DropboxAuthResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  uid: string;
  account_id: string;
}

class DropboxService {
  private dbx: Dropbox | null = null;
  private accessToken: string | null = null;

  constructor() {
    console.log('DropboxService: Inicializujem...');
    console.log('DropboxService: Environment premenné:', {
      appKey: DROPBOX_APP_KEY,
      appSecret: DROPBOX_APP_SECRET ? '***' : 'CHÝBA',
      appSecretLength: DROPBOX_APP_SECRET ? DROPBOX_APP_SECRET.length : 0,
      redirectUri: DROPBOX_REDIRECT_URI
    });
    
    this.accessToken = localStorage.getItem('dropbox_access_token');
    console.log('DropboxService: Token z localStorage:', this.accessToken ? 'existuje' : 'neexistuje');
    
    if (this.accessToken) {
      this.initializeDropbox(this.accessToken);
      console.log('DropboxService: Dropbox klient inicializovaný');
    } else {
      console.log('DropboxService: Žiadny token, Dropbox klient nie je inicializovaný');
    }
  }

  // Inicializácia Dropbox klienta
  private initializeDropbox(accessToken: string) {
    this.dbx = new Dropbox({
      accessToken: accessToken,
      fetch: window.fetch.bind(window)
    });
  }

  // Generovanie OAuth URL pre autentifikáciu
  getAuthUrl(): string {
    // Vyčistíme starý state pred vytvorením nového
    localStorage.removeItem('dropbox_auth_state');
    
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('dropbox_auth_state', state);
    
    console.log('DropboxService.getAuthUrl - konfigurácia:', {
      appKey: DROPBOX_APP_KEY,
      redirectUri: DROPBOX_REDIRECT_URI,
      state: state,
      timestamp: new Date().toISOString()
    });
    
    const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}&state=${state}&token_access_type=offline`;
    
    console.log('DropboxService.getAuthUrl - vygenerovaný URL:', authUrl);
    
    return authUrl;
  }

  // Spracovanie OAuth callback
  async handleAuthCallback(code: string, state: string): Promise<DropboxAuthResult> {
    console.log('dropboxService.handleAuthCallback - začiatok');
    console.log('Parametre:', { code: code.substring(0, 10) + '...', state });
    
    const savedState = localStorage.getItem('dropbox_auth_state');
    console.log('Uložený state:', savedState);
    console.log('State porovnanie:', { received: state, saved: savedState, match: state === savedState });
    
    if (state !== savedState) {
      console.error('State nezhoduje:', { received: state, saved: savedState });
      console.error('Všetky localStorage položky:', {
        dropbox_auth_state: localStorage.getItem('dropbox_auth_state'),
        dropbox_access_token: localStorage.getItem('dropbox_access_token'),
        dropbox_refresh_token: localStorage.getItem('dropbox_refresh_token')
      });
      throw new Error('Invalid state parameter');
    }
    
    // State kontrola úspešná, pokračujem v spracovaní...
    console.log('State kontrola úspešná, pokračujem v spracovaní...');

    try {
      console.log('Posielam požiadavku na Dropbox API...');
      console.log('DropboxService.handleAuthCallback - parametre pre API:', {
        code: code.substring(0, 10) + '...',
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET ? '***' : 'CHÝBA',
        redirect_uri: DROPBOX_REDIRECT_URI
      });
      
      const requestBody = new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
        redirect_uri: DROPBOX_REDIRECT_URI,
      });
      
      console.log('DropboxService.handleAuthCallback - request body:', requestBody.toString());
      
      const response = await window.fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
      });

      console.log('Dropbox API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dropbox API error:', errorText);
        console.error('Dropbox API response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Failed to exchange code for token: ${errorText}`);
      }

      const authResult: DropboxAuthResult = await response.json();
      console.log('Dropbox API úspešná odpoveď:', { 
        access_token: authResult.access_token.substring(0, 10) + '...',
        token_type: authResult.token_type,
        expires_in: authResult.expires_in
      });
      
      // Uloženie tokenu
      this.accessToken = authResult.access_token;
      localStorage.setItem('dropbox_access_token', authResult.access_token);
      if (authResult.refresh_token) {
        localStorage.setItem('dropbox_refresh_token', authResult.refresh_token);
      }
      
      // Vyčistíme state po úspešnom spracovaní
      localStorage.removeItem('dropbox_auth_state');
      console.log('State vyčistený po úspešnom spracovaní');

      console.log('Tokeny uložené do localStorage');

      // Inicializácia Dropbox klienta
      this.initializeDropbox(authResult.access_token);
      console.log('Dropbox klient inicializovaný');

      return authResult;
    } catch (error) {
      console.error('Error during OAuth callback:', error);
      throw error;
    }
  }

  // Kontrola, či je používateľ prihlásený
  isAuthenticated(): boolean {
    // Skontrolujeme token z localStorage
    const tokenFromStorage = localStorage.getItem('dropbox_access_token');
    
    // Ak máme token v localStorage ale nie v pamäti, inicializujeme klienta
    if (tokenFromStorage && !this.accessToken) {
      this.accessToken = tokenFromStorage;
      this.initializeDropbox(tokenFromStorage);
      console.log('DropboxService.isAuthenticated: Reinicializoval klienta z localStorage');
    }
    
    const authenticated = this.dbx !== null && this.accessToken !== null;
    console.log('DropboxService.isAuthenticated:', { 
      dbx: this.dbx !== null, 
      accessToken: this.accessToken !== null,
      tokenFromStorage: tokenFromStorage ? 'existuje' : 'neexistuje',
      result: authenticated 
    });
    return authenticated;
  }

  // Odhlásenie
  logout(): void {
    this.dbx = null;
    this.accessToken = null;
    localStorage.removeItem('dropbox_access_token');
    localStorage.removeItem('dropbox_refresh_token');
    localStorage.removeItem('dropbox_auth_state');
  }

  // Získanie informácií o účte
  async getAccountInfo() {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      console.log('DropboxService.getAccountInfo - volám Dropbox API...');
      // Pridáme kontrolu, či je dbx správne inicializovaný
      if (!this.dbx.usersGetCurrentAccount) {
        throw new Error('Dropbox client not properly initialized');
      }
      
      // Pridáme kontrolu, či je fetch správne nastavený
      if (!this.dbx.usersGetCurrentAccount) {
        console.error('Dropbox client methods not available');
        throw new Error('Dropbox client methods not available');
      }
      
      const response = await this.dbx.usersGetCurrentAccount();
      console.log('DropboxService.getAccountInfo - odpoveď:', response);
      return response.result;
    } catch (error) {
      console.error('Error getting account info:', error);
      // Ak je problém s fetch, skúsime reinicializovať klienta
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('Illegal invocation'))) {
        console.log('DropboxService.getAccountInfo - problém s fetch, reinicializujem klienta...');
        const token = localStorage.getItem('dropbox_access_token');
        if (token) {
          this.initializeDropbox(token);
          const response = await this.dbx!.usersGetCurrentAccount();
          console.log('DropboxService.getAccountInfo - reinicializácia úspešná:', response);
          return response.result;
        }
      }
      throw error;
    }
  }

  // Získanie zoznamu súborov z priečinka
  async listFiles(path: string = '', userEmail?: string): Promise<DropboxFile[]> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      console.log('=== DROPBOX SERVICE DEBUG ===');
      console.log('DropboxService.listFiles - začiatok');
      console.log('DropboxService.listFiles - path:', path);
      console.log('DropboxService.listFiles - userEmail:', userEmail);
      console.log('DropboxService.listFiles - this.dbx exists:', !!this.dbx);
      
      // Ak je zadaný userEmail, použijeme špecifickú cestu pre firmu
      let targetPath = path;
      if (userEmail && !path.startsWith('/Portal/Companies/')) {
        // Vytvoríme cestu pre firmu na základe emailu
        const companyFolder = this.getCompanyFolderPath(userEmail);
        targetPath = companyFolder + (path ? '/' + path : '');
        console.log('DropboxService.listFiles - companyFolder:', companyFolder);
      }
      
      console.log('DropboxService.listFiles - targetPath:', targetPath);
      console.log('DropboxService.listFiles - volám this.dbx.filesListFolder...');

      const response = await this.dbx.filesListFolder({
        path: targetPath,
        limit: 100
      });

      console.log('DropboxService.listFiles - response received');
      const mappedFiles = response.result.entries.map(entry => ({
        id: entry['.tag'] === 'deleted' ? '' : (entry as any).id || '',
        name: entry.name,
        path_lower: entry.path_lower || '',
        size: entry['.tag'] === 'file' ? (entry as any).size || 0 : 0,
        server_modified: entry['.tag'] === 'file' ? (entry as any).server_modified || '' : '',
        content_hash: entry['.tag'] === 'file' ? (entry as any).content_hash || '' : '',
        tag: entry['.tag']
      }));
      
      return mappedFiles;
    } catch (error) {
      console.error('DropboxService.listFiles - ERROR:', error);
      if (error instanceof Error) {
        console.error('DropboxService.listFiles - error.message:', error.message);
        console.error('DropboxService.listFiles - error.stack:', error.stack);
      }
      throw error;
    }
  }

  // Generovanie cesty pre firmu na základe emailu
  getCompanyFolderPath(userEmail: string): string {
    const emailHash = this.hashEmail(userEmail);
    return `/Portal/Companies/${emailHash}`;
  }

  // Jednoduchý hash emailu pre vytvorenie unikátnej cesty
  hashEmail(email: string): string {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Vytvorenie zdieľateľnej zložky pre firmu
  async createCompanyFolder(userEmail: string): Promise<string> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      const companyPath = this.getCompanyFolderPath(userEmail);
      
      // Vytvorenie priečinka
      const response = await this.dbx.filesCreateFolderV2({
        path: companyPath,
        autorename: false
      });
      
      return companyPath;
    } catch (error) {
      console.error('Error creating company folder:', error);
      throw error;
    }
  }

  // Získanie zdieľateľného linku pre firmu
  async getCompanySharedLink(userEmail: string): Promise<string> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      const companyPath = this.getCompanyFolderPath(userEmail);
      return await this.getSharedLink(companyPath);
    } catch (error) {
      console.error('Error getting company shared link:', error);
      throw error;
    }
  }

  // Nahrávanie súboru do Dropbox
  async uploadFile(file: File, path: string, userEmail?: string, onProgress?: (progress: number) => void): Promise<DropboxUploadResult> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      const fileBuffer = await file.arrayBuffer();
      
      // Ak je zadaný userEmail, použijeme špecifickú cestu pre firmu
      let fullPath = path + '/' + file.name;
      if (userEmail && !path.startsWith('/Portal/Companies/')) {
        const companyFolder = this.getCompanyFolderPath(userEmail);
        fullPath = companyFolder + '/' + (path ? path + '/' : '') + file.name;
        console.log('DropboxService.uploadFile - companyFolder:', companyFolder);
      }
      
      console.log('DropboxService.uploadFile - fullPath:', fullPath);

      const response = await this.dbx.filesUpload({
        path: fullPath,
        contents: fileBuffer,
        mode: { '.tag': 'overwrite' },
        autorename: true,
        mute: false
      });

      console.log('DropboxService.uploadFile - upload response:', response);

      return {
        id: response.result.id,
        name: response.result.name,
        path_lower: response.result.path_lower || '',
        size: response.result.size,
        server_modified: response.result.server_modified
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Stiahnutie súboru z Dropbox
  async downloadFile(path: string): Promise<Blob> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      const response = await this.dbx.filesDownload({
        path: path
      });

      // Konverzia ArrayBuffer na Blob
      const fileBlob = (response.result as any).fileBlob;
      const blob = new Blob([fileBlob], {
        type: fileBlob.type || 'application/octet-stream'
      });

      return blob;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Vymazanie súboru z Dropbox
  async deleteFile(path: string): Promise<void> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      await this.dbx.filesDeleteV2({
        path: path
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Vytvorenie priečinka
  async createFolder(path: string): Promise<void> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      await this.dbx.filesCreateFolderV2({
        path: path,
        autorename: true
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Získanie zdieľateľného linku
  async getSharedLink(path: string): Promise<string> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      const response = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: path,
        settings: {
          requested_visibility: { '.tag': 'public' },
          audience: { '.tag': 'public' },
          access: { '.tag': 'viewer' }
        }
      });

      return response.result.url;
    } catch (error) {
      console.error('Error creating shared link:', error);
      throw error;
    }
  }

  // Obnovenie access tokenu
  async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('dropbox_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await window.fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: DROPBOX_APP_KEY,
          client_secret: DROPBOX_APP_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const result = await response.json();
      this.accessToken = result.access_token;
      localStorage.setItem('dropbox_access_token', result.access_token);

      // Inicializácia Dropbox klienta s novým tokenom
      this.initializeDropbox(result.access_token);

      return result.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // ===== ADMIN FUNKCIE =====

  // Vytvorenie zdieľateľného linku s oprávneniami (pre admin)
  async createSharedLink(folderPath: string, permissions: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  }): Promise<string> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      console.log('DropboxService.createSharedLink - vytváram link pre:', folderPath);
      console.log('DropboxService.createSharedLink - oprávnenia:', permissions);
      
      // Určenie prístupu na základe oprávnení
      let access: { '.tag': 'viewer' } | { '.tag': 'editor' } = { '.tag': 'viewer' };
      if (permissions.canEdit || permissions.canUpload || permissions.canDelete) {
        access = { '.tag': 'editor' };
      }
      
      console.log('DropboxService.createSharedLink - access level:', access);

      const response = await this.dbx.sharingCreateSharedLinkWithSettings({
        path: folderPath,
        settings: {
          requested_visibility: { '.tag': 'public' },
          audience: { '.tag': 'public' },
          access: access
        }
      });

      console.log('DropboxService.createSharedLink - úspešne vytvorený link:', response.result.url);
      return response.result.url;
    } catch (error) {
      console.error('Error creating shared link with permissions:', error);
      
             // Ak je chyba 409 (Conflict) alebo "shared_link_already_exists", skúsime získať existujúci link
       if (error instanceof Error && (error.message.includes('shared_link_already_exists') || error.message.includes('409'))) {
         console.log('Link už existuje (409), získavam existujúci link...');
         try {
           const existingLinks = await this.dbx.sharingListSharedLinks({
             path: folderPath,
             direct_only: false
           });
           
           if (existingLinks.result.links.length > 0) {
             console.log('Našiel som existujúci link:', existingLinks.result.links[0].url);
             return existingLinks.result.links[0].url;
           }
         } catch (listError) {
           console.error('Chyba pri získavaní existujúceho linku:', listError);
         }
       }
      
      throw error;
    }
  }

  // Odvolanie zdieľateľného linku
  async revokeSharedLink(shareLink: string): Promise<void> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      console.log('DropboxService.revokeSharedLink - odvolávam link:', shareLink);
      
      await this.dbx.sharingRevokeSharedLink({
        url: shareLink
      });
      
      console.log('DropboxService.revokeSharedLink - link úspešne odvolaný');
    } catch (error) {
      console.error('Error revoking shared link:', error);
      
      // Ak link už neexistuje, považujeme to za úspech
      if (error instanceof Error && error.message.includes('not_found')) {
        console.log('Link už neexistuje, považujem za úspešne odvolaný');
        return;
      }
      
      throw error;
    }
  }

  // Získanie všetkých zdieľateľných linkov
  async getAllSharedLinks(): Promise<any[]> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      console.log('DropboxService.getAllSharedLinks - získavam všetky zdieľateľné linky...');
      
      const response = await this.dbx.sharingListSharedLinks({
        path: '/Portal/Companies',
        direct_only: false
      });

      console.log('DropboxService.getAllSharedLinks - načítané linky:', response.result.links);
      return response.result.links;
    } catch (error) {
      console.error('Error getting shared links:', error);
      throw error;
    }
  }

  // Kontrola, či zložka existuje
  async checkFolderExists(folderPath: string): Promise<boolean> {
    if (!this.dbx) {
      throw new Error('Dropbox not initialized');
    }

    try {
      console.log('DropboxService.checkFolderExists - kontrolujem zložku:', folderPath);
      
      const response = await this.dbx.filesGetMetadata({
        path: folderPath
      });
      
      console.log('DropboxService.checkFolderExists - zložka existuje:', response);
      return response.result['.tag'] === 'folder';
    } catch (error) {
      console.log('DropboxService.checkFolderExists - zložka neexistuje:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dropboxService = new DropboxService();
export default dropboxService;
