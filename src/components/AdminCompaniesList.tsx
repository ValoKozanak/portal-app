import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  TrashIcon, 
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { Company } from '../services/apiService';

interface AdminCompaniesListProps {
  companies: Company[];
  onDeactivateCompany: (companyId: number) => void;
  onActivateCompany: (companyId: number) => void;
  onOpenDashboard?: (company: Company) => void;
  onEditCompany?: (company: Company) => void;
  showInactive?: boolean;
}

const AdminCompaniesList: React.FC<AdminCompaniesListProps> = ({
  companies,
  onDeactivateCompany,
  onActivateCompany,
  onOpenDashboard,
  onEditCompany,
  showInactive = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);

  const toggleExpanded = (companyId: number) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ico.includes(searchTerm) ||
    company.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne firmy</h3>
        <p className="mt-1 text-sm text-gray-500">
          Zatiaľ neboli vytvorené žiadne firmy na portáli.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Všetky firmy na portáli ({companies.length})
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Hľadať firmy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-3">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className={`h-8 w-8 ${company.status === 'active' ? 'text-primary-600' : 'text-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {company.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          company.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {company.status === 'active' ? 'Aktívna' : 'Neaktívna'}
                        </span>
                      </div>
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

                  {/* Vlastník firmy */}
                  <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                    <UserIcon className="h-4 w-4" />
                    <span>Vlastník: {company.owner_email}</span>
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

                  <div className="mt-2 text-xs text-gray-400">
                    Vytvorené: {company.created_at}
                                    {company.assignedToAccountants && company.assignedToAccountants.length > 0 && (
                  <div className="mt-1">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Priradené účtovníkom: {company.assignedToAccountants.length} účtovníkov
                    </span>
                    <div className="mt-1 text-xs text-gray-600">
                      {company.assignedToAccountants.join(', ')}
                    </div>
                  </div>
                )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {onOpenDashboard && company.status === 'active' && (
                    <button
                      onClick={() => onOpenDashboard(company)}
                      className="text-green-600 hover:text-green-700"
                      title="Otvoriť Dashboard"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                  )}
                  {onEditCompany && (
                    <button
                      onClick={() => onEditCompany(company)}
                      className="text-primary-600 hover:text-primary-700"
                      title="Upraviť firmu"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpanded(company.id)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {expandedCompany === company.id ? 'Skryť' : 'Zobraziť viac'}
                  </button>
                  {company.status === 'active' ? (
                    <button
                      onClick={() => onDeactivateCompany(company.id)}
                      className="text-orange-600 hover:text-orange-700"
                      title="Deaktivovať firmu"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivateCompany(company.id)}
                      className="text-green-600 hover:text-green-700"
                      title="Aktivovať firmu"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
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

export default AdminCompaniesList;
