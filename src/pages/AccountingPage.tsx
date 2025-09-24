import { API_BASE_URL } from '../services/apiService';
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
import { useLocalStorage } from '../hooks/useLocalStorage';

const AccountingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  
  // PouĹľĂ­vame useLocalStorage hook pre konzistentnosĹĄ s App.tsx
  const [userEmail] = useLocalStorage('userEmail', '');
  const [userRole] = useLocalStorage<'admin' | 'accountant' | 'user' | 'employee' | null>('userRole', null);
  const [companyId, setCompanyId] = useLocalStorage<number | null>('selectedCompanyId', null);
  
  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysis | null>(null);
  const [vatData, setVatData] = useState<any>(null);
  const [bankData, setBankData] = useState<any>(null);
  const [cashData, setCashData] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      
      // ParalelnĂ© naÄŤĂ­tanie ĹˇtatistĂ­k, finanÄŤnej analĂ˝zy, DPH dĂˇt, bankovĂ˝ch dĂˇt a pokladĹovĂ˝ch dĂˇt
      const [statsData, analysisData, vatData, bankData, cashData] = await Promise.all([
        accountingService.getStats(companyId),
        accountingService.getFinancialAnalysis(companyId),
        accountingService.getVatReturns(companyId, new Date().getFullYear()).catch(() => null),
        accountingService.getBankAccounts(companyId).catch(() => null),
        accountingService.getCashAccounts(companyId).catch(() => null)
      ]);
      
      setStats(statsData);
      setFinancialAnalysis(analysisData);
      setVatData(vatData);
      setBankData(bankData);
      setCashData(cashData);
    } catch (error) {
      console.error('Chyba pri naÄŤĂ­tanĂ­ ĂşÄŤtovnĂ­ckych dĂˇt:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (userRole && userEmail) {
      loadCompanies();
    }
  }, [userRole, userEmail]);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, loadData]);

  const loadCompanies = async () => {
    try {
      let endpoint = `${API_BASE_URL}/companies`;
      
      // VĂ˝ber sprĂˇvneho endpointu podÄľa role
      if (userRole === 'user') {
        endpoint = `${API_BASE_URL}/companies/user/${userEmail}`;
      } else if (userRole === 'accountant') {
        endpoint = `${API_BASE_URL}/companies/accountant/${userEmail}`;
      }
      // Pre admin sa pouĹľĂ­va default endpoint '/api/companies'
      
      const response = await fetch(endpoint);
      const companiesData = await response.json();
      setCompanies(companiesData);
      
      // Automaticky nastavĂ­me firmu podÄľa role, len ak nemĂˇme companyId v localStorage
      if (companiesData.length > 0 && !companyId) {
        setCompanyId(companiesData[0].id);
      }
    } catch (error) {
      console.error('Chyba pri naÄŤĂ­tanĂ­ firiem:', error);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Funkcia na zĂ­skanie poslednĂ©ho DPH obdobia s vĂ˝sledkom
  const getLastVatPeriod = () => {
    if (!vatData || !vatData.returns || vatData.returns.length === 0) {
      return { period: '-', result: 0, isPositive: false };
    }
    
    // Zoradenie podÄľa mesiaca a vĂ˝ber poslednĂ©ho
    const sortedReturns = [...vatData.returns].sort((a, b) => b.mesiac - a.mesiac);
    const lastReturn = sortedReturns[0];
    
    const months = [
      'JanuĂˇr', 'FebruĂˇr', 'Marec', 'AprĂ­l', 'MĂˇj', 'JĂşn',
      'JĂşl', 'August', 'September', 'OktĂłber', 'November', 'December'
    ];
    
    const period = `${months[lastReturn.mesiac - 1]} ${lastReturn.rok}`;
    const result = lastReturn.povinnost - lastReturn.odpoÄŤet;
    // ZmenenĂˇ logika: mĂ­nus = povinnosĹĄ (musĂ­ platiĹĄ), plus = odpoÄŤet (mĂ´Ĺľe si odpoÄŤĂ­taĹĄ)
    const isPositive = result < 0; // NegatĂ­vny vĂ˝sledok znamenĂˇ povinnosĹĄ
    
    return { period, result, isPositive };
  };

  const accountingCards = [
    {
      id: 'issued-invoices',
      name: 'VydanĂ© faktĂşry',
      description: 'SprĂˇva vydanĂ˝ch faktĂşr',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      stats: stats?.issued_invoices?.total_count || 0,
      unpaidAmount: stats?.issued_invoices?.overdue_amount || 0
    },
    {
      id: 'received-invoices',
      name: 'PrijatĂ© faktĂşry',
      description: 'SprĂˇva prijatĂ˝ch faktĂşr',
      icon: ArrowDownIcon,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      stats: stats?.received_invoices?.total_count || 0,
      unpaidAmount: stats?.received_invoices?.overdue_amount || 0
    },
    {
      id: 'cash',
      name: 'PokladĹa',
      description: 'CelkovĂ˝ zostatok pokladnĂ­',
      icon: BanknotesIcon,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      stats: cashData?.summary?.totalBalance || 0,
      isCashBalance: true,
      unpaidAmount: 0
    },
    {
      id: 'bank',
      name: 'Banka',
      description: 'CelkovĂ˝ zostatok bankovĂ˝ch ĂşÄŤtov',
      icon: CreditCardIcon,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      stats: bankData?.summary?.totalBalance || 0,
      isBankBalance: true,
      unpaidAmount: 0
    },
    {
      id: 'vat-returns',
      name: 'DPH',
      description: `PoslednĂ© obdobie: ${getLastVatPeriod().period}`,
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      stats: getLastVatPeriod().result,
      isVatResult: true,
      isPositive: getLastVatPeriod().isPositive,
      unpaidAmount: 0
    },
    {
      id: 'financial-results',
      name: 'HospodĂˇrske vĂ˝sledky',
      description: 'VĂ˝sledok hospodĂˇrenia',
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
    } else if (cardId === 'bank') {
      navigate(`/accounting/bank/${companyId}`);
    } else if (cardId === 'cash') {
      navigate(`/accounting/cash/${companyId}`);
    } else {
      navigate(`/accounting/${cardId}/${companyId}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header s navigĂˇciou spĂ¤ĹĄ */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                SpĂ¤ĹĄ na Dashboard
              </button>
            </div>
                         <div className="flex items-center space-x-4">
               <h1 className="text-xl font-semibold text-gray-900 dark:text-white">ĂšÄŤtovnĂ­ctvo</h1>
               
                               {/* Pre Admin, Accountant a User - dropdown na vĂ˝ber firmy */}
                {(userRole === 'admin' || userRole === 'accountant' || userRole === 'user') && companies.length > 0 ? (
                  <select
                    value={companyId || ''}
                    onChange={(e) => setCompanyId(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Vyberte firmu</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} (IÄŚO: {company.ico})
                      </option>
                    ))}
                  </select>
                ) : null}
             </div>
          </div>
        </div>
      </div>

      {/* HlavnĂ˝ obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sekcie ĂşÄŤtovnĂ­ctva */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sekcie ĂşÄŤtovnĂ­ctva</h2>
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
                          NeuhradenĂ©: {formatCurrency(card.unpaidAmount)}
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
                    ) : card.id === 'vat-returns' ? (
                      <>
                        <p className={`text-2xl font-bold ${getLastVatPeriod().isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {getLastVatPeriod().isPositive ? '+' : '-'} {formatCurrency(Math.abs(getLastVatPeriod().result))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getLastVatPeriod().isPositive ? 'OdpoÄŤet' : 'PovinnosĹĄ'}
                        </p>
                      </>
                    ) : card.id === 'bank' ? (
                      <>
                        <p className={`text-2xl font-bold ${(bankData?.summary?.totalBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(bankData?.summary?.totalBalance || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          CelkovĂ˝ zostatok
                        </p>
                      </>
                    ) : card.id === 'cash' ? (
                      <>
                        <p className={`text-2xl font-bold ${(cashData?.summary?.totalBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashData?.summary?.totalBalance || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          CelkovĂ˝ zostatok
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.stats}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">poloĹľiek</p>
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


