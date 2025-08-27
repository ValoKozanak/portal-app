import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Cog6ToothIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { accountingService, ReceivedInvoice } from '../services/accountingService';
import InvoiceSummary from '../components/InvoiceSummary';

const ReceivedInvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companyId, setCompanyId] = useState(3); // Default company ID
  const [userEmail, setUserEmail] = useState('info@artprofit.sk'); // Default user email
  const [invoices, setInvoices] = useState<ReceivedInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<ReceivedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtre
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    supplierName: '',
    dueDateFrom: '',
    dueDateTo: '',
    unpaidAmountMin: '',
    unpaidAmountMax: '',
    invoiceNumber: ''
  });

  // Kontrola URL parametra pre automatický filter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam === 'dividenda') {
      // Automaticky nastav filter pre DIVIDENDA s.r.o. (ICO: 36543039)
      setFilters(prev => ({
        ...prev,
        supplierName: 'DIVIDENDA s.r.o.'
      }));
      setShowFilters(true);
    }
  }, [location.search]);

  useEffect(() => {
    loadInvoices();
    // Automatické obnovenie faktúr z MDB pri načítaní stránky
    handleRefreshInvoices();
  }, [companyId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getReceivedInvoices(companyId, { limit: 100 });
      setInvoices(data);
      if (data.length > 0) {
        setSelectedInvoice(data[0]);
      }
    } catch (error) {
      console.error('Chyba pri načítaní prijatých faktúr:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString === '') return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('sk-SK');
    } catch (error) {
      return '-';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Koncept' },
      received: { color: 'bg-blue-100 text-blue-800', text: 'Prijatá' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Zaplatená' },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Po splatnosti' },
      cancelled: { color: 'bg-yellow-100 text-yellow-800', text: 'Zrušená' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    // Základný search
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice as any).varsym?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filtre
    if (filters.supplierName && !invoice.supplier_name?.toLowerCase().includes(filters.supplierName.toLowerCase())) {
      return false;
    }
    
    if (filters.invoiceNumber && !invoice.invoice_number?.toLowerCase().includes(filters.invoiceNumber.toLowerCase())) {
      return false;
    }
    
    // Filtre dátumov
    if (filters.dueDateFrom) {
      const dueDate = new Date(invoice.due_date);
      const fromDate = new Date(filters.dueDateFrom);
      if (dueDate < fromDate) return false;
    }
    
    if (filters.dueDateTo) {
      const dueDate = new Date(invoice.due_date);
      const toDate = new Date(filters.dueDateTo);
      if (dueDate > toDate) return false;
    }
    
    // Filtre nezaplatených súm
    const unpaidAmount = parseFloat(String(invoice.kc_likv || 0)) || 0;
    
    if (filters.unpaidAmountMin) {
      const minAmount = parseFloat(filters.unpaidAmountMin);
      if (unpaidAmount < minAmount) return false;
    }
    
    if (filters.unpaidAmountMax) {
      const maxAmount = parseFloat(filters.unpaidAmountMax);
      if (unpaidAmount > maxAmount) return false;
    }
    
    return true;
  });

  const handleInvoiceSelect = (invoice: ReceivedInvoice) => {
    setSelectedInvoice(invoice);
  };

  const handleViewInvoiceDetail = (invoice: ReceivedInvoice) => {
    window.location.href = `/invoice/received/${invoice.id}`;
  };

  const handleEditInvoice = (invoice: ReceivedInvoice) => {
    console.log('Editovať faktúru:', invoice);
    // TODO: Implementovať editáciu faktúry
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      supplierName: '',
      dueDateFrom: '',
      dueDateTo: '',
      unpaidAmountMin: '',
      unpaidAmountMax: '',
      invoiceNumber: ''
    });
  };

  const handleDeleteInvoice = async (invoice: ReceivedInvoice) => {
    if (!window.confirm(`Naozaj chcete vymazať faktúru ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      await accountingService.deleteReceivedInvoice(invoice.id!);
      await loadInvoices();
    } catch (error) {
      console.error('Chyba pri mazaní faktúry:', error);
      alert('Chyba pri mazaní faktúry');
    }
  };

  const handleCreateInvoice = () => {
    console.log('Vytvoriť novú faktúru');
    // TODO: Implementovať vytvorenie novej faktúry
    alert('Vytvoriť novú faktúru');
  };

  const handleRefreshInvoices = async () => {
    try {
      await accountingService.refreshReceivedInvoicesFromMdb(companyId);
      await loadInvoices();
    } catch (error) {
      console.error('Chyba pri obnovení faktúr:', error);
      alert('Chyba pri obnovení faktúr');
    }
  };

  const handleExportInvoices = () => {
    console.log('Exportovať faktúry');
    // TODO: Implementovať export faktúr
    alert('Exportovať faktúry');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/accounting')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na Účtovníctvo
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Prijaté faktúry</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hlavný obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Horná časť - Sumár faktúr */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200" style={{ height: '200px', overflow: 'hidden' }}>
            <div className="p-4">
              <InvoiceSummary invoices={filteredInvoices} type="received" />
            </div>
          </div>

          {/* Spodná časť - Zoznam faktúr */}
          <div className="bg-white overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 400px)', maxHeight: '700px' }}>
            {/* Hlavička zoznamu */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">Zoznam prijatých faktúr</h2>
                  
                  {/* Tlačidlo filtrov */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${
                      showFilters 
                        ? 'text-white bg-green-600 hover:bg-green-700' 
                        : 'text-gray-700 bg-white hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                  >
                    <FunnelIcon className="h-4 w-4 mr-2" />
                    Filtre
                  </button>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Hľadať faktúry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefreshInvoices}
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Obnoviť
                  </button>
                  <button
                    onClick={handleCreateInvoice}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Nová faktúra
                  </button>
                </div>
              </div>
            </div>

            {/* Panel filtrov */}
            {showFilters && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Dodávateľ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dodávateľ</label>
                    <input
                      type="text"
                      value={filters.supplierName}
                      onChange={(e) => handleFilterChange('supplierName', e.target.value)}
                      placeholder="Zadajte názov dodávateľa..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Číslo faktúry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Číslo faktúry</label>
                    <input
                      type="text"
                      value={filters.invoiceNumber}
                      onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                      placeholder="Zadajte číslo faktúry..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Dátum splatnosti od */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Splatné od</label>
                    <input
                      type="date"
                      value={filters.dueDateFrom}
                      onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Dátum splatnosti do */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Splatné do</label>
                    <input
                      type="date"
                      value={filters.dueDateTo}
                      onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Doplatok od */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doplatok od (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filters.unpaidAmountMin}
                      onChange={(e) => handleFilterChange('unpaidAmountMin', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Doplatok do */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doplatok do (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={filters.unpaidAmountMax}
                      onChange={(e) => handleFilterChange('unpaidAmountMax', e.target.value)}
                      placeholder="999999.99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Tlačidlá filtrov */}
                <div className="flex items-center justify-end mt-4 space-x-3">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Vymazať filtre
                  </button>
                  <div className="text-sm text-gray-500">
                    Zobrazených: {filteredInvoices.length} z {invoices.length}
                  </div>
                </div>
              </div>
            )}

            {/* Tabuľka faktúr */}
            <div className="overflow-x-auto overflow-y-auto" style={{ height: 'calc(100vh - 500px)', maxHeight: '600px' }}>
              <table className="min-w-full divide-y divide-gray-200">
                                 <thead className="bg-gray-50">
                   <tr>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Číslo
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Varsym
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Dátum
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Splatné
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Dodávateľ
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Celkom
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Doplatok
                     </th>
                     <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       Akcie
                     </th>
                   </tr>
                 </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Načítavam faktúry...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        Žiadne faktúry neboli nájdené
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        onClick={() => handleInvoiceSelect(invoice)}
                        className={`cursor-pointer hover:bg-gray-50 ${
                          selectedInvoice?.id === invoice.id ? 'bg-green-50' : ''
                        }`}
                      >
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          {(invoice as any).varsym || '-'}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.issue_date)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                          {invoice.supplier_name}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.kc_celkem || invoice.total_amount)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.kc_likv || 0)}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoiceDetail(invoice);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Zobraziť detail"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditInvoice(invoice);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Upraviť"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInvoice(invoice);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Vymazať"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceivedInvoicesPage;
