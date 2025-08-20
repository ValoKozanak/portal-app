import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, BuildingOfficeIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Company, apiService } from '../services/apiService';

// Lazy loading pre CompanyDashboard aby sme predišli cirkulárnej závislosti
const AccountantCompanyDashboardPage = React.lazy(() => import('./AccountantCompanyDashboardPage'));

interface AccountantCompaniesPageProps {
  userEmail: string;
  onBack: () => void;
}

const AccountantCompaniesPage: React.FC<AccountantCompaniesPageProps> = ({ userEmail, onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompanyDashboard, setShowCompanyDashboard] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadAccountantData();
  }, [userEmail]);

  const loadAccountantData = async () => {
    try {
      const assignedCompanies = await apiService.getAccountantCompanies(userEmail);
      setCompanies(assignedCompanies);
    } catch (error) {
      console.error('Chyba pri načítaní dát účtovníka:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleOpenCompanyDashboard = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyDashboard(true);
  };

  const handleBackFromCompanyDashboard = () => {
    setShowCompanyDashboard(false);
    setSelectedCompany(null);
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ico.includes(searchTerm) ||
    company.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show company dashboard page if selected
  if (showCompanyDashboard && selectedCompany) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Načítavam dashboard firmy...</p>
          </div>
        </div>
      }>
        <AccountantCompanyDashboardPage
          company={selectedCompany}
          userEmail={userEmail}
          onBack={handleBackFromCompanyDashboard}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="font-medium">Späť do Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Prihlásený ako</p>
                <p className="font-medium text-gray-900">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Priradené firmy</h1>
          <p className="text-gray-600 mt-2">
            Celkovo {companies.length} priradených firiem
          </p>
        </div>

        {/* Companies Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Správa firiem</h2>
          </div>

          <div className="p-6">
            {/* Search */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Hľadať firmy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {loadingCompanies ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam firmy...</p>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <div 
                    key={company.id} 
                    className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-100 hover:scale-[1.02] border border-transparent hover:border-gray-300"
                    onClick={() => handleOpenCompanyDashboard(company)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">IČO: {company.ico}</p>
                        <p className="text-sm text-gray-500 mb-2">Vlastník: {company.owner_email}</p>
                        <p className="text-sm text-gray-500">{company.address}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="p-2 text-primary-600">
                          <ChartBarIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Vytvorené: {new Date(company.created_at).toLocaleDateString('sk-SK')}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Priradené
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'Žiadne firmy nenájdené' : 'Žiadne priradené firmy'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Skúste zmeniť vyhľadávací výraz' 
                    : 'Admin vám zatiaľ nepriradil žiadne firmy'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantCompaniesPage;
