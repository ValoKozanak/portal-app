import { apiService, ApiResponse } from './apiService';

// ===== ÚČTOVNÍCTVO SERVICE =====

export interface AccountingSettings {
  id?: number;
  company_id: number;
  pohoda_enabled: boolean;
  pohoda_url?: string;
  pohoda_username?: string;
  pohoda_password?: string;
  pohoda_ico?: string;
  pohoda_year?: string;
  auto_sync: boolean;
  sync_frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  last_sync?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AccountingPermissions {
  id?: number;
  user_email: string;
  company_id: number;
  can_view_invoices: boolean;
  can_create_invoices: boolean;
  can_edit_invoices: boolean;
  can_delete_invoices: boolean;
  can_view_bank: boolean;
  can_edit_bank: boolean;
  can_view_cash: boolean;
  can_edit_cash: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
  can_manage_settings: boolean;
  granted_by: string;
  granted_at?: string;
}

export interface FinancialAnalysis {
  expenses: {
    total: number;
    count: number;
    details: Array<{
      account: string;
      account_name: string;
      amount: number;
      count: number;
    }>;
  };
  revenue: {
    total: number;
    count: number;
    details: Array<{
      account: string;
      account_name: string;
      amount: number;
      count: number;
    }>;
  };
  profit: number;
  isProfit: boolean;
  filters?: {
    dateFrom: string | null;
    dateTo: string | null;
  };
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  total_price: number;
  vat_amount: number;
  unit?: string;
}

export interface IssuedInvoice {
  id?: number;
  company_id: number;
  invoice_number: string;
  customer_name: string;
  customer_ico?: string;
  customer_dic?: string;
  customer_address?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  vat_amount: number;
  
  // MDB polia - základy DPH
  kc0?: number;
  kc1?: number;
  kc2?: number;
  kc3?: number;
  
  // MDB polia - DPH
  kc_dph1?: number;
  kc_dph2?: number;
  kc_dph3?: number;
  
  // MDB polia - celkové sumy
  kc_celkem?: number;
  
  // MDB polia - ďalšie informácie
  var_sym?: string;
  s_text?: string;
  mdb_id?: number;
  rel_tp_fak?: number;
  datum?: string;
  dat_splat?: string;
  firma?: string;
  ico?: string;
  dic?: string;
  ulice?: string;
  psc?: string;
  obec?: string;
  mdb_cislo?: string;
  
  // MDB polia - likvidácia a platby
  kc_likv?: number;
  kc_u?: number;
  dat_likv?: string;
  
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  pohoda_id?: string;
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  items?: InvoiceItem[];
}

export interface ReceivedInvoice {
  id?: number;
  company_id: number;
  invoice_number: string;
  supplier_name: string;
  supplier_ico?: string;
  supplier_dic?: string;
  supplier_address?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  vat_amount: number;
  
  // MDB polia - základy DPH
  kc0?: number;
  kc1?: number;
  kc2?: number;
  kc3?: number;
  
  // MDB polia - DPH
  kc_dph1?: number;
  kc_dph2?: number;
  kc_dph3?: number;
  
  // MDB polia - celkové sumy
  kc_celkem?: number;
  
  // MDB polia - ďalšie informácie
  var_sym?: string;
  s_text?: string;
  mdb_id?: number;
  rel_tp_fak?: number;
  datum?: string;
  dat_splat?: string;
  firma?: string;
  ico?: string;
  dic?: string;
  ulice?: string;
  psc?: string;
  obec?: string;
  mdb_cislo?: string;
  
  // MDB polia - likvidácia a platby
  kc_likv?: number;
  kc_u?: number;
  dat_likv?: string;
  
  currency: string;
  status: 'received' | 'approved' | 'paid' | 'overdue' | 'disputed';
  pohoda_id?: string;
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  items?: InvoiceItem[];
}

export interface BankTransaction {
  id?: number;
  company_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category?: string;
  bank_account?: string;
  reference?: string;
  pohoda_id?: string;
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CashTransaction {
  id?: number;
  company_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category?: string;
  receipt_number?: string;
  pohoda_id?: string;
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}



export interface AccountingStats {
  issued_invoices: {
    total_count: number;
    total_amount: number;
    paid_amount: number;
    overdue_amount: number;
  };
  received_invoices: {
    total_count: number;
    total_amount: number;
    paid_amount: number;
    overdue_amount: number;
  };
  bank: {
    total_income: number;
    total_expense: number;
  };
  cash: {
    total_income: number;
    total_expense: number;
  };
}

export class AccountingService {
  // 1. NASTAVENIA ÚČTOVNÍCTVA

