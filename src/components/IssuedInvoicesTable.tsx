import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  PencilIcon, 
  PlusIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { accountingService, IssuedInvoice } from '../services/accountingService';
import PohodaXmlImportExport from './PohodaXmlImportExport';

interface IssuedInvoicesTableProps {
  companyId: number;
  userEmail: string;
}

const IssuedInvoicesTable: React.FC<IssuedInvoicesTableProps> = ({ companyId, userEmail }) => {
  const [invoices, setInvoices] = useState<IssuedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [showXmlImportModal, setShowXmlImportModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [companyId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getIssuedInvoices(companyId, { limit: 100 });
      setInvoices(data);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� faktAsr:', error);
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
      sent: { color: 'bg-blue-100 text-blue-800', text: 'OdoslanA?' },
      paid: { color: 'bg-green-100 text-green-800', text: 'ZaplatenA?' },
      overdue: { color: 'bg-red-100 text-red-800', text: 'Po splatnosti' },
      cancelled: { color: 'bg-yellow-100 text-yellow-800', text: 'ZruL?enA?' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleViewInvoice = (invoice: IssuedInvoice) => {
    console.log('ZobraziLA faktAsru:', invoice);
    
    alert(`ZobraziLA faktAsru: ${invoice.invoice_number}`);
  };

  const handleEditInvoice = (invoice: IssuedInvoice) => {
    console.log('EditovaLA faktAsru:', invoice);
    
    alert(`EditovaLA faktAsru: ${invoice.invoice_number}`);
  };

  

  const handleCreateInvoice = () => {
    console.log('VytvoriLA novAs faktAsru');
    
    alert('VytvoriLA novAs faktAsru');
  };

  const handleExportInvoices = () => {
    console.log('Export faktAsr');
    
    alert('Export faktAsr');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* OvlA?dacie prvky */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showAllColumns ? 'SkryLA POHODA polia' : 'ZobraziLA vL?etky POHODA polia'}
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleCreateInvoice}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-1"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nova faktAsra</span>
          </button>
          <button 
            onClick={() => setShowXmlImportModal(true)}
            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 flex items-center space-x-1"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Import XML</span>
          </button>
          <button 
            onClick={handleExportInvoices}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-1"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tabu�lka */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* ZA?kladnA� polia - vLldy vidite�lnA� */}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  �SA�slo
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Varsym
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DA?tum
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SplatnA�
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DaL�povin
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Text
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firma
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  I�SO
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcie
                </th>

                {/* POHODA polia - podmienene vidite�lnA� */}
                {showAllColumns && (
                  <>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      �,� 0
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      �,� znA�LlenA?
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DPH znA�LlenA?
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      �,� zA?kladnA?
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DPH zA?kladnA?
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      �,� 2 znA�LlenA?
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DPH 2 znA�LlenA?
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ZA?loha
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Likv
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cudzia mena
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CM kurz
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CM �Tiastka
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Celkom
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      K likvidA?cii
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Storno
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  {/* ZA?kladnA� polia */}
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(invoice as any).varsym || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.issue_date)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate((invoice as any).due_date_original || invoice.due_date)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate((invoice as any).tax_liability)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {(invoice as any).text || invoice.notes || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(invoice as any).company_name || invoice.customer_name || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.customer_ico || '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="ZobraziLA"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditInvoice(invoice)}
                        className="text-gray-600 hover:text-gray-900"
                        title="EditovaLA"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                    </div>
                  </td>

                  {/* POHODA polia */}
                  {showAllColumns && (
                    <>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).amount_0)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).amount_reduced)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).vat_reduced)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).amount_basic)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).vat_basic)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).amount_2_reduced)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).vat_2_reduced)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).advance)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).liquidation)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(invoice as any).foreign_currency || '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(invoice as any).exchange_rate ? (invoice as any).exchange_rate.toFixed(4) : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).foreign_amount)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).total_amount_foreign)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency((invoice as any).liquidation_amount)}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(invoice as any).cancelled ? 'A�no' : 'Nie'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">L?iadne vydanA� faktAsry</p>
          </div>
        )}
      </div>

      {/* XML Import Modal */}
      {showXmlImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Import POHODA XML faktAsr
              </h2>
              <button
                onClick={() => setShowXmlImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">ZatvoriLA</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <PohodaXmlImportExport companyId={companyId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuedInvoicesTable;

