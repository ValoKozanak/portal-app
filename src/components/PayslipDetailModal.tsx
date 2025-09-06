import React, { useEffect, useState } from 'react';
import { payrollService } from '../services/payrollService';

interface PayslipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  employeeId: number;
  year: number;
  month: number;
}

const label = (k: string) => {
  const map: Record<string, string> = {
    year: 'Rok',
    month: 'Mesiac',
    employeeCode: 'Osobné číslo',
    calendarDays: 'Kalendárne dni',
    holidays: 'Sviatky',
    workingDays: 'Pracovné dni',
    workRatio: 'Pracovný úväzok',
    workedDays: 'Odpracované dni',
    workedHours: 'Odpracované hodiny',
    baseWage: 'Základná mzda',
    bonuses: 'Prémie',
    grossWage: 'Hrubá mzda',
    taxableIncome: 'Zdaniteľný príjem',
    wageTax: 'Daň zo mzdy',
    taxBonus: 'Daňový bonus',
    netWage: 'Čistá mzda',
    advance: 'Záloha',
    settlement: 'Doplatok',
    socialInsurance: 'Sociálne poistenie (SP)',
    healthInsurance: 'Zdravotné poistenie (ZP)'
  };
  return map[k] || k;
};

const formatValue = (v: any) => {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'number') return v.toFixed(2).replace('.', ',');
  return String(v);
};

const PayslipDetailModal: React.FC<PayslipDetailModalProps> = ({ isOpen, onClose, companyId, employeeId, year, month }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isOpen) return;
      setLoading(true);
      setError(null);
      try {
        const res = await payrollService.getPayslipDetail(companyId, employeeId, year, month);
        setData(res.payslip || null);
      } catch (e: any) {
        setError('Nepodarilo sa načítať detail výplatnej pásky');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, companyId, employeeId, year, month]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detail výplatnej pásky</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">✕</button>
        </div>
        <div className="p-6">
          {loading ? (
            <div>Načítavam...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-700 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{label(k)}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatValue(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>Žiadne dáta</div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-dark-600 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Zavrieť</button>
        </div>
      </div>
    </div>
  );
};

export default PayslipDetailModal;


