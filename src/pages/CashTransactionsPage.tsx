import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { accountingService } from '../services/accountingService';

interface CashTransaction {
  id: number;
  datum: string;
  popis: string;
  kredit: number;
  debet: number;
  zostatok: number;
  typ: 'kredit' | 'debet';
  firma?: string; // Volite�lnA� pole
}

interface CashTransactionsData {
  company: {
    id: number;
    name: string;
    ico: string;
  };
  account: {
    accountNumber: string;
    accountName: string;
    bankName: string;
  };
  transactions: CashTransaction[];
  summary: {
    totalCredit: number;
    totalDebit: number;
    currentBalance: number;
    transactionCount: number;
  };
}

const CashTransactionsPage: React.FC = () => {
  const { companyId, accountNumber } = useParams<{ companyId: string; accountNumber: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionsData, setTransactionsData] = useState<CashTransactionsData | null>(null);
  const [filters, setFilters] = useState({
    datum: '',
    popis: '',
    firma: '',
    kredit: '',
    debet: '',
    zostatok: ''
  });

  const [userRole] = useLocalStorage<'admin' | 'accountant' | 'user' | 'employee' | null>('userRole', null);

  useEffect(() => {
    if (companyId && accountNumber) {
      loadTransactions();
    }
  }, [companyId, accountNumber]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!accountNumber) {
        setError('ChA?ba �TA�slo As�Ttu');
        return;
      }

      console.log('dz'� Na�TA�tavam transakcie pokladne pre As�Tet:', accountNumber);

      const data = await accountingService.getCashTransactions(Number(companyId), accountNumber);
      console.log('dz'� Transakcie pokladne na�TA�tanA�:', data);

      setTransactionsData(data);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� transakciA� pokladne:', error);
      setError('Chyba pri na�TA�tanA� transakciA� pokladne');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK');
  };

  const handleRefresh = () => {
    loadTransactions();
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      datum: '',
      popis: '',
      firma: '',
      kredit: '',
      debet: '',
      zostatok: ''
    });
  };

  const filteredTransactions = transactionsData?.transactions?.filter(transaction => {
    // Filtrovanie pod�la dA?tumu
    if (filters.datum && !transaction.datum.includes(filters.datum)) {
      return false;
    }
    
    // Filtrovanie pod�la popisu
    if (filters.popis && !transaction.popis.toLowerCase().includes(filters.popis.toLowerCase())) {
      return false;
    }
    
    // Filtrovanie pod�la firmy
    if (filters.firma && (!transaction.firma || !transaction.firma.toLowerCase().includes(filters.firma.toLowerCase()))) {
      return false;
    }
    
    // Filtrovanie pod�la kreditu
    if (filters.kredit && !transaction.kredit.toString().includes(filters.kredit)) {
      return false;
    }
    
    // Filtrovanie pod�la debetu
    if (filters.debet && !transaction.debet.toString().includes(filters.debet)) {
      return false;
    }
    
    // Filtrovanie pod�la zostatku
    if (filters.zostatok && !transaction.zostatok.toString().includes(filters.zostatok)) {
      return false;
    }
    
    return true;
  }) || [];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Chyba
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/accounting/cash/${companyId}`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                SpA�LA na PokladL�u
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transakcie pokladne - {transactionsData?.account?.accountNumber}
              </h1>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ObnoviLA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HlavnA? obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {transactionsData && (
          <>
            {/* InformA?cie o As�Tte */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                InformA?cie o pokladni
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">�SA�slo As�Ttu</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {transactionsData.account.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">NA?zov As�Ttu</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {transactionsData.account.accountName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Typ</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    PokladL�a
                  </p>
                </div>
              </div>
            </div>

            {/* SAshrn */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                SAshrn transakciA�
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">AktuA?lny zostatok</p>
                      <p className={`text-2xl font-bold ${transactionsData.summary.currentBalance >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(transactionsData.summary.currentBalance)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">CelkovA? kredit</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(transactionsData.summary.totalCredit)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-red-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">CelkovA? debet</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(transactionsData.summary.totalDebit)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Po�Tet transakciA�</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {transactionsData.summary.transactionCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabu�lka transakciA� s filtrovacA�mi poliami v hlavi�Tke */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Transakcie ({filteredTransactions.length})
                </h3>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FunnelIcon className="h-4 w-4 mr-1" />
                  Vy�TistiLA filtre
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        DA?tum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Popis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Firma
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Kredit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Debet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Zostatok
                      </th>
                    </tr>
                    {/* Filtrovacie riadky */}
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-3 py-2">
                        <input
                          type="text"
                          value={filters.datum}
                          onChange={(e) => handleFilterChange('datum', e.target.value)}
                          placeholder="FiltrovaLA dA?tum..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </th>
                      <th className="px-3 py-2">
                        <input
                          type="text"
                          value={filters.popis}
                          onChange={(e) => handleFilterChange('popis', e.target.value)}
                          placeholder="FiltrovaLA popis..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </th>
                      <th className="px-3 py-2">
                        <input
                          type="text"
                          value={filters.firma}
                          onChange={(e) => handleFilterChange('firma', e.target.value)}
                          placeholder="FiltrovaLA firmu..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </th>
                      <th className="px-3 py-2">
                        <input
                          type="text"
                          value={filters.kredit}
                          onChange={(e) => handleFilterChange('kredit', e.target.value)}
                          placeholder="FiltrovaLA kredit..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </th>
                      <th className="px-3 py-2">
                        <input
                          type="text"
                          value={filters.debet}
                          onChange={(e) => handleFilterChange('debet', e.target.value)}
                          placeholder="FiltrovaLA debet..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </th>
                      <th className="px-3 py-2">
                        <input
                          type="text"
                          value={filters.zostatok}
                          onChange={(e) => handleFilterChange('zostatok', e.target.value)}
                          placeholder="FiltrovaLA zostatok..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(transaction.datum)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {transaction.popis}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {transaction.firma ? transaction.firma : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          {transaction.kredit > 0 ? formatCurrency(transaction.kredit) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                          {transaction.debet > 0 ? formatCurrency(transaction.debet) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${transaction.zostatok >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(transaction.zostatok)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CashTransactionsPage;

