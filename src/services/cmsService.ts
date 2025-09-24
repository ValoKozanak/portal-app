import { apiService } from './apiService';
import { API_BASE_URL } from './apiService';
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
  private baseUrl = `${API_BASE_URL}/cms`;

  // ZA?skanie vL?etkA?ho aktA?vneho obsahu
  async getContent(): Promise<CmsContent> {
    try {
      const response = await fetch(`${this.baseUrl}/content`);
      if (!response.ok) {
        throw new Error('Chyba pri na?TA?tanA? obsahu');
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Chyba pri na?TA?tanA? CMS obsahu:', error);
      throw error;
    }
  }

  // ZA?skanie obsahu pre konkrA?tnu sekciu
  async getSectionContent(section: string): Promise<{ [field: string]: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/content/${section}`);
      if (!response.ok) {
        throw new Error('Chyba pri na?TA?tanA? sekcie');
      }
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Chyba pri na?TA?tanA? sekcie:', error);
      throw error;
    }
  }

  // AktualizA?cia jednA?ho po?la
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
        throw new Error(errorData.error || 'Chyba pri aktualizA?cii obsahu');
      }

      const data = await response.json();
      return { id: data.id, version: data.version };
    } catch (error) {
      console.error('Chyba pri aktualizA?cii po?la:', error);
      throw error;
    }
  }

  // HromadnA? aktualizA?cia obsahu
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
        throw new Error(errorData.error || 'Chyba pri hromadnej aktualizA?cii');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chyba pri hromadnej aktualizA?cii:', error);
      throw error;
    }
  }

  // ZA?skanie vL?etkA?ch verziA?
  async getVersions(): Promise<CmsVersion[]> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Chyba pri na?TA?tanA? verziA?');
      }

      const data = await response.json();
      return data.versions;
    } catch (error) {
      console.error('Chyba pri na?TA?tanA? verziA?:', error);
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
        throw new Error(errorData.error || 'Chyba pri vytvorenA? verzie');
      }

      const data = await response.json();
      return { id: data.id, version_name: data.version_name };
    } catch (error) {
      console.error('Chyba pri vytvorenA? verzie:', error);
      throw error;
    }
  }

  // ZA?skanie histAlrie zmien pre konkrA?tne pole
  async getHistory(section: string, field: string): Promise<CmsHistoryItem[]> {
    try {
      const token = apiService.getToken();
      const response = await fetch(`${this.baseUrl}/history/${section}/${field}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Chyba pri na?TA?tanA? histAlrie');
      }

      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('Chyba pri na?TA?tanA? histAlrie:', error);
      throw error;
    }
  }

  // Obnovenie predchA?dzajAscej verzie
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
        throw new Error(errorData.error || 'Chyba pri obnovenA? verzie');
      }

      const data = await response.json();
      return { id: data.id, version: data.version };
    } catch (error) {
      console.error('Chyba pri obnovenA? verzie:', error);
      throw error;
    }
  }

  // PomocnA? metAlda pre konverziu obsahu do formA?tu pre batch update
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

