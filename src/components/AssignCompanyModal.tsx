import React, { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOfficeIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Company } from '../services/apiService';

interface Accountant {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AssignCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (companyId: number, accountantEmails: string[]) => void;
  companies: Company[];
  accountants: Accountant[];
}

const AssignCompanyModal: React.FC<AssignCompanyModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  companies,
  accountants
}) => {
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedAccountants, setSelectedAccountants] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCompany(null);
      setSelectedAccountants([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany || selectedAccountants.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onAssign(selectedCompany, selectedAccountants);
      onClose();
    } catch (error) {
      console.error('Chyba pri priradení firmy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ico.includes(searchTerm) ||
    company.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Zobrazujeme všetky firmy, nie len tie bez priradených účtovníkov
  const availableCompanies = filteredCompanies;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Pridať účtovníkov k firme</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informácia o many-to-many vzťahu */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Many-to-Many vzťah:</strong> Účtovník môže mať viacero firiem a firma môže mať viacero účtovníkov
            </p>
          </div>

          {/* Výber účtovníkov */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vyberte účtovníkov *
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
              {accountants.map((accountant) => (
                <label key={accountant.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    value={accountant.email}
                    checked={selectedAccountants.includes(accountant.email)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAccountants(prev => [...prev, accountant.email]);
                      } else {
                        setSelectedAccountants(prev => prev.filter(email => email !== accountant.email));
                      }
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{accountant.name}</div>
                    <div className="text-sm text-gray-500">{accountant.email}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedAccountants.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Vybraní účtovníci: {selectedAccountants.length}
              </div>
            )}
          </div>

          {/* Vyhľadávanie firiem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vyberte firmu na priradenie
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Hľadať firmy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <BuildingOfficeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Zoznam firiem */}
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {availableCompanies.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {availableCompanies.map((company) => (
                  <div
                    key={company.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCompany === company.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                    onClick={() => setSelectedCompany(company.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="selectedCompany"
                            value={company.id}
                            checked={selectedCompany === company.id}
                            onChange={() => setSelectedCompany(company.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-600">IČO: {company.ico} | OR: {company.business_registry || 'N/A'}</p>
                            <p className="text-sm text-gray-600">Vlastník: {company.owner_email}</p>
                            {company.assignedToAccountants && company.assignedToAccountants.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-green-600 font-medium">
                                  Už priradení účtovníci: {company.assignedToAccountants.length}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {company.assignedToAccountants.join(', ')}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedCompany === company.id && (
                        <CheckIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Žiadne firmy nenájdené' : 'Žiadne firmy na portáli'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Skúste zmeniť vyhľadávací výraz' 
                    : 'Na portáli nie sú žiadne firmy na priradenie'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Informácie o vybranej firme */}
          {selectedCompany && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Vybraná firma:</h4>
              {(() => {
                const company = companies.find(c => c.id === selectedCompany);
                return company ? (
                  <div className="text-sm text-blue-800">
                    <p><strong>{company.name}</strong></p>
                    <p>IČO: {company.ico} | OR: {company.business_registry || 'N/A'}</p>
                    <p>Vlastník: {company.owner_email}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Tlačidlá */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={!selectedCompany || selectedAccountants.length === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Priraďujem...' : `Pridať účtovníkov (${selectedAccountants.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCompanyModal;
