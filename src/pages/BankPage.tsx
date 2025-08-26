import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { accountingService, BankTransaction } from '../services/accountingService';

const BankPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyId, setCompanyId] = useState(3);

  useEffect(() => {
    loadTransactions();
  }, [companyId]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await accountingService.getBankTransactions(companyId, { limit: 100 });
      setTransactions(data);
    } catch (error) {
      console.error('Chyba pri načítaní bankových transakcií:', error);
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

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      credit: { color: 'bg-green-100 text-green-800', text: 'Príjem' },
      debit: { color: 'bg-red-100 text-red-800', text: 'Výdavok' },
      transfer: { color: 'bg-blue-100 text-blue-800', text: 'Prevod' }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.credit;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(transaction => 
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.bank_account?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditTransaction = (transaction: BankTransaction) => {
    console.log('Editovať transakciu:', transaction);
    // TODO: Implementovať editáciu transakcie
    alert(`Editovať transakciu: ${transaction.description}`);
  };

  const handleDeleteTransaction = async (transaction: BankTransaction) => {
    if (!window.confirm(`Naozaj chcete vymazať transakciu ${transaction.description}?`)) {
      return;
    }

    if (!transaction.id) {
      alert('Chyba: ID transakcie nie je definované');
      return;
    }

    try {
      await accountingService.deleteBankTransaction(transaction.id);
      await loadTransactions();
    } catch (error) {
      console.error('Chyba pri mazaní transakcie:', error);
      alert('Chyba pri mazaní transakcie');
    }
  };

  const handleCreateTransaction = () => {
    console.log('Vytvoriť novú transakciu');
    // TODO: Implementovať vytvorenie transakcie
    alert('Vytvoriť novú transakciu');
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
                onClick={() => navigate('/accounting')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na Účtovníctvo
              </button>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Banka</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hlavný obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hlavička s vyhľadávaním a tlačidlami */}
        <div className="bg-white dark:bg-dark-800 shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bankové transakcie</h2>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Hľadať transakcie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateTransaction}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nová transakcia
                </button>
              </div>
            </div>
          </div>

          {/* Tabuľka transakcií */}
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
                    Účet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Kategória
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Suma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Akcie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Načítavam transakcie...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Žiadne transakcie neboli nájdené
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-dark-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                 {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                 {transaction.bank_account || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(transaction.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <PencilIcon className="h-4 w-4" />
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
  );
};

export default BankPage;
