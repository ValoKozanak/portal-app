import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { accountingService, FinancialAnalysis } from '../services/accountingService';
import { formatCurrency } from '../utils/formatters';
import FinancialCharts from '../components/charts/FinancialCharts';

const FinancialAnalysisPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    if (companyId) {
      loadCompanyInfo();
      loadFinancialAnalysis();
    }
  }, [companyId]);

  const loadCompanyInfo = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const companyData = await response.json();
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Chyba pri načítaní informácií o firme:', error);
    }
  };

  const loadFinancialAnalysis = async () => {
    // Validácia dátumov
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setDateError('Dátum "Do" nemôže byť menší ako dátum "Od"');
      return;
    } else {
      setDateError('');
    }

    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      const data = await accountingService.getFinancialAnalysis(
        parseInt(companyId!),
        dateFrom || undefined,
        dateTo || undefined
      );
      setAnalysis(data);
    } catch (err) {
      console.error('Chyba pri načítaní finančnej analýzy:', err);
      setError('Chyba pri načítaní finančnej analýzy');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Chyba</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-500">Žiadne dáta k zobrazeniu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header s navigáciou späť */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/accounting')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na účtovníctvo
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Analýza hospodárskych výsledkov
                </h1>
                {/* Zobrazenie aktuálnej firmy */}
                {company && (
                  <div className="text-sm text-gray-600 mt-1">
                    Firma: {company.name} (IČO: {company.ico})
                  </div>
                )}
              </div>
              <button
                onClick={loadFinancialAnalysis}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Obnoviť
              </button>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Podrobná analýza nákladov, výnosov a zisku/straty
          </p>
        </div>

        {/* Dátumové filtre */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtrovanie podľa obdobia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                Od dátumu
              </label>
                             <input
                 type="date"
                 id="dateFrom"
                 value={dateFrom}
                 min="1990-01-01"
                 onChange={(e) => setDateFrom(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                Do dátumu
              </label>
                             <input
                 type="date"
                 id="dateTo"
                 value={dateTo}
                 min={dateFrom || "1990-01-01"}
                 onChange={(e) => setDateTo(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
            </div>
                         <div className="flex items-end space-x-2">
               <button
                 onClick={loadFinancialAnalysis}
                 className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
               >
                 Aplikovať filtre
               </button>
               <button
                 onClick={() => {
                   setDateFrom('');
                   setDateTo('');
                   setDateError('');
                 }}
                 className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
               >
                 Vymazať filtre
               </button>
             </div>
          </div>
                     {dateError && (
             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
               <p className="text-sm text-red-800">
                 <strong>Chyba:</strong> {dateError}
               </p>
             </div>
           )}
           {analysis?.filters && (analysis.filters.dateFrom || analysis.filters.dateTo) && (
             <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
               <p className="text-sm text-blue-800">
                 <strong>Aktívne filtre:</strong> 
                 {analysis.filters.dateFrom && ` Od: ${analysis.filters.dateFrom}`}
                 {analysis.filters.dateTo && ` Do: ${analysis.filters.dateTo}`}
               </p>
             </div>
           )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Výnosy */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Celkové výnosy</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(analysis.revenue.total)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analysis.revenue.count} účtových skupín
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Náklady */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Celkové náklady</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(analysis.expenses.total)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analysis.expenses.count} účtových skupín
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Zisk/Strata */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {analysis.isProfit ? 'Zisk' : 'Strata'}
                </p>
                <p className={`text-2xl font-bold ${analysis.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(analysis.profit))}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {analysis.isProfit ? 'Pozitívny výsledok' : 'Negatívny výsledok'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${analysis.isProfit ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg className={`h-6 w-6 ${analysis.isProfit ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {analysis.isProfit ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Výnosy Detail */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Výnosy (účty 6xx)</h3>
              <p className="text-sm text-gray-600">
                Celková suma: {formatCurrency(analysis.revenue.total)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Účet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Suma
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.revenue.details.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div className="font-semibold">{item.account_name}</div>
                          <div className="text-xs text-gray-500">{item.account}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Náklady Detail */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Náklady (účty 5xx)</h3>
              <p className="text-sm text-gray-600">
                Celková suma: {formatCurrency(analysis.expenses.total)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Účet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Suma
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysis.expenses.details.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div className="font-semibold">{item.account_name}</div>
                          <div className="text-xs text-gray-500">{item.account}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

                 {/* Profit/Loss Summary */}
         <div className="mt-8 bg-white rounded-lg shadow">
           <div className="px-6 py-4 border-b border-gray-200">
             <h3 className="text-lg font-medium text-gray-900">Výsledok hospodárenia</h3>
           </div>
           <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="text-center">
                 <p className="text-sm font-medium text-gray-600">Výnosy</p>
                 <p className="text-2xl font-bold text-green-600">
                   {formatCurrency(analysis.revenue.total)}
                 </p>
               </div>
               <div className="text-center">
                 <p className="text-sm font-medium text-gray-600">Náklady</p>
                 <p className="text-2xl font-bold text-red-600">
                   {formatCurrency(analysis.expenses.total)}
                 </p>
               </div>
               <div className="text-center">
                 <p className="text-sm font-medium text-gray-600">
                   {analysis.isProfit ? 'Zisk' : 'Strata'}
                 </p>
                 <p className={`text-2xl font-bold ${analysis.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                   {analysis.isProfit ? '+' : '-'} {formatCurrency(Math.abs(analysis.profit))}
                 </p>
               </div>
             </div>
             
             {/* Profit Margin */}
             {analysis.revenue.total > 0 && (
               <div className="mt-6 pt-6 border-t border-gray-200">
                 <div className="text-center">
                   <p className="text-sm font-medium text-gray-600">Zisková marža</p>
                   <p className={`text-xl font-bold ${analysis.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                     {((Math.abs(analysis.profit) / analysis.revenue.total) * 100).toFixed(2)}%
                   </p>
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Grafy */}
         <div className="mt-8">
           <h2 className="text-2xl font-bold text-gray-900 mb-6">Grafická analýza</h2>
           <FinancialCharts analysis={analysis} />
         </div>
      </div>
    </div>
  );
};

export default FinancialAnalysisPage;
