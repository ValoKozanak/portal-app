import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  CogIcon,
  ComputerDesktopIcon,
  UserGroupIcon,
  KeyIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { accountingService, AccountingSettings, AccountingPermissions } from '../services/accountingService';
import { apiService } from '../services/apiService';
import PohodaSettingsModal from '../components/PohodaSettingsModal';

interface AdminSettingsPageProps {
  onBack: () => void;
}

const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [settings, setSettings] = useState<AccountingSettings | null>(null);
  const [permissions, setPermissions] = useState<AccountingPermissions[]>([]);
  const [showPohodaModal, setShowPohodaModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

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
      console.error('Chyba pri načítaní firiem:', error);
    }
  };

  const loadCompanyData = async (companyId: number) => {
    try {
      const [settingsData, permissionsData] = await Promise.all([
        accountingService.getSettings(companyId),
        accountingService.getAllPermissions(companyId)
      ]);
      setSettings(settingsData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Chyba pri načítaní dát firmy:', error);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      loadCompanyData(selectedCompany);
    }
  }, [selectedCompany]);

  const formatDate = (date: string) => {
    return accountingService.formatDate(date);
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
              <h1 className="text-xl font-semibold text-gray-900">POHODA mServer Nastavenia</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Výber firmy */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vyberte firmu
          </label>
          <select
            value={selectedCompany || ''}
            onChange={(e) => setSelectedCompany(Number(e.target.value))}
            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCompany && (
          <div className="grid grid-cols-1 gap-6">
            {/* POHODA mServer Nastavenia */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ComputerDesktopIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    POHODA mServer Nastavenia
                  </h2>
                  <button
                    onClick={() => setShowPohodaModal(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Upraviť
                  </button>
                </div>
              </div>
              <div className="p-6">
                {settings ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Stav integrácie</span>
                      <div className="flex items-center">
                        {settings.pohoda_enabled ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span className={`text-sm ${settings.pohoda_enabled ? 'text-green-600' : 'text-red-600'}`}>
                          {settings.pohoda_enabled ? 'Aktívna' : 'Neaktívna'}
                        </span>
                      </div>
                    </div>
                    
                    {settings.pohoda_enabled && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">IČO firmy v POHODA</span>
                          <span className="text-sm text-gray-900">
                            {settings.pohoda_ico || '-'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Rok firmy v POHODA</span>
                          <span className="text-sm text-gray-900">
                            {settings.pohoda_year || '-'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Automatická synchronizácia</span>
                          <span className="text-sm text-gray-900">
                            {settings.auto_sync ? 'Zapnutá' : 'Vypnutá'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Frekvencia synchronizácie</span>
                          <span className="text-sm text-gray-900">
                            {settings.sync_frequency === 'hourly' && 'Každú hodinu'}
                            {settings.sync_frequency === 'daily' && 'Denne'}
                            {settings.sync_frequency === 'weekly' && 'Týždenne'}
                            {settings.sync_frequency === 'manual' && 'Manuálne'}
                          </span>
                        </div>
                        
                        {settings.last_sync && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Posledná synchronizácia</span>
                            <span className="text-sm text-gray-900">
                              {formatDate(settings.last_sync)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Žiadne nastavenia POHODA
                  </p>
                )}
              </div>
            </div>

            {/* Práva pre účtovníctvo */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Práva pre účtovníctvo
                  </h2>
                  <button
                    onClick={() => setShowPermissionsModal(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Pridať práva
                  </button>
                </div>
              </div>
              <div className="p-6">
                {permissions.length > 0 ? (
                  <div className="space-y-3">
                    {permissions.map((perm) => (
                      <div key={perm.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {perm.user_email}
                          </span>
                          <span className="text-xs text-gray-500">
                            {perm.granted_at ? formatDate(perm.granted_at) : '-'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {perm.can_view_invoices && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Zobraziť faktúry
                            </span>
                          )}
                          {perm.can_create_invoices && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Vytvoriť faktúry
                            </span>
                          )}
                          {perm.can_edit_invoices && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Upraviť faktúry
                            </span>
                          )}
                          {perm.can_view_bank && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Zobraziť banku
                            </span>
                          )}
                          {perm.can_edit_bank && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              Upraviť banku
                            </span>
                          )}
                          {perm.can_view_cash && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              Zobraziť pokladňu
                            </span>
                          )}
                          {perm.can_edit_cash && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Upraviť pokladňu
                            </span>
                          )}
                          {perm.can_manage_settings && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Spravovať nastavenia
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Žiadne práva pre účtovníctvo
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showPohodaModal && settings && (
          <PohodaSettingsModal
            isOpen={showPohodaModal}
            onClose={() => setShowPohodaModal(false)}
            companyId={selectedCompany!}
            settings={settings}
            onSave={async (newSettings) => {
              try {
                await accountingService.saveSettings(selectedCompany!, newSettings);
                await loadCompanyData(selectedCompany!);
                setShowPohodaModal(false);
              } catch (error) {
                console.error('Chyba pri ukladaní POHODA nastavení:', error);
              }
            }}
          />
        )}

        {/* TODO: Modal pre práva */}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
