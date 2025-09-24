import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { accountingService } from '../services/accountingService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type Tx = {
  id: number;
  datum: string;   // ISO alebo lokálny dátum
  popis: string;
  kredit: number;
  debet: number;
  zostatok: number;
  typ: 'kredit' | 'debet';
};

type CashTxResponse = {
  company: { id: number; name: string; ico: string };
  account: { accountNumber: string; accountName: string; bankName: string };
  transactions: Tx[];
  summary: {
    totalCredit: number;
    totalDebit: number;
    currentBalance: number;
    transactionCount: number;
  };
};

const CashTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ companyId: string; accountNumber: string }>();
  const [storedCompanyId] = useLocalStorage<number | null>('selectedCompanyId', null);

  const companyId = Number(params.companyId ?? storedCompanyId ?? 0) || null;
  const accountNumber = params.accountNumber || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CashTxResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !accountNumber) {
        setError('Chýba companyId alebo číslo pokladne.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const resp = await accountingService.getCashTransactions(companyId, accountNumber);
        setData(resp as unknown as CashTxResponse);
      } catch (e: any) {
        setError(e?.message || 'Chyba pri načítaní pokladňových transakcií');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, accountNumber]);

  const formatCurrency = (v: number | null | undefined) =>
    new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(Number(v || 0));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('sk-SK');
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(`/accounting/cash/${companyId ?? ''}`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Späť na Pokladňu
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
  const acct = data?.account;
  const txs = data?.transactions ?? [];
  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/accounting/cash/${companyId ?? ''}`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Späť na Pokladňu
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {companyName} (IČO: {ico}) — pokladňa {acct?.accountNumber} {acct?.accountName ? `– ${acct.accountName}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Súčasný zostatok" value={formatCurrency(summary?.currentBalance || 0)} />
          <StatCard title="Príjmy spolu" value={formatCurrency(summary?.totalCredit || 0)} />
          <StatCard title="Výdavky spolu" value={formatCurrency(summary?.totalDebit || 0)} />
          <StatCard title="Počet pohybov" value={String(summary?.transactionCount || 0)} />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-dark-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <Th>Dátum</Th>
                <Th>Popis</Th>
                <Th className="text-right">Príjem</Th>
                <Th className="text-right">Výdavok</Th>
                <Th className="text-right">Zostatok</Th>
                <Th>Typ</Th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-gray-700">
              {txs.map((t) => (
                <tr key={t.id}>
                  <Td>{formatDate(t.datum)}</Td>
                  <Td>{t.popis}</Td>
                  <Td className="text-right">{t.kredit ? formatCurrency(t.kredit) : '-'}</Td>
                  <Td className="text-right">{t.debet ? formatCurrency(t.debet) : '-'}</Td>
                  <Td className="text-right">{formatCurrency(t.zostatok)}</Td>
                  <Td>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.typ === 'kredit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t.typ === 'kredit' ? 'Príjem' : 'Výdavok'}
                    </span>
                  </Td>
                </tr>
              ))}
              {txs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">
                    Žiadne pohyby.
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

const Th: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className || ''}`}>
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${className || ''}`}>{children}</td>
);

export default CashTransactionsPage;
