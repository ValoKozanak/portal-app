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
        <h3 className="mt-2 text-sm font-medium text-gray-900">L?iadne firmy</h3>
        <p className="mt-1 text-sm text-gray-500">
          Zatia?l ste nepridali Lliadne firmy.
        </p>
        <div className="mt-6">
          <button
            onClick={onAddCompany}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            PridaLA prvAs firmu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          VaL?e firmy ({companies.length})
        </h3>
        <button
          onClick={onAddCompany}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="-ml-0.5 mr-1 h-4 w-4" />
          PridaLA firmu
        </button>
      </div>

      <div className="space-y-3">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {company.name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>I?SO: {company.ico}</span>
                        <span>OR: {company.business_registry || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <p className="truncate">{company.address}</p>
                    <p className="truncate">OprA?vnenA? osoba: {company.authorized_person}</p>
                  </div>

                  {/* KontaktnA? Asdaje */}
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
                      title="OtvoriLA Dashboard"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpanded(company.id)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {expandedCompany === company.id ? 'SkryLA' : 'ZobraziLA viac'}
                  </button>
                  <button
                    onClick={() => onEditCompany(company)}
                    className="text-gray-400 hover:text-gray-600"
                    title="UpraviLA firmu"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDeleteCompany(company.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="VymazaLA firmu"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* RozL?A?renA? informA?cie */}
              {expandedCompany === company.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">ZA?kladnA? Asdaje</h5>
                      <div className="space-y-1 text-gray-600">
                        <p><span className="font-medium">NA?zov:</span> {company.name}</p>
                        <p><span className="font-medium">I?SO:</span> {company.ico}</p>
                        <p><span className="font-medium">OR:</span> {company.business_registry || 'N/A'}</p>
                        <p><span className="font-medium">Adresa:</span> {company.address}</p>
                        <p><span className="font-medium">OprA?vnenA? osoba:</span> {company.authorized_person}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">DaL?ovA? Asdaje</h5>
                      <div className="space-y-1 text-gray-600">
                        {company.vat_id && (
                          <p><span className="font-medium">I?S DPH:</span> {company.vat_id}</p>
                        )}
                        {company.tax_id && (
                          <p><span className="font-medium">DI?S:</span> {company.tax_id}</p>
                        )}
                      </div>
                      
                      <h5 className="font-medium text-gray-900 mb-2 mt-4">KontaktnA? Asdaje</h5>
                      <div className="space-y-1 text-gray-600">
                        {company.contact_phone && (
                          <p><span className="font-medium">TelefAln:</span> {company.contact_phone}</p>
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

