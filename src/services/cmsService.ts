import { apiService } from './apiService';

export interface CmsContent {
  [section: string]: {
    [field: string]: string;
  };
}

export interface CmsUpdate {
  section: string;
  field: string;
  value: string;
}

export interface CmsVersion {
  id: number;
  version_name: string;
  description?: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface CmsHistoryItem {
  id: number;
  value: string;
  version: number;
  created_by: string;
  created_at: string;
}

class CmsService {
  private baseUrl = 'http://localhost:5000/api/cms';

  // Získanie všetkého aktívneho obsahu
  async getContent(): Promise<CmsContent> {
    try {
      const response = await fetch(`${this.baseUrl}/content`);
      if (!response.ok) {
        throw new Error('Chyba pri načítaní obsahu');
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Chyba pri načítaní CMS obsahu:', error);
      throw error;
    }
  }

  // Získanie obsahu pre konkrétnu sekciu
  async getSectionContent(section: string): Promise<{ [field: string]: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${section}`);
      if (!response.ok) {
        throw new Error('Chyba pri načítaní sekcie');
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Chyba pri načítaní sekcie:', error);
      throw error;
    }
  }

  // Aktualizácia jedného poľa
  async updateField(section: string, field: string, value: string): Promise<{ id: number; version: number }> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ section, field, value })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba pri aktualizácii obsahu');
      }

      const data = await response.json();
      return { id: data.id, version: data.version };
    } catch (error) {
      console.error('Chyba pri aktualizácii poľa:', error);
      throw error;
    }
  }

  // Hromadná aktualizácia obsahu
  async batchUpdate(updates: CmsUpdate[]): Promise<{ results: any[] }> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/content/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba pri hromadnej aktualizácii');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chyba pri hromadnej aktualizácii:', error);
      throw error;
    }
  }

  // Získanie všetkých verzií
  async getVersions(): Promise<CmsVersion[]> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Chyba pri načítaní verzií');
      }

      const data = await response.json();
      return data.versions;
    } catch (error) {
      console.error('Chyba pri načítaní verzií:', error);
      throw error;
    }
  }

  // Vytvorenie novej verzie
  async createVersion(versionName: string, description?: string): Promise<{ id: number; version_name: string }> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ version_name: versionName, description })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba pri vytvorení verzie');
      }

      const data = await response.json();
      return { id: data.id, version_name: data.version_name };
    } catch (error) {
      console.error('Chyba pri vytvorení verzie:', error);
      throw error;
    }
  }

  // Získanie histórie zmien pre konkrétne pole
  async getHistory(section: string, field: string): Promise<CmsHistoryItem[]> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/history/${section}/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Chyba pri načítaní histórie');
      }

      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('Chyba pri načítaní histórie:', error);
      throw error;
    }
  }

  // Obnovenie predchádzajúcej verzie
  async restoreVersion(id: number): Promise<{ id: number; version: number }> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/restore/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chyba pri obnovení verzie');
      }

      const data = await response.json();
      return { id: data.id, version: data.version };
    } catch (error) {
      console.error('Chyba pri obnovení verzie:', error);
      throw error;
    }
  }

  // Pomocná metóda pre konverziu obsahu do formátu pre batch update
  prepareBatchUpdates(content: CmsContent): CmsUpdate[] {
    const updates: CmsUpdate[] = [];
    
    Object.entries(content).forEach(([section, fields]) => {
      Object.entries(fields).forEach(([field, value]) => {
        updates.push({ section, field, value });
      });
    });
    
    return updates;
  }
}

export const cmsService = new CmsService();
