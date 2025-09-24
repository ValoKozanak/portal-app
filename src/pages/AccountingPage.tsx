import { API_BASE_URL } from '../services/apiService';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowDownIcon,
  ChartBarIcon,
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

  // Používame useLocalStorage hook pre konzistentnosť s App.tsx
  const [userEmail] = useLocalStorage('userEmail', '');
  const [userRole] = useLocalStorage<'admin' | 'accountant' | 'user' | 'employee' | null>('userRole', null);
  const [companyId, setCompanyId] = useLocalStorage<number | null>('selectedCompanyId', null);

  const [stats, setStats] = useState<AccountingStats | null>(null);
  const [financialAnalysis, setFinancialAnalysis] = useState<FinancialAnalysis | null>(null);
  const [vatData, setVatData] = useState<any>(null);
  const [bankData, setBankData] = useState<any>(null);
  const [cashData, setCashData] = useState<any>(null);

  const authHeader = () => {
    const t = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const loadData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      // Paralelné načítanie štatistík, finančnej analýzy, DPH dát, bankových a pokladňových dát
      const [statsData, analysisData, vatD, bankD, cashD] = await Promise.all([
        accountingService.getStats(companyId),
        accountingService.getFinancialAnalysis(companyId),
        accountingService.getVatReturns(companyId, new Date().getFullYear()).catch(() => null),
        accountingService.getBankAccounts(companyId).catch(() => null),
        accountingService.getCashAccounts(companyId).catch(() => null)
      ]);

      setStats(statsData);
      setFinancialAnalysis(analysisData);
      setVatData(vatD);
      setBankData(bankD);
      setCashData(cashD);
    } catch (error) {
      console.error('Chyba pri načítaní účtovníckych dát:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (userRole && userEmail) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, userEmail]);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, loadData]);

  const loadCompanies = async () => {
    try {
      let endpoint = `${API_BASE_URL}/companies`;

      // Výber správneho endpointu podľa role
      if (userRole === 'user') {
        endpoint = `${API_BASE_URL}/companies/user/${encodeURIComponent(userEmail)}`;
      } else if (userRole === 'accountant') {
        endpoint = `${API_BASE_URL}/companies/accountant/${encodeURIComponent(userEmail)}`;
      }
      // Pre admina ostáva default '/companies'

      const response = await fetch(endpoint, { headers: { ...authHeader() } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const companiesData = await response.json();
      setCompanies(companiesData);

      // Automaticky nastav firmu, ak nie je zvolená
      if (companiesData.length > 0 && !companyId) {
        setCompanyId(companiesData[0].id);
      }
    } catch (error) {
      console.error('Chyba pri načítaní firiem:', error);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount as any)) return '-';
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount as number);
  };

  // Funkcia na získanie posledného DPH obdobia s výsledkom
  const getLastVatPeriod = () => {
    if (!vatData || !vatData.returns || vatData.returns.length === 0) {
      return { period: '-', result: 0, isPositive: false };
    }

    // Zoradenie podľa mesiaca a výber posledného
    const sortedReturns = [...vatData.returns].sort((a: any, b: any) => b.mesiac - a.mesiac);
    const lastReturn = sortedReturns[0];

    const months = [
      'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
      'Júl', 'August', 'September', 'Október', 'November', 'December'
    ];

    const period = `${months[lastReturn.mesiac - 1]} ${lastReturn.rok}`;

    // robustne získaj odpočet (API môže poslať 'odpocet' alebo historicky 'odpočet')
    const odpocet: number = Number(
      (lastReturn as any).odpocet ?? (lastReturn as any)['odpočet'] ?? 0
    );

    const result = Number(lastReturn.povinnost) - odpocet;

    // interpretácia: negatívny výsledok = povinnosť platiť, pozitívny = odpočet
    const isPositive = result < 0;

    return { period, result, isPositive };
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
      description: 'Celkový zostatok pokladne',
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
      description: 'Celkový zostatok bankových účtov',
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
      description: `Posledné obdobie: ${getLastVatPeriod().period}`,
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
      name: 'Hospodárske výsledky',
      description: 'Výsledok hospodárenia',
      icon: ChartPieIcon,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      stats: financialAnalysis?.profit || 0,
      isProfit: financialAnalysis?.isProfit || false,
      unpaidAmount: 0
    }
  ];

  const handleCardClick = (cardId: string) => {
    if (!companyId) return;
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
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Účtovníctvo</h1>

              {/* Pre Admin, Accountant a User - dropdown na výber firmy */}
              {(userRole === 'admin' || userRole === 'accountant' || userRole === 'user') && companies.length > 0 ? (
                <select
                  value={companyId || ''}
                  onChange={(e) => setCompanyId(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Vyberte firmu</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} (IČO: {company.ico})
                    </option>
                  ))}
                </select>
              ) : null}
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
                className="bg-white dark:bg-dark-800 p-6 rounded-lg shadow cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
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
                        <p
                          className={`text-2xl font-bold ${
                            financialAnalysis?.isProfit ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {financialAnalysis?.isProfit ? '+' : '-'}{' '}
                          {formatCurrency(Math.abs(financialAnalysis?.profit || 0))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {financialAnalysis?.isProfit ? 'Zisk' : 'Strata'}
                        </p>
                      </>
                    ) : card.id === 'vat-returns' ? (
                      <>
                        <p
                          className={`text-2xl font-bold ${
                            getLastVatPeriod().isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {getLastVatPeriod().isPositive ? '+' : '-'}{' '}
                          {formatCurrency(Math.abs(getLastVatPeriod().result))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getLastVatPeriod().isPositive ? 'Odpočet' : 'Povinnosť'}
                        </p>
                      </>
                    ) : card.id === 'bank' ? (
                      <>
                        <p
                          className={`text-2xl font-bold ${
                            (bankData?.summary?.totalBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(bankData?.summary?.totalBalance || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Celkový zostatok</p>
                      </>
                    ) : card.id === 'cash' ? (
                      <>
                        <p
                          className={`text-2xl font-bold ${
                            (cashData?.summary?.totalBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(cashData?.summary?.totalBalance || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Celkový zostatok</p>
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
