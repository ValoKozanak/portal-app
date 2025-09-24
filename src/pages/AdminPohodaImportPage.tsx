import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

interface AdminPohodaImportPageProps {
  onBack: () => void;
}

interface ImportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'available' | 'coming-soon' | 'disabled';
  endpoint?: string;
}

const AdminPohodaImportPage: React.FC<AdminPohodaImportPageProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [importStatus, setImportStatus] = useState<{[key: string]: string}>({});

  const importTypes: ImportType[] = [
    {
      id: 'issued-invoices',
      name: 'VydanA� faktAsry',
      description: 'Import vydanA?ch faktAsr z POHODA XML sAsborov',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      status: 'available',
      endpoint: '/accounting/upload-pohoda-xml'
    },
    {
      id: 'received-invoices',
      name: 'PrijatA� faktAsry',
      description: 'Import prijatA?ch faktAsr z POHODA XML sAsborov',
      icon: DocumentArrowDownIcon,
      color: 'text-green-600',
      status: 'coming-soon'
    },
    {
      id: 'bank-transactions',
      name: 'BankovA� pohyby',
      description: 'Import bankovA?ch pohybov z POHODA XML sAsborov',
      icon: BanknotesIcon,
      color: 'text-yellow-600',
      status: 'coming-soon'
    },
    {
      id: 'cash-transactions',
      name: 'PokladL�a',
      description: 'Import pokladL�ovA?ch pohybov z POHODA XML sAsborov',
      icon: CreditCardIcon,
      color: 'text-purple-600',
      status: 'coming-soon'
    },
    {
      id: 'partners',
      name: 'Partneri',
      description: 'Import partnerov z POHODA XML sAsborov',
      icon: BuildingOfficeIcon,
      color: 'text-indigo-600',
      status: 'coming-soon'
    },
    {
      id: 'employees',
      name: 'Zamestnanci',
      description: 'Import zamestnancov z POHODA XML sAsborov',
      icon: UserGroupIcon,
      color: 'text-pink-600',
      status: 'coming-soon'
    },
    {
      id: 'settings',
      name: 'Nastavenia',
      description: 'Import nastavenA� z POHODA XML sAsborov',
      icon: CogIcon,
      color: 'text-gray-600',
      status: 'coming-soon'
    }
  ];

  useEffect(() => {
    loadCompanies();
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

  const handleImport = async (importType: ImportType) => {
    if (importType.status !== 'available' || !selectedCompany) {
      return;
    }

    setImportStatus(prev => ({ ...prev, [importType.id]: 'importing' }));

    try {
      // Tu by sa implementoval konkrA�tny import
      // Pre teraz len simulujeme
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setImportStatus(prev => ({ ...prev, [importType.id]: 'success' }));
      
      setTimeout(() => {
        setImportStatus(prev => ({ ...prev, [importType.id]: '' }));
      }, 3000);
    } catch (error) {
      setImportStatus(prev => ({ ...prev, [importType.id]: 'error' }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'importing':
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
      case 'importing':
        return 'Importujem...';
      case 'success':
        return 'Import AsspeL?nA?';
      case 'error':
        return 'Chyba importu';
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
              <h1 className="text-xl font-semibold text-gray-900">POHODA Import</h1>
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
                POHODA Import - InformA?cie
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Importujte dA?ta z POHODA XML sAsborov do systA�mu. Vyberte typ importu a firmu.</p>
                <p className="mt-1">DostupnA� sAs rA�zne typy importov pre faktAsry, pohyby a �ZalL?ie dA?ta.</p>
              </div>
            </div>
          </div>
        </div>

        {/* VA?ber firmy */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">VA?ber firmy</h2>
          <select
            value={selectedCompany || ''}
            onChange={(e) => setSelectedCompany(Number(e.target.value))}
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.ico})
              </option>
            ))}
          </select>
        </div>

        {/* Typy importov */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {importTypes.map((importType) => {
            const IconComponent = importType.icon;
            const isAvailable = importType.status === 'available' && selectedCompany;
            const status = importStatus[importType.id];

            return (
              <div
                key={importType.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  isAvailable ? 'border-gray-200 hover:border-blue-300' : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg bg-gray-100 ${importType.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <IconComponent className={`h-6 w-6 ${importType.color}`} />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{importType.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{importType.description}</p>
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
                  {importType.status === 'available' ? (
                    <button
                      onClick={() => handleImport(importType)}
                      disabled={!isAvailable || status === 'importing'}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        isAvailable && status !== 'importing'
                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {status === 'importing' ? 'Importujem...' : 'ImportovaLA'}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {importType.status === 'coming-soon' ? '�Soskoro dostupnA�' : 'NedostupnA�'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {importType.status === 'coming-soon' ? 'SOON' : 'N/A'}
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
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Pokyny pre import</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>�?? XML sAsbory musia byLA vo formA?te POHODA dataPack</li>
            <li>�?? Import sa vykonA?va pre vybranAs firmu</li>
            <li>�?? ExistujAsce zA?znamy sa aktualizujAs pod�la ID</li>
            <li>�?? Import je bezpe�TnA? - dA?ta sa nemazajAs</li>
            <li>�?? Po importe sa zobrazA� sAshrn vA?sledkov</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPohodaImportPage;

