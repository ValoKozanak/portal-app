import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  CloudIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import DropboxAdminPanel from '../components/DropboxAdminPanel';
import { apiService, Company } from '../services/apiService';

interface AdminDropboxPageProps {
  onBack: () => void;
}

const AdminDropboxPage: React.FC<AdminDropboxPageProps> = ({ onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDropboxPanel, setShowDropboxPanel] = useState(false);

  // Načítanie firiem
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const companiesData = await apiService.getAllCompaniesForAdmin();
        setCompanies(companiesData);
      } catch (error) {
        console.error('Chyba pri načítaní firiem:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  // Filtrovanie firiem
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Otvorenie Dropbox panelu pre firmu
  const handleOpenDropboxPanel = (company: Company) => {
    setSelectedCompany(company);
    setShowDropboxPanel(true);
  };

  // Zatvorenie Dropbox panelu
  const handleCloseDropboxPanel = () => {
    setShowDropboxPanel(false);
    setSelectedCompany(null);
  };

  // Štatistiky
  const stats = {
    total: companies.length,
    shared: companies.filter(c => c.hasDropbox).length,
    notShared: companies.filter(c => !c.hasDropbox).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Späť do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <CloudIcon className="h-8 w-8 text-blue-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Dropbox správa</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Štatistiky */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Celkovo firiem</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Zdieľané</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shared}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <XMarkIcon className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Nezdieľané</p>
                <p className="text-2xl font-bold text-gray-900">{stats.notShared}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam firiem</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Vyberte firmu pre správu Dropbox nastavení
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Vyhľadať firmu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam firmy...</p>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                  <div 
                    key={company.id} 
                    className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                    onClick={() => handleOpenDropboxPanel(company)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.name}</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                            <span>IČO: {company.ico}</span>
                          </div>
                          <div className="flex items-center">
                            <span>Email: {company.email || company.owner_email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {company.hasDropbox ? (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Zdieľané
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                            <XMarkIcon className="h-3 w-3 mr-1" />
                            Nezdieľané
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Správa Dropbox
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CloudIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm ? 'Žiadne firmy nenájdené' : 'Žiadne firmy'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Skúste zmeniť vyhľadávací výraz.'
                    : 'Zatiaľ neboli vytvorené žiadne firmy.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dropbox Admin Panel Modal */}
      {showDropboxPanel && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <CloudIcon className="h-6 w-6 text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Dropbox správa - {selectedCompany.name}
                </h2>
              </div>
              <button
                onClick={handleCloseDropboxPanel}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                             <DropboxAdminPanel 
                 companies={selectedCompany ? [selectedCompany] : []}
                 userEmail="admin@portal.sk"
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDropboxPage;
