import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { accountingService } from '../services/accountingService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type CashAccount = {
  id: number;
  accountNumber: string;
  accountName: string;
  balance: number;
  creditTotal: number;
  debitTotal: number;
  transactionCount: number;
};

type CashResponse = {
  company: { id: number; name: string; ico: string };
  accounts: CashAccount[];
  summary: {
    totalBalance: number;
    totalCredit: number;
    totalDebit: number;
    accountCount: number;
  };
};

const CashPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ companyId: string }>();
  const [storedCompanyId] = useLocalStorage<number | null>('selectedCompanyId', null);

  const effectiveCompanyId = Number(params.companyId ?? storedCompanyId ?? 0) || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CashResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!effectiveCompanyId) {
        setError('Nie je vybratá firma.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const resp = await accountingService.getCashAccounts(effectiveCompanyId);
        setData(resp as unknown as CashResponse);
      } catch (e: any) {
        setError(e?.message || 'Chyba pri načítaní pokladňových účtov');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [effectiveCompanyId]);

  const formatCurrency = (v: number | null | undefined) =>
    new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(Number(v || 0));

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/accounting')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Späť na Účtovníctvo
          </button>

          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const companyName = data?.company?.name ?? '';
  const ico = data?.company?.ico ?? '';
  const accounts = data?.accounts ?? [];
  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/accounting')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na Účtovníctvo
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {companyName} (IČO: {ico})
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Celkový zostatok" value={formatCurrency(summary?.totalBalance || 0)} />
          <StatCard title="Príjmy spolu" value={formatCurrency(summary?.totalCredit || 0)} />
          <StatCard title="Výdavky spolu" value={formatCurrency(summary?.totalDebit || 0)} />
          <StatCard title="Počet pokladní" value={String(summary?.accountCount || 0)} />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <Th>Číslo pokladne</Th>
                <Th>Názov</Th>
                <Th>Zostatok</Th>
                <Th>Príjmy</Th>
                <Th>Výdavky</Th>
                <Th>Pohyby</Th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <Td>{a.accountNumber}</Td>
                  <Td>{a.accountName}</Td>
                  <Td>{formatCurrency(a.balance)}</Td>
                  <Td>{formatCurrency(a.creditTotal)}</Td>
                  <Td>{formatCurrency(a.debitTotal)}</Td>
                  <Td>{a.transactionCount}</Td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">
                    Žiadne pokladňové účty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="p-4 rounded-lg bg-white dark:bg-dark-800 shadow">
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{children}</td>
);

export default CashPage;