    async getSettings(companyId: number): Promise<AccountingSettings> {
    const response = await apiService.get(`/accounting/settings/${companyId}`); 
    return response as AccountingSettings;
  }

  async saveSettings(companyId: number, settings: Partial<AccountingSettings>): Promise<any> {
    const response = await apiService.post(`/accounting/settings/${companyId}`, settings);
    return response;
  }

  // 2. PRÁVA PRE ÚČTOVNÍCTVO

  async getPermissions(companyId: number, userEmail: string): Promise<AccountingPermissions> {
    const response = await apiService.get(`/accounting/permissions/${companyId}/${userEmail}`);
    return response as AccountingPermissions;
  }

  async savePermissions(companyId: number, permissions: Partial<AccountingPermissions>): Promise<any> {
    const response = await apiService.post(`/accounting/permissions/${companyId}`, permissions);
    return response;
  }

  async getAllPermissions(companyId: number): Promise<AccountingPermissions[]> {
    const response = await apiService.get(`/accounting/permissions/${companyId}`);
    return response as AccountingPermissions[];
  }

  // 3. VYDANÉ FAKTÚRY

  async getIssuedInvoices(
    companyId: number, 
    filters?: {
      status?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<IssuedInvoice[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.get(`/accounting/issued-invoices/${companyId}?${params}`);
    return response as IssuedInvoice[];
  }

  async createIssuedInvoice(companyId: number, invoice: Partial<IssuedInvoice>): Promise<any> {
    const response = await apiService.post(`/accounting/issued-invoices/${companyId}`, invoice);
    return response;
  }

  async getIssuedInvoiceById(invoiceId: number): Promise<IssuedInvoice> {
    const response = await apiService.get(`/accounting/issued-invoices/detail/${invoiceId}`);
    return response as IssuedInvoice;
  }



  // 4. PRIJATÉ FAKTÚRY

  async getReceivedInvoices(
    companyId: number, 
    filters?: {
      status?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ReceivedInvoice[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.get(`/accounting/received-invoices/${companyId}?${params}`);
    return response as ReceivedInvoice[];
  }

  async getReceivedInvoiceById(invoiceId: number): Promise<ReceivedInvoice> {
    const response = await apiService.get(`/accounting/received-invoices/detail/${invoiceId}`);
    return response as ReceivedInvoice;
  }



  // 6. POKLADNIČNÉ TRANSAKCIA

  async getCashTransactions(
    companyId: number, 
    filters?: {
      type?: string;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CashTransaction[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.get(`/accounting/cash-transactions/${companyId}?${params}`);
    return response as CashTransaction[];
  }



  // 7. HOSPODÁRSKE VÝSLEDKY (pUD)

  async getPudSummary(companyId: number): Promise<{ total_kc: number; total_count: number }> {
    const response = await apiService.get(`/accounting/pud-summary/${companyId}`);
    return response as { total_kc: number; total_count: number };
  }

  // Získanie podrobnej analýzy nákladov a výnosov
  async getFinancialAnalysis(companyId: number, dateFrom?: string, dateTo?: string): Promise<FinancialAnalysis> {
    let url = `/accounting/financial-analysis/${companyId}`;
    const params = new URLSearchParams();
    
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await apiService.get(url);
    return response as FinancialAnalysis;
  }

  // 8. ŠTATISTIKY

  async getStats(
    companyId: number, 
    filters?: {
      year?: number;
      month?: number;
    }
  ): Promise<AccountingStats> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiService.get(`/accounting/stats/${companyId}?${params}`);
    return response as AccountingStats;
  }

  // 8. POMOCNÉ METÓDY

  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('sk-SK');
  }

  getStatusBadge(status: string): { text: string; color: string } {
    const statusMap: Record<string, { text: string; color: string }> = {
      // Vydané faktúry
      draft: { text: 'Koncept', color: 'bg-gray-100 text-gray-800' },
      sent: { text: 'Odoslaná', color: 'bg-blue-100 text-blue-800' },
      paid: { text: 'Zaplatená', color: 'bg-green-100 text-green-800' },
      overdue: { text: 'Po splatnosti', color: 'bg-red-100 text-red-800' },
      cancelled: { text: 'Zrušená', color: 'bg-yellow-100 text-yellow-800' },
      
      // Prijaté faktúry
      received: { text: 'Prijatá', color: 'bg-gray-100 text-gray-800' },
      approved: { text: 'Schválená', color: 'bg-blue-100 text-blue-800' },
      disputed: { text: 'Sporná', color: 'bg-orange-100 text-orange-800' }
    };

    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  }

  getTypeBadge(type: string): { text: string; color: string } {
    const typeMap: Record<string, { text: string; color: string }> = {
      income: { text: 'Príjem', color: 'bg-green-100 text-green-800' },
      expense: { text: 'Výdavok', color: 'bg-red-100 text-red-800' }
    };

    return typeMap[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
  }

  // 9. POHODA INTEGRÁCIA

  // Test POHODA connection
  async testPohodaConnection(companyId: number, settings: Partial<AccountingSettings>): Promise<ApiResponse> {
    return await apiService.post('/accounting/test-pohoda-connection', {
      companyId,
      ...settings
    });
  }

  // Test POHODA invoices
  async testPohodaInvoices(companyId: number, settings: Partial<AccountingSettings>): Promise<ApiResponse> {
    return await apiService.post('/accounting/test-pohoda-invoices', {
      companyId,
      ...settings
    });
  }

  // Sync POHODA invoices
  async syncPohodaInvoices(companyId: number, dateFrom?: string, dateTo?: string): Promise<ApiResponse> {
    return await apiService.post(`/accounting/sync-pohoda-invoices/${companyId}`, {
      dateFrom,
      dateTo
    });
  }

  // 10. XML IMPORT/EXPORT

  // Upload POHODA XML file
  async uploadPohodaXml(companyId: number, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('xmlFile', file);
    
    // Používame fetch priamo pre FormData
    const response = await fetch(`http://localhost:5000/api/accounting/upload-pohoda-xml/${companyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri nahrávaní XML súboru');
    }
    
    return await response.json();
  }

  // Export invoices to POHODA XML format
  async exportPohodaXml(companyId: number, dateFrom?: string, dateTo?: string): Promise<Blob> {
    const response = await fetch(`http://localhost:5000/api/accounting/export-pohoda-xml/${companyId}?dateFrom=${dateFrom || ''}&dateTo=${dateTo || ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri exporte XML súboru');
    }
    
    return await response.blob();
  }



  // 11. OBNOVENIE FAKTÚR Z MDB

  // Obnovenie vydaných faktúr z MDB
  async refreshInvoicesFromMdb(companyId: number): Promise<{
    success: boolean;
    message: string;
    importedCount: number;
    totalCount: number;
  }> {
    const response = await fetch(`http://localhost:5000/api/accounting/refresh-invoices/${companyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri obnovení faktúr z MDB');
    }
    
    return await response.json();
  }

  // Obnovenie prijatých faktúr z MDB
  async refreshReceivedInvoicesFromMdb(companyId: number): Promise<{
    success: boolean;
    message: string;
    importedCount: number;
    totalCount: number;
  }> {
    const response = await fetch(`http://localhost:5000/api/accounting/refresh-received-invoices/${companyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri obnovení prijatých faktúr z MDB');
    }
    
    return await response.json();
  }

  // 12. IMPORT FAKTÚR Z MDB

  // Import vydaných faktúr z MDB
  async importInvoicesFromMdb(companyId: number): Promise<{
    success: boolean;
    message: string;
    importedCount: number;
    skippedCount: number;
    totalCount: number;
  }> {
    const response = await fetch(`http://localhost:5000/api/accounting/import-invoices/${companyId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri importe faktúr z MDB');
    }
    
    return await response.json();
  }

  // 12. MAZANIE POLOŽIEK

  // Mazanie vydanej faktúry
  async deleteIssuedInvoice(invoiceId: number): Promise<any> {
    const response = await apiService.delete(`/accounting/issued-invoices/${invoiceId}`);
    return response;
  }

  // Mazanie prijatej faktúry
  async deleteReceivedInvoice(invoiceId: number): Promise<any> {
    const response = await apiService.delete(`/accounting/received-invoices/${invoiceId}`);
    return response;
  }

  // Mazanie bankovej transakcie
  async deleteBankTransaction(transactionId: number): Promise<any> {
    const response = await apiService.delete(`/accounting/bank-transactions/${transactionId}`);
    return response;
  }

  // Mazanie pokladničnej transakcie
  async deleteCashTransaction(transactionId: number): Promise<any> {
    const response = await apiService.delete(`/accounting/cash-transactions/${transactionId}`);
    return response;
  }

  // 13. ADRESÁR FIRIEM Z MDB

  // Načítanie adresára firiem z MDB
  async getDirectory(companyId: number): Promise<{
    success: boolean;
    company: { ico: string; name: string };
    mdb_file: string;
    companies: Array<{
      id: number;
      name: string;
      ico: string;
      dic: string;
      address: string;
      postal_code: string;
      city: string;
      phone: string;
      email: string;
      bank_account: string;
      bank_code: string;
    }>;
    total_count: number;
  }> {
    const response = await fetch(`http://localhost:5000/api/accounting/directory/${companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri načítaní adresára');
    }
    
    return await response.json();
  }

  // 14. DPH PODANIA

  // Načítanie DPH podaní z MDB
  async getVatReturns(companyId: number, year?: number): Promise<{
    company: {
      id: number;
      name: string;
      ico: string;
    };
    year: number;
    returns: Array<{
      id: number;
      rok: number;
      mesiac: number;
      povinnost: number;
      odpočet: number;
      odoslané: boolean;
    }>;
    summary: {
      totalPovinnost: number;
      totalOdpočet: number;
      totalRozdiel: number;
      odoslanéCount: number;
      neodoslanéCount: number;
    };
  }> {
    const yearParam = year || new Date().getFullYear();
    const response = await fetch(`http://localhost:5000/api/accounting/vat-returns/${companyId}?year=${yearParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri načítaní DPH podaní');
    }
    
    return await response.json();
  }

  // 15. BANKOVÉ ÚČTY

  // Načítanie bankových účtov z MDB
  async getBankAccounts(companyId: number): Promise<{
    company: {
      id: number;
      name: string;
      ico: string;
    };
    accounts: Array<{
      id: number;
      accountNumber: string;
      accountName: string;
      bankName: string;
      balance: number;
      creditTotal: number;
      debitTotal: number;
      transactionCount: number;
    }>;
    summary: {
      totalBalance: number;
      totalCredit: number;
      totalDebit: number;
      accountCount: number;
    };
  }> {
    console.log('🏦 Volám bankový endpoint pre companyId:', companyId);
    
    const response = await fetch(`http://localhost:5000/api/accounting/bank-accounts/${companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🏦 Bankový endpoint response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Chyba pri načítaní bankových účtov');
    }
    
    const data = await response.json();
    console.log('🏦 Bankový endpoint response data:', data);
    
    return data;
  }

  // 16. POKLADŇA

  // Načítanie pokladňových účtov z MDB
  async getCashAccounts(companyId: number): Promise<{
    company: {
      id: number;
      name: string;
      ico: string;
    };
    accounts: Array<{
      id: number;
      accountNumber: string;
      accountName: string;
      balance: number;
      creditTotal: number;
      debitTotal: number;
      transactionCount: number;
    }>;
    summary: {
      totalBalance: number;
      totalCredit: number;
      totalDebit: number;
      accountCount: number;
    };
  }> {
    const response = await fetch(`http://localhost:5000/api/accounting/cash-accounts/${companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Chyba pri načítaní pokladňových účtov');
    }
    
    return await response.json();
  }

  // 17. BANKOVÉ TRANSAKCIE
  async getBankTransactions(companyId: number, accountNumber: string): Promise<{
    company: { id: number; name: string; ico: string; };
    account: { accountNumber: string; accountName: string; bankName: string; };
    transactions: Array<{
      id: number; datum: string; popis: string; kredit: number; debet: number; zostatok: number; typ: 'kredit' | 'debet';
    }>;
    summary: {
      totalCredit: number; totalDebit: number; currentBalance: number; transactionCount: number;
    };
  }> {
    console.log('🏦 Volám bankový transakčný endpoint pre companyId:', companyId, 'accountNumber:', accountNumber);

    const response = await fetch(`http://localhost:5000/api/accounting/bank-transactions/${companyId}/${accountNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🏦 Bankový transakčný endpoint response status:', response.status);

    if (!response.ok) {
      throw new Error('Chyba pri načítaní bankových transakcií');
    }

    const data = await response.json();
    console.log('🏦 Bankový transakčný endpoint response data:', data);

    return data;
  }
}

export const accountingService = new AccountingService();
