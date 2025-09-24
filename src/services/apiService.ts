// src/services/apiService.ts

// =========================
// Base URL (ENV) ??" JEDINAt zdroj pravdy
// =========================
const envBase =
  process.env.REACT_APP_API_BASE ||        // preferovanA? (Netlify: /api)
  process.env.REACT_APP_API_URL  ||        // legacy fallback, ak by niekde ostalo
  '/api';

export const API_BASE_URL = envBase.replace(/\/$/, ''); // bez trailing /
export const API_ORIGIN = ''; // nepouLlA?vaj pevnA? host

// =========================
// PomocnA? funkcie
// =========================
const withLeadingSlash = (endpoint: string) =>
  endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

const isJsonResponse = (resp: Response) => {
  const ct = resp.headers.get('content-type') || '';
  return ct.includes('application/json');
};

// =========================
// Typy pre API
// =========================
export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'accountant' | 'user' | 'employee';
  status: 'active' | 'inactive';
  phone?: string;
}

export interface Company {
  id: number;
  ico: string;
  name: string;
  address: string;
  business_registry?: string;
  vat_id?: string;
  tax_id?: string;
  authorized_person: string;
  contact_email?: string;
  contact_phone?: string;
  owner_email: string;
  email?: string; // kompatibilita
  assignedToAccountants: string[];
  status: 'active' | 'inactive';
  hasDropbox?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  company_id: number;
  company_name: string;
  created_by: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FileData {
  id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  company_id: number;
  company_name?: string;
  uploaded_by: string;
  file_path: string;
  category: string;
  created_at: string;
}

export interface DocumentData {
  id: number;
  original_name: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description?: string;
  company_id: number;
  company_name?: string;
  uploaded_by: string;
  created_at: string;
}

// =========================
// API Service class
// =========================
class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    // udrLl kompatibilitu s historickA?mi k?lAs?Tmi
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token =
        localStorage.getItem('token') ||
        localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const ep = withLeadingSlash(endpoint);
    const url = `${API_BASE_URL}${ep}`;
    const token = this.getToken();

    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // skAss pre?TA?taLA JSON chybu, inak text
        let errMsg = `HTTP ${response.status}`;
        try {
          if (isJsonResponse(response)) {
            const e = await response.json();
            errMsg = e?.error || errMsg;
          } else {
            const t = await response.text();
            if (t) errMsg = t;
          }
        } catch {}
        throw new Error(errMsg);
      }

      // 204/205 alebo prA?zdny content -> vrA?LA prA?zdny objekt
      const len = response.headers.get('content-length');
      if (response.status === 204 || response.status === 205 || len === '0') {
        return {} as T;
      }

      if (isJsonResponse(response)) {
        return (await response.json()) as T;
      } else {
        // ne-JSON odpove?Z (napr. text)
        const txt = await response.text();
        // @ts-ignore ??" nechA?me caller rozhodnAsLA
        return txt as unknown as T;
      }
    } catch (error) {
      // centralizovanA? logovanie
      console.error('API request error:', { url, endpoint: ep, error });
      throw error;
    }
  }

  // ================
  // Generic HTTP methods
  // ================
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    // bez Content-Type ??" boundary nastavA? prehliada?T
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // =========================
  // Auth endpoints
  // =========================
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async registerAccountant(email: string, password: string, name: string, phone?: string) {
    return this.request<{ message: string; userId: number }>('/auth/register-accountant', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    });
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    status?: string;
    phone?: string;
  }) {
    return this.request<{ message: string; userId: number; user: User }>('/auth/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getAllUsers() {
    return this.request<User[]>('/auth/users');
  }

  async getAllAccountants() {
    return this.request<User[]>('/auth/users/accountants');
  }

  async getUserById(id: number) {
    return this.request<User>(`/auth/users/${id}`);
  }

  async updateUser(id: number, userData: {
    name: string;
    email: string;
    role: string;
    status?: string;
    phone?: string;
  }) {
    return this.request<{ message: string; user: User }>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changeUserPassword(id: number, password: string) {
    return this.request<{ message: string }>(`/auth/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  async deleteUser(id: number) {
    return this.request<{ message: string }>(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  }

  // =========================
  // Companies endpoints
  // =========================
  async getAllCompanies() {
    return this.request<Company[]>('/companies');
  }

  async getAllCompaniesForAdmin() {
    return this.request<Company[]>('/companies/admin/all');
  }

  async getUserCompanies(userEmail: string) {
    return this.request<Company[]>(`/companies/user/${encodeURIComponent(userEmail)}`);
  }

  async createCompany(companyData: Omit<Company, 'id' | 'assignedToAccountants' | 'created_at' | 'updated_at'>) {
    return this.request<{ message: string; companyId: number }>('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(id: number, companyData: Partial<Company>) {
    return this.request<{ message: string }>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(id: number) {
    return this.request<{ message: string }>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  async deactivateCompany(id: number) {
    return this.request<{ message: string }>(`/companies/${id}/deactivate`, {
      method: 'PATCH',
    });
  }

  async activateCompany(id: number) {
    return this.request<{ message: string }>(`/companies/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async getInactiveCompanies() {
    return this.request<Company[]>('/companies/inactive');
  }

  async getAccountantsForCompany(companyId: number) {
    return this.request<any[]>(`/companies/${companyId}/accountants`);
  }

  async getAvailableAccountantsForCompany(companyId: number) {
    return this.request<any[]>(`/companies/${companyId}/available-accountants`);
  }

  async assignAccountantsToCompany(companyId: number, accountantEmails: string[]) {
    return this.request<{ message: string }>(`/companies/${companyId}/assign-accountants`, {
      method: 'POST',
      body: JSON.stringify({ accountantEmails }),
    });
  }

  async unassignAccountantFromCompany(companyId: number, accountantEmail: string) {
    return this.request<{ message: string }>(
      `/companies/${companyId}/accountants/${encodeURIComponent(accountantEmail)}`,
      { method: 'DELETE' }
    );
  }

  async getCompanyById(id: number) {
    return this.request<Company>(`/companies/${id}`);
  }

  async getAccountantCompanies(accountantEmail: string) {
    return this.request<Company[]>(`/companies/accountant/${encodeURIComponent(accountantEmail)}`);
  }

  async getCompaniesForAccountant(accountantEmail: string) {
    return this.request<Company[]>(`/companies/accountant/${encodeURIComponent(accountantEmail)}`);
  }

  // =========================
  // Tasks endpoints
  // =========================
  async getAllTasks() {
    return this.request<Task[]>('/tasks');
  }

  async getCompanyTasks(companyId: number) {
    return this.request<Task[]>(`/tasks/company/${companyId}`);
  }

  async getAccountantTasks(accountantEmail: string) {
    return this.request<Task[]>(`/tasks/accountant/${encodeURIComponent(accountantEmail)}`);
  }

  async getUserTasks(userEmail: string) {
    return this.request<Task[]>(`/tasks/user/${encodeURIComponent(userEmail)}`);
  }

  async getTask(taskId: number) {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    return this.request<{ message: string; taskId: number }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: number, taskData: Partial<Task>) {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async updateTaskStatus(id: number, status: Task['status']) {
    return this.request<{ message: string }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteTask(id: number) {
    return this.request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // =========================
  // Files endpoints
  // =========================
  async getAllFiles() {
    return this.request<FileData[]>('/files/admin/all');
  }

  async getCompanyFiles(companyId: number) {
    return this.request<FileData[]>(`/files/company/${companyId}`);
  }

  async uploadFile(file: File, companyId: number, uploadedBy: string, category?: string): Promise<FileData> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyId.toString());
    formData.append('uploaded_by', uploadedBy);
    if (category) formData.append('category', category);
    return this.postFormData<FileData>('/files/upload', formData);
  }

  async downloadFile(fileId: number) {
    return this.request<Blob>(`/files/download/${fileId}` as any);
  }

  async previewFile(fileId: number) {
    return this.request<Blob>(`/files/preview/${fileId}` as any);
  }

  async deleteFile(fileId: number) {
    return this.request<{ message: string }>(`/files/${fileId}`, { method: 'DELETE' });
  }

  async emptyTrash(companyId: number) {
    return this.request<{ message: string }>(`/files/company/${companyId}/trash/empty`, { method: 'DELETE' });
  }

  // =========================
  // Health check
  // =========================
  async healthCheck() {
    return this.request<{ status?: string; message?: string }>('/health');
  }

  // =========================
  // Messages endpoints
  // =========================
  async getUserMessages(userEmail: string) {
    return this.request<any[]>(`/messages/user/${encodeURIComponent(userEmail)}`);
  }

  async getUnreadMessages(userEmail: string) {
    return this.request<any[]>(`/messages/user/${encodeURIComponent(userEmail)}/unread`);
  }

  async getCompanyMessages(companyId: number) {
    return this.request<any[]>(`/messages/company/${companyId}`);
  }

  async getEmployeeMessages(employeeEmail: string) {
    return this.request<any[]>(`/messages/employee/${encodeURIComponent(employeeEmail)}`);
  }

  async getAllMessages() {
    return this.request<any[]>('/messages/admin/all');
  }

  async sendMessage(messageData: {
    sender_email: string;
    recipient_email: string;
    subject: string;
    content: string;
    company_id?: number;
    message_type?: string;
  }) {
    return this.request<{ message: string; messageId: number }>('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessageAsRead(messageId: number) {
    return this.request<{ message: string }>(`/messages/${messageId}/read`, { method: 'PATCH' });
  }

  async markMessageAsUnread(messageId: number) {
    return this.request<{ message: string }>(`/messages/${messageId}/unread`, { method: 'PATCH' });
  }

  async deleteMessage(messageId: number) {
    return this.request<{ message: string }>(`/messages/${messageId}`, { method: 'DELETE' });
  }

  async getUnreadCount(userEmail: string) {
    const response = await this.request<{ unreadCount: number }>(
      `/messages/user/${encodeURIComponent(userEmail)}/unread-count`
    );
    return response.unreadCount;
  }

  async getUnreadCounts(userEmail: string) {
    return this.request<{
      receivedUnreadCount: number;
      sentUnreadCount: number;
      totalUnreadCount: number;
    }>(`/messages/user/${encodeURIComponent(userEmail)}/unread-counts`);
  }

  async getCompanyUnreadCount(companyId: number) {
    const response = await this.request<{ unreadCount: number }>(
      `/messages/company/${companyId}/unread-count`
    );
    return response.unreadCount;
  }

  async getCompanyUnreadCounts(companyId: number) {
    return this.request<{
      receivedUnreadCount: number;
      sentUnreadCount: number;
      totalUnreadCount: number;
    }>(`/messages/company/${companyId}/unread-counts`);
  }

  async getConversation(user1: string, user2: string) {
    return this.request<any[]>(
      `/messages/conversation/${encodeURIComponent(user1)}/${encodeURIComponent(user2)}`
    );
  }

  // =========================
  // Documents endpoints
  // =========================
  async getDocumentCategories() {
    return this.request<{ [key: string]: { name: string; description: string; allowedTypes: string[] } }>(
      '/documents/categories'
    );
  }

  async getCompanyDocuments(companyId: number, category?: string) {
    const params = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<DocumentData[]>(`/documents/company/${companyId}${params}`);
  }

  async getAllDocuments() {
    return this.request<DocumentData[]>('/documents/admin/all');
  }

  async getAccountantDocuments(accountantEmail: string, category?: string) {
    const params = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<DocumentData[]>(
      `/documents/accountant/${encodeURIComponent(accountantEmail)}${params}`
    );
  }

  async uploadDocument(formData: FormData) {
    return this.postFormData<{ document: DocumentData }>('/documents/upload', formData);
  }

  async downloadDocument(documentId: number) {
    return this.request<Blob>(`/documents/download/${documentId}` as any);
  }

  async previewDocument(documentId: number) {
    return this.request<Blob>(`/documents/preview/${documentId}` as any);
  }

  async deleteDocument(documentId: number) {
    return this.request<{ message: string }>(`/documents/${documentId}`, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();

