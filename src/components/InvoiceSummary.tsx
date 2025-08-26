import React from 'react';
import { 
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface InvoiceSummaryProps {
  invoices: any[];
  type: 'issued' | 'received';
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({ invoices, type }) => {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0,00 €';
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateStats = () => {
    const today = new Date();
    const stats = {
      totalAmount: 0,
      totalCount: 0, // Celkový počet faktúr
      unpaidAmount: 0, // Nezaplatené (zostatok na úhradu)
      unpaidCount: 0,
      overdueAmount: 0,
      overdueCount: 0
    };

    invoices.forEach(invoice => {
      const total = parseFloat(invoice.total_amount) || 0;
      const dueDate = new Date(invoice.due_date);
      const isOverdue = dueDate < today;
      
      // Použijeme kc_likv (nezaplatená suma) z MDB
      const unpaidAmount = parseFloat(invoice.kc_likv) || 0;
      
      // Faktúra je zaplatená ak kc_likv = 0 (nezaplatená suma je 0)
      const isPaid = unpaidAmount === 0;

      stats.totalAmount += total;
      stats.totalCount++; // Počítame všetky faktúry

      if (isPaid) {
        // Zaplatené faktúry nepridávajú do nezaplatených
      } else {
        // Použijeme kc_likv pre nezaplatené
        stats.unpaidAmount += unpaidAmount;
        stats.unpaidCount++;
        
        // Po splatnosti: všetky nezaplatené faktúry s dátumom splatnosti < aktuálny dátum
        if (isOverdue) {
          stats.overdueAmount += unpaidAmount;
          stats.overdueCount++;
        }
      }
    });

    return stats;
  };

  const stats = calculateStats();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Sumár {type === 'issued' ? 'vydaných' : 'prijatých'} faktúr
      </h3>

      {/* Hlavné sumy - len 3 karty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <CurrencyEuroIcon className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-600">Celková suma</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-blue-600">{stats.totalCount} faktúr</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-red-600">Nezaplatené</p>
              <p className="text-xl font-bold text-red-900">{formatCurrency(stats.unpaidAmount)}</p>
              <p className="text-xs text-red-600">{stats.unpaidCount} faktúr</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-600">Po splatnosti</p>
              <p className="text-xl font-bold text-yellow-900">{formatCurrency(stats.overdueAmount)}</p>
              <p className="text-xs text-yellow-600">{stats.overdueCount} faktúr</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;
