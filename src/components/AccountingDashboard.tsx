import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  BanknotesIcon, 
  CreditCardIcon, 
  ArrowDownIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ChartBarIcon,
  TrashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import { 
  accountingService, 
  IssuedInvoice, 
  ReceivedInvoice, 
  CashTransaction, 
  AccountingStats 
} from '../services/accountingService';

interface AccountingDashboardProps {
  companyId: number;
  userEmail: string;
}

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ companyId, userEmail }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'issued-invoices' | 'received-invoices' | 'cash' | 'directory'>('overview');
  
  // Data states
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [issuedInvoices, setIssuedInvoices] = useState<IssuedInvoice[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<ReceivedInvoice[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [directoryCompanies, setDirectoryCompanies] = useState<any[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  
  // UI states
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      

      
      // Načítanie všetkých dát paralelne
      const [
        statsData,
        issuedInvoicesData,
        receivedInvoicesData,
        cashTransactionsData
      ] = await Promise.all([
        accountingService.getStats(companyId),
        accountingService.getIssuedInvoices(companyId, { limit: 10 }),
        accountingService.getReceivedInvoices(companyId, { limit: 10 }),
        accountingService.getCashTransactions(companyId, { limit: 10 })
      ]);
      
      setStats(statsData);
      setIssuedInvoices(issuedInvoicesData);
      setReceivedInvoices(receivedInvoicesData);
      setCashTransactions(cashTransactionsData);
      
    } catch (error) {
      console.error('Chyba pri načítaní účtovníckych dát:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, userEmail]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Načítanie adresára firiem
  const loadDirectory = async () => {
    try {
      setDirectoryLoading(true);
      const directoryData = await accountingService.getDirectory(companyId);
      setDirectoryCompanies(directoryData.companies);
    } catch (error) {
      console.error('Chyba pri načítaní adresára:', error);
    } finally {
      setDirectoryLoading(false);
    }
  };

  // Načítanie adresára keď sa prepne na kartu
  useEffect(() => {
    if (activeTab === 'directory') {
      loadDirectory();
    }
  }, [activeTab, companyId]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const badge = accountingService.getStatusBadge(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const badge = accountingService.getTypeBadge(type);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return accountingService.formatCurrency(amount, currency);
  };

  const formatDate = (date: string) => {
    return accountingService.formatDate(date);
  };

  // Render functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vydané faktúry</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.issued_invoices.total_count || 0}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Celková suma: {formatCurrency(stats?.issued_invoices.total_amount || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <ArrowDownIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prijaté faktúry</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.received_invoices.total_count || 0}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Celková suma: {formatCurrency(stats?.received_invoices.total_amount || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Banka</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency((stats?.bank.total_income || 0) - (stats?.bank.total_expense || 0))}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Príjmy: {formatCurrency(stats?.bank.total_income || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pokladňa</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency((stats?.cash.total_income || 0) - (stats?.cash.total_expense || 0))}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Príjmy: {formatCurrency(stats?.cash.total_income || 0)}
            </p>
          </div>
        </div>
      </div>

      

      {/* Najnovšie transakcie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Najnovšie vydané faktúry</h3>
          </div>
          <div className="p-6">
            {issuedInvoices.length > 0 ? (
              <div className="space-y-4">
                {issuedInvoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.customer_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total_amount)}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Žiadne vydané faktúry
              </p>
            )}
          </div>
        </div>


      </div>
    </div>
  );



  const renderReceivedInvoices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Prijaté faktúry</h2>
      </div>

      <div className="bg-white dark:bg-dark-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Číslo faktúry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dodávateľ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dátum vystavenia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Splatnosť
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Suma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stav
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
              {receivedInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {invoice.supplier_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCash = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pokladničné transakcie</h2>
                               {(
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nová transakcia
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-dark-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Dátum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Popis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Suma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kategória
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cashTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(transaction.type)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'income' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );



  const renderDirectory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Adresár firiem z POHODA</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {directoryCompanies.length} firiem
          </span>
          <button 
            onClick={loadDirectory}
            disabled={directoryLoading}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {directoryLoading ? 'Načítavam...' : 'Obnoviť'}
          </button>
        </div>
      </div>

      {directoryLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Názov firmy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    IČO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    DIČ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Adresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Telefón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Bankový účet
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                {directoryCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {company.ico}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {company.dic || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {company.address && company.city ? 
                        `${company.address}, ${company.postal_code} ${company.city}` : 
                        company.address || company.city || '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {company.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {company.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {company.bank_account && company.bank_code ? 
                        `${company.bank_account}/${company.bank_code}` : 
                        company.bank_account || '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {directoryCompanies.length === 0 && !directoryLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Žiadne firmy v adresári</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Účtovníctvo</h1>
          <p className="text-gray-600 dark:text-gray-300">Správa faktúr, pokladne a banky</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white dark:bg-dark-800 shadow rounded-lg">
        <div className="px-4">
          <div className="flex space-x-8 overflow-x-auto">
                         {[
               { id: 'overview', name: 'Prehľad', icon: ChartBarIcon },
               { id: 'issued-invoices', name: 'Vydané faktúry', icon: DocumentTextIcon },
               { id: 'received-invoices', name: 'Prijaté faktúry', icon: ArrowDownIcon },
               { id: 'cash', name: 'Pokladňa', icon: BanknotesIcon },
               { id: 'directory', name: 'Adresár', icon: BuildingOfficeIcon }
             ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'issued-invoices') {
                    navigate('/accounting/issued-invoices');
                  } else if (tab.id === 'received-invoices') {
                    navigate('/accounting/received-invoices');
                  } else if (tab.id === 'cash') {
                    navigate('/accounting/cash');
                  } else if (tab.id === 'directory') {
                    navigate('/accounting/directory');
                  } else {
                    setActiveTab(tab.id as any);
                  }
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

             {/* Content */}
       <div className="mt-6">
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'received-invoices' && renderReceivedInvoices()}
         {activeTab === 'cash' && renderCash()}
         {activeTab === 'directory' && renderDirectory()}
       </div>

             {/* TODO: Modals pre vytváranie faktúr */}
    </div>
  );
};

export default AccountingDashboard;

