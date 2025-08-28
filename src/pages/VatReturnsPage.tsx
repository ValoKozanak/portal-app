import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { accountingService } from '../services/accountingService';

interface VatReturn {
  id: number;
  rok: number;
  mesiac: number;
  povinnost: number;
  odpočet: number;
  odoslané: boolean;
}

interface VatData {
  company: {
    id: number;
    name: string;
    ico: string;
  };
  year: number;
  returns: VatReturn[];
  summary: {
    totalPovinnost: number;
    totalOdpočet: number;
    totalRozdiel: number;
    odoslanéCount: number;
    neodoslanéCount: number;
  };
}

const VatReturnsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vatData, setVatData] = useState<VatData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [userRole] = useLocalStorage<'admin' | 'accountant' | 'user' | 'employee' | null>('userRole', null);

  useEffect(() => {
    if (companyId) {
      loadVatReturns();
    }
  }, [companyId, selectedYear]);

  const loadVatReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await accountingService.getVatReturns(Number(companyId), selectedYear);
      setVatData(data);
    } catch (error) {
      console.error('Chyba pri načítaní DPH podaní:', error);
      setError('Chyba pri načítaní DPH podaní');
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

  const getMonthName = (month: number) => {
    const months = [
      'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
      'Júl', 'August', 'September', 'Október', 'November', 'December'
    ];
    return months[month - 1] || `Mesiac ${month}`;
  };

  const handleRefresh = () => {
    loadVatReturns();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
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
                onClick={() => navigate('/accounting')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na Účtovníctvo
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                DPH podania - {vatData?.company?.name}
              </h1>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Obnoviť
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hlavný obsah */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {vatData && (
          <>
            {/* Súhrn */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Súhrn za rok {selectedYear}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyEuroIcon className="h-8 w-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Celková povinnosť</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(vatData.summary.totalPovinnost)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyEuroIcon className="h-8 w-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Celkový odpočet</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(vatData.summary.totalOdpočet)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CurrencyEuroIcon className="h-8 w-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Rozdiel</p>
                      <p className={`text-2xl font-bold ${vatData.summary.totalRozdiel < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {vatData.summary.totalRozdiel < 0 ? '+' : '-'}{formatCurrency(Math.abs(vatData.summary.totalRozdiel))}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-yellow-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Odoslané</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {vatData.summary.odoslanéCount}/{vatData.summary.odoslanéCount + vatData.summary.neodoslanéCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabuľka DPH podaní */}
            <div className="bg-white dark:bg-dark-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  DPH podania za rok {selectedYear}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mesiac
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Povinnosť DPH
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Odpočet DPH
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rozdiel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {vatData.returns.map((vatReturn) => (
                      <tr key={vatReturn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {getMonthName(vatReturn.mesiac)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(vatReturn.povinnost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(vatReturn.odpočet)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${vatReturn.povinnost - vatReturn.odpočet < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {vatReturn.povinnost - vatReturn.odpočet < 0 ? '+' : '-'}{formatCurrency(Math.abs(vatReturn.povinnost - vatReturn.odpočet))}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {vatReturn.odoslané ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Odoslané
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Neodoslané
                            </span>
                          )}
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

export default VatReturnsPage;
