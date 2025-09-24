import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  DocumentArrowUpIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

interface AdminPohodaExportPageProps {
  onBack: () => void;
}

interface ExportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'available' | 'coming-soon' | 'disabled';
  endpoint?: string;
  hasDateFilter?: boolean;
}

const AdminPohodaExportPage: React.FC<AdminPohodaExportPageProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [exportStatus, setExportStatus] = useState<{[key: string]: string}>({});
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const exportTypes: ExportType[] = [
    {
      id: 'issued-invoices',
      name: 'VydanA� faktAsry',
      description: 'Export vydanA?ch faktAsr do POHODA XML formA?tu',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      status: 'available',
      endpoint: '/accounting/export-pohoda-xml',
      hasDateFilter: true
    },
    {
      id: 'received-invoices',
      name: 'PrijatA� faktAsry',
      description: 'Export prijatA?ch faktAsr do POHODA XML formA?tu',
      icon: DocumentArrowUpIcon,
      color: 'text-green-600',
      status: 'coming-soon',
      hasDateFilter: true
    },
    {
      id: 'bank-transactions',
      name: 'BankovA� pohyby',
      description: 'Export bankovA?ch pohybov do POHODA XML formA?tu',
      icon: BanknotesIcon,
      color: 'text-yellow-600',
      status: 'coming-soon',
      hasDateFilter: true
    },
    {
      id: 'cash-transactions',
      name: 'PokladL�a',
      description: 'Export pokladL�ovA?ch pohybov do POHODA XML formA?tu',
      icon: CreditCardIcon,
      color: 'text-purple-600',
      status: 'coming-soon',
      hasDateFilter: true
    },
    {
      id: 'partners',
      name: 'Partneri',
      description: 'Export partnerov do POHODA XML formA?tu',
      icon: BuildingOfficeIcon,
      color: 'text-indigo-600',
      status: 'coming-soon',
      hasDateFilter: false
    },
    {
      id: 'employees',
      name: 'Zamestnanci',
      description: 'Export zamestnancov do POHODA XML formA?tu',
      icon: UserGroupIcon,
      color: 'text-pink-600',
      status: 'coming-soon',
      hasDateFilter: false
    },
    {
      id: 'settings',
      name: 'Nastavenia',
      description: 'Export nastavenA� do POHODA XML formA?tu',
      icon: CogIcon,
      color: 'text-gray-600',
      status: 'coming-soon',
      hasDateFilter: false
    }
  ];

  useEffect(() => {
    loadCompanies();
    // NastavA�me predvolenA� dA?tumy (poslednA? mesiac)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setDateFrom(lastMonth.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesData = await apiService.getAllCompanies();
      setCompanies(companiesData);
      if (companiesData.length > 0) {
        setSelectedCompany(companiesData[0].id);
      }
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� firiem:', error);
    }
  };

  const handleExport = async (exportType: ExportType) => {
    if (exportType.status !== 'available' || !selectedCompany) {
      return;
    }

    setExportStatus(prev => ({ ...prev, [exportType.id]: 'exporting' }));

    try {
      // Tu by sa implementoval konkrA�tny export
      // Pre teraz len simulujeme
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setExportStatus(prev => ({ ...prev, [exportType.id]: 'success' }));
      
      setTimeout(() => {
        setExportStatus(prev => ({ ...prev, [exportType.id]: '' }));
      }, 3000);
    } catch (error) {
      setExportStatus(prev => ({ ...prev, [exportType.id]: 'error' }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exporting':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exporting':
        return 'Exportujem...';
      case 'success':
        return 'Export AsspeL?nA?';
      case 'error':
        return 'Chyba exportu';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">POHODA Export</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* InformA?cie */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                POHODA Export - InformA?cie
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Exportujte dA?ta zo systA�mu do POHODA XML formA?tu. Vyberte typ exportu a firmu.</p>
                <p className="mt-1">DostupnA� sAs rA�zne typy exportov pre faktAsry, pohyby a �ZalL?ie dA?ta.</p>
              </div>
            </div>
          </div>
        </div>

        {/* VA?ber firmy a dA?tumov */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nastavenia exportu</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firma</label>
              <select
                value={selectedCompany || ''}
                onChange={(e) => setSelectedCompany(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.ico})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Od dA?tumu</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Do dA?tumu</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Typy exportov */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exportTypes.map((exportType) => {
            const IconComponent = exportType.icon;
            const isAvailable = exportType.status === 'available' && selectedCompany;
            const status = exportStatus[exportType.id];

            return (
              <div
                key={exportType.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  isAvailable ? 'border-gray-200 hover:border-blue-300' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-gray-100 ${exportType.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <IconComponent className={`h-6 w-6 ${exportType.color}`} />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{exportType.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{exportType.description}</p>
                      {exportType.hasDateFilter && (
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          S dA?tumovA?m filtrom
                        </div>
                      )}
                    </div>
                  </div>
                  {status && (
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {exportType.status === 'available' ? (
                    <button
                      onClick={() => handleExport(exportType)}
                      disabled={!isAvailable || status === 'exporting'}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        isAvailable && status !== 'exporting'
                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {status === 'exporting' ? 'Exportujem...' : 'ExportovaLA'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {exportType.status === 'coming-soon' ? '�Soskoro dostupnA�' : 'NedostupnA�'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {exportType.status === 'coming-soon' ? 'SOON' : 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pokyny */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Pokyny pre export</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>�?? Export sa vykonA?va pre vybranAs firmu</li>
            <li>�?? DA?tumovA? filter sa aplikuje na relevantnA� typy dA?t</li>
            <li>�?? ExportovanA� sAsbory sAs vo formA?te POHODA dataPack</li>
            <li>�?? SAsbory sa automaticky stiahnu do vA?L?ho po�TA�ta�Ta</li>
            <li>�?? Export obsahuje vL?etky dostupnA� dA?ta pre danA? typ</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPohodaExportPage;

