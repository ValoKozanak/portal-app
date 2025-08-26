import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { accountingService, IssuedInvoice, ReceivedInvoice } from '../services/accountingService';

const InvoiceDetailPage: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<IssuedInvoice | ReceivedInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (id) {
      loadInvoiceDetail();
    }
  }, [id, type]);

  const loadInvoiceDetail = async () => {
    try {
      setLoading(true);
      if (type === 'issued') {
        const data = await accountingService.getIssuedInvoiceById(parseInt(id!));
        setInvoice(data);
      } else if (type === 'received') {
        const data = await accountingService.getReceivedInvoiceById(parseInt(id!));
        setInvoice(data);
      }
    } catch (error) {
      console.error('Chyba pri načítaní detailu faktúry:', error);
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
      sent: { color: 'bg-blue-100 text-blue-800', text: 'Odoslaná' },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítavam detail faktúry...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Faktúra nebola nájdená</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Späť
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Detail faktúry {invoice.invoice_number}
                </h1>
                <p className="text-sm text-gray-500">
                  {type === 'issued' ? 'Vydaná faktúra' : 'Prijatá faktúra'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <PrinterIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <PencilIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['basic', 'vat', 'payments', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'basic' && 'Základné údaje'}
                  {tab === 'vat' && 'Rozpis DPH'}
                  {tab === 'payments' && 'Platby'}
                  {tab === 'notes' && 'Poznámky'}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informácie o faktúre</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Číslo faktúry</dt>
                      <dd className="text-sm text-gray-900">{invoice.invoice_number}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Dátum vystavenia</dt>
                      <dd className="text-sm text-gray-900">{formatDate(invoice.issue_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Dátum splatnosti</dt>
                      <dd className="text-sm text-gray-900">{formatDate(invoice.due_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Stav</dt>
                      <dd className="text-sm">{getStatusBadge(invoice.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Variabilný symbol</dt>
                      <dd className="text-sm text-gray-900">{(invoice as any).var_sym || '-'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {type === 'issued' ? 'Zákazník' : 'Dodávateľ'}
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Názov</dt>
                      <dd className="text-sm text-gray-900">
                        {type === 'issued' ? (invoice as IssuedInvoice).customer_name : (invoice as ReceivedInvoice).supplier_name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">IČO</dt>
                      <dd className="text-sm text-gray-900">
                        {type === 'issued' ? (invoice as IssuedInvoice).customer_ico : (invoice as ReceivedInvoice).supplier_ico}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">DIČ</dt>
                      <dd className="text-sm text-gray-900">
                        {type === 'issued' ? (invoice as IssuedInvoice).customer_dic : (invoice as ReceivedInvoice).supplier_dic}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Adresa</dt>
                      <dd className="text-sm text-gray-900">
                        {type === 'issued' ? (invoice as IssuedInvoice).customer_address : (invoice as ReceivedInvoice).supplier_address}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sumy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500">Celková suma</dt>
                      <dd className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500">Základ DPH</dt>
                      <dd className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total_amount - invoice.vat_amount)}</dd>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <dt className="text-sm font-medium text-gray-500">DPH</dt>
                      <dd className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.vat_amount)}</dd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vat' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rozpis DPH</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Základ DPH</h4>
                                         <dl className="space-y-1">
                       <div className="flex justify-between">
                         <dt className="text-sm text-gray-600">Základ 0%:</dt>
                         <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc0 || 0)}</dd>
                       </div>
                       <div className="flex justify-between">
                         <dt className="text-sm text-gray-600">Znížená 1:</dt>
                         <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc1 || 0)}</dd>
                       </div>
                       <div className="flex justify-between">
                         <dt className="text-sm text-gray-600">Znížená 2:</dt>
                         <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc3 || 0)}</dd>
                       </div>
                       <div className="flex justify-between">
                         <dt className="text-sm text-gray-600">Základná sadzba:</dt>
                         <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc2 || 0)}</dd>
                       </div>
                     </dl>
                  </div>
                                     <div>
                     <h4 className="font-medium text-gray-900 mb-3">DPH</h4>
                                           <dl className="space-y-1">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">1 - Znížená sadzba DPH:</dt>
                          <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc_dph1 || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">2 - Znížená sadzba DPH:</dt>
                          <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc_dph3 || 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Základná sadzba DPH:</dt>
                          <dd className="text-sm font-medium">{formatCurrency((invoice as any).kc_dph2 || 0)}</dd>
                        </div>
                      </dl>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platby</h3>
                <p className="text-gray-500">Funkcia platby bude implementovaná v budúcnosti.</p>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Poznámky</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{(invoice as any).s_text || 'Žiadne poznámky'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
