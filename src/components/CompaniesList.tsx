import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Company } from '../services/apiService';

interface CompaniesListProps {
  companies: Company[];
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (companyId: number) => void;
  onOpenDashboard?: (company: Company) => void;
}

const CompaniesList: React.FC<CompaniesListProps> = ({
  companies,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  onOpenDashboard
}) => {
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);

  const toggleExpanded = (companyId: number) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne firmy</h3>
        <p className="mt-1 text-sm text-gray-500">
          Zatiaľ ste nepridali žiadne firmy.
        </p>
        <div className="mt-6">
          <button
            onClick={onAddCompany}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Pridať prvú firmu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Vaše firmy ({companies.length})
        </h3>
        <button
          onClick={onAddCompany}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" />
          Pridať firmu
        </button>
      </div>

      <div className="space-y-3">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {company.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>IČO: {company.ico}</span>
                        <span>OR: {company.business_registry || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <p className="truncate">{company.address}</p>
                    <p className="truncate">Oprávnená osoba: {company.authorized_person}</p>
                  </div>

                  {/* Kontaktné údaje */}
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    {company.contact_phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        <span>{company.contact_phone}</span>
                      </div>
                    )}
                    {company.contact_email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        <span>{company.contact_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onOpenDashboard && (
                    <button
                      onClick={() => onOpenDashboard(company)}
                      className="text-green-600 hover:text-green-700"
                      title="Otvoriť Dashboard"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpanded(company.id)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {expandedCompany === company.id ? 'Skryť' : 'Zobraziť viac'}
                  </button>
                  <button
                    onClick={() => onEditCompany(company)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Upraviť firmu"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDeleteCompany(company.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Vymazať firmu"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Rozšírené informácie */}
              {expandedCompany === company.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Základné údaje</h5>
                      <div className="space-y-1 text-gray-600">
                        <p><span className="font-medium">Názov:</span> {company.name}</p>
                        <p><span className="font-medium">IČO:</span> {company.ico}</p>
                        <p><span className="font-medium">OR:</span> {company.business_registry || 'N/A'}</p>
                        <p><span className="font-medium">Adresa:</span> {company.address}</p>
                        <p><span className="font-medium">Oprávnená osoba:</span> {company.authorized_person}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Daňové údaje</h5>
                      <div className="space-y-1 text-gray-600">
                        {company.vat_id && (
                          <p><span className="font-medium">IČ DPH:</span> {company.vat_id}</p>
                        )}
                        {company.tax_id && (
                          <p><span className="font-medium">DIČ:</span> {company.tax_id}</p>
                        )}
                      </div>
                      
                      <h5 className="font-medium text-gray-900 mb-2 mt-4">Kontaktné údaje</h5>
                      <div className="space-y-1 text-gray-600">
                        {company.contact_phone && (
                          <p><span className="font-medium">Telefón:</span> {company.contact_phone}</p>
                        )}
                        {company.contact_email && (
                          <p><span className="font-medium">Email:</span> {company.contact_email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompaniesList;
