const API_BASE_URL = 'http://localhost:5000/api';

// Typy pre API
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'accountant' | 'user';
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
  email?: string; // Add email property for compatibility
  assignedToAccountants: string[];
  status: 'active' | 'inactive';
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

// API Service class
class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
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

  // Companies endpoints
  async getAllCompanies() {
    return this.request<Company[]>('/companies');
  }

  async getAllCompaniesForAdmin() {
    return this.request<Company[]>('/companies/admin/all');
  }

  async getUserCompanies(userEmail: string) {
    return this.request<Company[]>(`/companies/user/${userEmail}`);
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

  async assignAccountantsToCompany(companyId: number, accountantEmails: string[]) {
    return this.request<{ message: string }>(`/companies/${companyId}/assign-accountants`, {
      method: 'POST',
      body: JSON.stringify({ accountantEmails }),
    });
  }

  async getCompanyById(id: number) {
    return this.request<Company>(`/companies/${id}`);
  }

  async getAccountantCompanies(accountantEmail: string) {
    return this.request<Company[]>(`/companies/accountant/${encodeURIComponent(accountantEmail)}`);
  }



  // Tasks endpoints
  async getAllTasks() {
    return this.request<Task[]>('/tasks');
  }

  async getCompanyTasks(companyId: number) {
    return this.request<Task[]>(`/tasks/company/${companyId}`);
  }

  async getAccountantTasks(accountantEmail: string) {
    return this.request<Task[]>(`/tasks/accountant/${accountantEmail}`);
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

  // Files endpoints
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
    if (category) {
      formData.append('category', category);
    }

    const url = `${API_BASE_URL}/files/upload`;
    const token = this.getToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async downloadFile(fileId: number) {
    const url = `${API_BASE_URL}/files/download/${fileId}`;
    const token = this.getToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async previewFile(fileId: number) {
    const url = `${API_BASE_URL}/files/preview/${fileId}`;
    const token = this.getToken();

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async deleteFile(fileId: number) {
    return this.request<{ message: string }>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async emptyTrash(companyId: number) {
    return this.request<{ message: string }>(`/files/company/${companyId}/trash/empty`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Messages endpoints
  async getUserMessages(userEmail: string) {
    return this.request<any[]>(`/messages/user/${encodeURIComponent(userEmail)}`);
  }

  async getCompanyMessages(companyId: number) {
    return this.request<any[]>(`/messages/company/${companyId}`);
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
    return this.request<{ message: string }>(`/messages/${messageId}/read`, {
      method: 'PATCH',
    });
  }

  async markMessageAsUnread(messageId: number) {
    return this.request<{ message: string }>(`/messages/${messageId}/unread`, {
      method: 'PATCH',
    });
  }

  async deleteMessage(messageId: number) {
    return this.request<{ message: string }>(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async getUnreadCount(userEmail: string) {
    const response = await this.request<{ unreadCount: number }>(`/messages/user/${encodeURIComponent(userEmail)}/unread-count`);
    return response.unreadCount;
  }

  async getConversation(user1: string, user2: string) {
    return this.request<any[]>(`/messages/conversation/${encodeURIComponent(user1)}/${encodeURIComponent(user2)}`);
  }

  // Documents endpoints
  async getDocumentCategories() {
    return this.request<{ [key: string]: { name: string; description: string; allowedTypes: string[] } }>('/documents/categories');
  }

  async getCompanyDocuments(companyId: number, category?: string) {
    const params = category && category !== 'all' ? `?category=${category}` : '';
    return this.request<DocumentData[]>(`/documents/company/${companyId}${params}`);
  }

  async getAllDocuments() {
    return this.request<DocumentData[]>('/documents/admin/all');
  }

  async getAccountantDocuments(accountantEmail: string, category?: string) {
    const params = category && category !== 'all' ? `?category=${category}` : '';
    return this.request<DocumentData[]>(`/documents/accountant/${encodeURIComponent(accountantEmail)}${params}`);
  }

  async uploadDocument(formData: FormData) {
    const url = `${API_BASE_URL}/documents/upload`;
    const token = this.getToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async downloadDocument(documentId: number) {
    const url = `${API_BASE_URL}/documents/download/${documentId}`;
    const token = this.getToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async previewDocument(documentId: number) {
    const url = `${API_BASE_URL}/documents/preview/${documentId}`;
    const token = this.getToken();

    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async deleteDocument(documentId: number) {
    return this.request<{ message: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
