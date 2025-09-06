import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { accountingService, AccountingSettings } from '../services/accountingService';
import PohodaXmlImportExport from './PohodaXmlImportExport';

interface PohodaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  settings: AccountingSettings;
  onSave: (settings: Partial<AccountingSettings>) => void;
}

const PohodaSettingsModal: React.FC<PohodaSettingsModalProps> = ({
  isOpen,
  onClose,
  companyId,
  settings,
  onSave
}) => {
        const [formData, setFormData] = useState({
        pohoda_enabled: false,
        pohoda_url: '',
        pohoda_username: '',
        pohoda_password: '',
        pohoda_ico: '',
        pohoda_year: '',
        auto_sync: false,
        sync_frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'manual'
      });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        pohoda_enabled: settings.pohoda_enabled || false,
        pohoda_url: settings.pohoda_url || '',
        pohoda_username: settings.pohoda_username || '',
        pohoda_password: settings.pohoda_password || '',
        pohoda_ico: settings.pohoda_ico || '',
        pohoda_year: settings.pohoda_year || '',
        auto_sync: settings.auto_sync || false,
        sync_frequency: settings.sync_frequency || 'daily'
      });
    }
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const canTestConnection = () => {
    return formData.pohoda_url && formData.pohoda_username && formData.pohoda_password && formData.pohoda_ico && formData.pohoda_year;
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/accounting/test-pohoda-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          companyId,
          pohoda_url: formData.pohoda_url,
          pohoda_username: formData.pohoda_username,
          pohoda_password: formData.pohoda_password,
          pohoda_ico: formData.pohoda_ico,
          pohoda_year: formData.pohoda_year
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({
          success: true,
          message: 'Spojenie s POHODA mServer je úspešné!'
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Nepodarilo sa pripojiť k POHODA mServer'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Chyba pri testovaní spojenia'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave({
        pohoda_enabled: formData.pohoda_enabled,
        pohoda_url: formData.pohoda_url,
        pohoda_username: formData.pohoda_username,
        pohoda_password: formData.pohoda_password,
        pohoda_ico: formData.pohoda_ico,
        pohoda_year: formData.pohoda_year,
        auto_sync: formData.auto_sync,
        sync_frequency: formData.sync_frequency
      });

      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní nastavení:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestInvoices = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await accountingService.testPohodaInvoices(companyId, {
        pohoda_url: formData.pohoda_url,
        pohoda_username: formData.pohoda_username,
        pohoda_password: formData.pohoda_password,
        pohoda_ico: formData.pohoda_ico,
        pohoda_year: formData.pohoda_year
      });
      
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Faktúry úspešne načítané' : 'Chyba pri načítaní faktúr')
      });
    } catch (error) {
      console.error('Chyba pri testovaní faktúr:', error);
      setTestResult({
        success: false,
        message: 'Chyba pri testovaní faktúr'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncInvoices = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const result = await accountingService.syncPohodaInvoices(companyId);
      
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Synchronizácia úspešná' : 'Chyba pri synchronizácii')
      });
    } catch (error) {
      console.error('Chyba pri synchronizácii:', error);
      setTestResult({
        success: false,
        message: 'Chyba pri synchronizácii faktúr'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Nastavenia POHODA integrácie
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Základné nastavenia */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Základné nastavenia</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="pohoda_enabled"
                name="pohoda_enabled"
                checked={formData.pohoda_enabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="pohoda_enabled" className="ml-2 block text-sm text-gray-900">
                Povoliť POHODA integráciu
              </label>
            </div>

            <div>
              <label htmlFor="pohoda_url" className="block text-sm font-medium text-gray-700">
                POHODA mServer URL *
              </label>
              <input
                type="url"
                id="pohoda_url"
                name="pohoda_url"
                value={formData.pohoda_url}
                onChange={handleInputChange}
                placeholder="http://localhost:8080"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required={formData.pohoda_enabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pohoda_username" className="block text-sm font-medium text-gray-700">
                  Používateľské meno *
                </label>
                <input
                  type="text"
                  id="pohoda_username"
                  name="pohoda_username"
                  value={formData.pohoda_username}
                  onChange={handleInputChange}
                  placeholder="admin"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required={formData.pohoda_enabled}
                />
              </div>

              <div>
                <label htmlFor="pohoda_password" className="block text-sm font-medium text-gray-700">
                  Heslo *
                </label>
                <input
                  type="password"
                  id="pohoda_password"
                  name="pohoda_password"
                  value={formData.pohoda_password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required={formData.pohoda_enabled}
                />
              </div>
            </div>

            <div>
              <label htmlFor="pohoda_ico" className="block text-sm font-medium text-gray-700">
                IČO firmy v POHODA *
              </label>
              <input
                type="text"
                id="pohoda_ico"
                name="pohoda_ico"
                value={formData.pohoda_ico}
                onChange={handleInputChange}
                placeholder="12345678"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required={formData.pohoda_enabled}
              />
            </div>

            <div>
              <label htmlFor="pohoda_year" className="block text-sm font-medium text-gray-700">
                Rok firmy v POHODA (IČO_ROK) *
              </label>
              <input
                type="text"
                id="pohoda_year"
                name="pohoda_year"
                value={formData.pohoda_year}
                onChange={handleInputChange}
                placeholder="2024"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required={formData.pohoda_enabled}
              />
              <p className="mt-1 text-sm text-gray-500">
                Ak máte viacero firiem s rovnakým IČO, zadajte rok (napr. 2024 pre IČO_2024)
              </p>
            </div>
          </div>



                  {/* POHODA Nastavenia - mServer */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            POHODA Nastavenia - mServer
          </h3>
          
          {!formData.pohoda_enabled && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                Pre použitie mServer integrácie najprv povolte POHODA integráciu vyššie.
              </p>
            </div>
          )}
            
                          <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-800 mb-2">Testovanie mServer spojenia</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Testujte pripojenie k POHODA mServer pre automatickú synchronizáciu faktúr.
                  </p>
                  
                  <div className="space-y-2">
                    <button type="button" onClick={handleTestConnection} disabled={!formData.pohoda_enabled || !canTestConnection()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Testujem...
                        </>
                      ) : (
                        'Testovať spojenie'
                      )}
                    </button>
                    <button type="button" onClick={handleTestInvoices} disabled={!formData.pohoda_enabled || !canTestConnection()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Testujem faktúry...
                        </>
                      ) : (
                        'Testovať faktúry'
                      )}
                    </button>
                    <button type="button" onClick={handleSyncInvoices} disabled={!formData.pohoda_enabled || !canTestConnection()} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Synchronizujem...
                        </>
                      ) : (
                        'Synchronizovať faktúry'
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div className={`flex items-center p-3 rounded-md mt-3 ${
                      testResult.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      {testResult.success ? (
                        <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                      )}
                      <span className={`text-sm ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.message}
                      </span>
                    </div>
                  )}
                </div>

                {/* Synchronizácia */}
                {formData.pohoda_enabled && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">Automatická synchronizácia</h4>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="auto_sync"
                        name="auto_sync"
                        checked={formData.auto_sync}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto_sync" className="ml-2 block text-sm text-gray-900">
                        Automatická synchronizácia
                      </label>
                    </div>

                    {formData.auto_sync && (
                      <div>
                        <label htmlFor="sync_frequency" className="block text-sm font-medium text-gray-700">
                          Frekvencia synchronizácie
                        </label>
                        <select
                          id="sync_frequency"
                          name="sync_frequency"
                          value={formData.sync_frequency}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="hourly">Každú hodinu</option>
                          <option value="daily">Denne</option>
                          <option value="weekly">Týždenne</option>
                          <option value="manual">Manuálne</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

        {/* POHODA Nastavenia - XML */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            POHODA Nastavenia - XML
          </h3>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="text-md font-medium text-yellow-800 mb-2">XML Import/Export</h4>
            <p className="text-sm text-yellow-700">
              Manuálny import/export faktúr cez XML súbory. Funguje s demo aj plnou verziou POHODA.
            </p>
          </div>
          
          <PohodaXmlImportExport companyId={companyId} />
        </div>

          {/* Tlačidlá */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Ukladám...' : 'Uložiť nastavenia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PohodaSettingsModal;
