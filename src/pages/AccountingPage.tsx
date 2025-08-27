import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  BanknotesIcon, 
  CreditCardIcon, 
  ArrowDownIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  accountingService, 
  AccountingStats,
  FinancialAnalysis
} from '../services/accountingService';

const AccountingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(3); // Default company ID
  const [userEmail, setUserEmail] = useState('info@artprofit.sk'); // Default user email
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysis | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Paralelné načítanie štatistík a finančnej analýzy
      const [statsData, analysisData] = await Promise.all([
        accountingService.getStats(companyId),
        accountingService.getFinancialAnalysis(companyId)
      ]);
      
      setStats(statsData);
      setFinancialAnalysis(analysisData);
    } catch (error) {
      console.error('Chyba pri načítaní účtovníckych dát:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const accountingCards = [
    {
      id: 'issued-invoices',
      name: 'Vydané faktúry',
      description: 'Správa vydaných faktúr',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      stats: stats?.issued_invoices?.total_count || 0,
      unpaidAmount: stats?.issued_invoices?.overdue_amount || 0
    },
    {
      id: 'received-invoices',
      name: 'Prijaté faktúry',
      description: 'Správa prijatých faktúr',
      icon: ArrowDownIcon,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      stats: stats?.received_invoices?.total_count || 0,
      unpaidAmount: stats?.received_invoices?.overdue_amount || 0
    },
    {
      id: 'cash',
      name: 'Pokladňa',
      description: 'Pokladničné transakcie',
      icon: BanknotesIcon,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      stats: 0, // TODO: Implementovať počítanie cash transakcií
      unpaidAmount: 0
    },
    {
      id: 'bank',
      name: 'Banka',
      description: 'Bankovné transakcie',
      icon: CreditCardIcon,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      stats: 0, // TODO: Implementovať počítanie bank transakcií
      unpaidAmount: 0
    },
    {
      id: 'directory',
      name: 'Adresár',
      description: 'Správa firiem v adresári',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      stats: 0, // TODO: Implementovať počítanie firiem v adresári
      unpaidAmount: 0
    },
    {
      id: 'financial-results',
      name: 'Hospodárske výsledky',
      description: 'Výsledok hospodárenia',
      icon: ChartPieIcon,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      stats: financialAnalysis?.profit || 0,
      isProfit: financialAnalysis?.isProfit || false,
      unpaidAmount: 0
    },

  ];

  const handleCardClick = (cardId: string) => {
    if (cardId === 'financial-results') {
      navigate(`/accounting/financial-analysis/${companyId}`);
    } else {
      navigate(`/accounting/${cardId}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header s navigáciou späť */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na Dashboard
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Účtovníctvo</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hlavný obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sekcie účtovníctva */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sekcie účtovníctva</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountingCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`bg-white dark:bg-dark-800 p-6 rounded-lg shadow cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${card.color} ${card.hoverColor}`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{card.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                      {(card.id === 'issued-invoices' || card.id === 'received-invoices') && card.unpaidAmount > 0 && (
                        <p className="text-sm text-red-600 font-medium mt-1">
                          Neuhradené: {formatCurrency(card.unpaidAmount)}
                        </p>
                      )}

                    </div>
                  </div>
                  <div className="text-right">
                    {card.id === 'financial-results' ? (
                      <>
                        <p className={`text-2xl font-bold ${financialAnalysis?.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                          {financialAnalysis?.isProfit ? '+' : '-'} {formatCurrency(Math.abs(financialAnalysis?.profit || 0))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {financialAnalysis?.isProfit ? 'Zisk' : 'Strata'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.stats}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">položiek</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;
