import React, { useState, useEffect, Suspense } from 'react';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import EditCompanyModal from '../components/EditCompanyModal';
import AssignCompanyModal from '../components/AssignCompanyModal';
import { apiService, Company } from '../services/apiService';

// Lazy loading pre CompanyDashboard
const CompanyDashboard = React.lazy(() => import('../components/CompanyDashboard'));

interface AdminCompaniesPageProps {
  onBack: () => void;
}

const AdminCompaniesPage: React.FC<AdminCompaniesPageProps> = ({ onBack }) => {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [inactiveCompanies, setInactiveCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactiveCompanies, setShowInactiveCompanies] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<Company | null>(null);
  const [selectedCompanyForDashboard, setSelectedCompanyForDashboard] = useState<Company | null>(null);
  const [showAssignCompanyModal, setShowAssignCompanyModal] = useState(false);
  const [allAccountants, setAllAccountants] = useState<any[]>([]);

  // Načítanie firiem a účtovníkov z API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Najprv načítame firmy
        const companiesData = await apiService.getAllCompanies();
        console.log('Všetky firmy z API:', companiesData);
        console.log('Statusy firiem:', companiesData.map(c => ({ name: c.name, status: c.status })));
        
        const activeCompanies = companiesData.filter(company => company.status === 'active' || !company.status || company.status === null);
        const inactiveCompaniesData = companiesData.filter(company => company.status === 'inactive');
        
        console.log('Aktívne firmy:', activeCompanies);
        console.log('Neaktívne firmy:', inactiveCompaniesData);
        
        setAllCompanies(activeCompanies);
        setInactiveCompanies(inactiveCompaniesData);
        
        // Potom skúsime načítať účtovníkov (môže zlyhať)
        try {
          const accountantsData = await apiService.getAllAccountants();
          setAllAccountants(accountantsData);
        } catch (accountantsError) {
          console.warn('Nepodarilo sa načítať účtovníkov:', accountantsError);
          setAllAccountants([]);
        }
      } catch (error) {
        console.error('Chyba pri načítaní dát:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrovanie firiem podľa vyhľadávania
  const filteredActiveCompanies = allCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInactiveCompanies = inactiveCompanies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Vymazanie firmy
  const handleDeleteCompany = async (companyId: number) => {
    if (window.confirm('Naozaj chcete vymazať túto firmu?')) {
      try {
        await apiService.deleteCompany(companyId);
        setAllCompanies(prev => prev.filter(company => company.id !== companyId));
        setInactiveCompanies(prev => prev.filter(company => company.id !== companyId));
      } catch (error) {
        console.error('Chyba pri mazaní firmy:', error);
        alert('Chyba pri mazaní firmy');
      }
    }
  };

  // Deaktivácia firmy
  const handleDeactivateCompany = async (companyId: number) => {
    try {
      await apiService.deactivateCompany(companyId);
      const deactivatedCompany = allCompanies.find(company => company.id === companyId);
      if (deactivatedCompany) {
        setAllCompanies(prev => prev.filter(company => company.id !== companyId));
        setInactiveCompanies(prev => [...prev, { ...deactivatedCompany, status: 'inactive' }]);
      }
    } catch (error) {
      console.error('Chyba pri deaktivácii firmy:', error);
      alert('Chyba pri deaktivácii firmy');
    }
  };

  // Aktivácia firmy
  const handleActivateCompany = async (companyId: number) => {
    try {
      await apiService.activateCompany(companyId);
      const activatedCompany = inactiveCompanies.find(company => company.id === companyId);
      if (activatedCompany) {
        setInactiveCompanies(prev => prev.filter(company => company.id !== companyId));
        setAllCompanies(prev => [...prev, { ...activatedCompany, status: 'active' }]);
      }
    } catch (error) {
      console.error('Chyba pri aktivácii firmy:', error);
      alert('Chyba pri aktivácii firmy');
    }
  };

  // Priradenie účtovníkov k firme
  const handleAssignAccountants = async (companyId: number, accountantEmails: string[]) => {
    try {
      await apiService.assignAccountantsToCompany(companyId, accountantEmails);
      // Refresh companies data
      const companiesData = await apiService.getAllCompanies();
      const activeCompanies = companiesData.filter(company => company.status === 'active');
      const inactiveCompaniesData = companiesData.filter(company => company.status === 'inactive');
      
      setAllCompanies(activeCompanies);
      setInactiveCompanies(inactiveCompaniesData);
    } catch (error) {
      console.error('Chyba pri priradení účtovníkov:', error);
      alert('Chyba pri priradení účtovníkov');
    }
  };

  // Úprava firmy
  const handleEditCompany = async (companyId: number, companyData: any) => {
    try {
      await apiService.updateCompany(companyId, companyData);
      setAllCompanies(prev => prev.map(company => 
        company.id === companyId ? { ...company, ...companyData } : company
      ));
      setInactiveCompanies(prev => prev.map(company => 
        company.id === companyId ? { ...company, ...companyData } : company
      ));
      setShowEditCompanyModal(false);
      setSelectedCompanyForEdit(null);
    } catch (error: any) {
      console.error('Chyba pri aktualizácii firmy:', error.message);
      alert(`Chyba pri aktualizácii firmy: ${error.message}`);
    }
  };

  // Otvorenie modálu pre úpravu
  const handleOpenEditCompany = (company: Company) => {
    setSelectedCompanyForEdit(company);
    setShowEditCompanyModal(true);
  };

  // Otvorenie dashboardu firmy
  const handleOpenCompanyDashboard = (company: Company) => {
    setSelectedCompanyForDashboard(company);
  };

  // Zatvorenie dashboardu firmy
  const handleCloseCompanyDashboard = () => {
    setSelectedCompanyForDashboard(null);
  };

  // Helper funkcie pre badge
  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    };
    const labels = {
      active: 'Aktívna',
      inactive: 'Neaktívna'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // Conditional rendering pre dashboard firmy
  if (selectedCompanyForDashboard) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <CompanyDashboard 
          company={selectedCompanyForDashboard}
          onClose={handleCloseCompanyDashboard}
          userEmail="admin@portal.sk"
          userRole="admin"
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
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Späť do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-8 w-8 text-purple-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Správa firiem</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAssignCompanyModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Priradiť účtovníkov
              </button>
              <button
                onClick={() => setShowInactiveCompanies(!showInactiveCompanies)}
                className={`px-4 py-2 rounded-md flex items-center transition-colors ${
                  showInactiveCompanies 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showInactiveCompanies ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Zobraziť aktívne
                  </>
                ) : (
                  <>
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Zobraziť neaktívne
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {showInactiveCompanies ? 'Neaktívne firmy' : 'Aktívne firmy'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {showInactiveCompanies 
                    ? `Celkovo ${inactiveCompanies.length} neaktívnych firiem`
                    : `Celkovo ${allCompanies.length} aktívnych firiem`
                  }
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam firmy...</p>
              </div>
            ) : (showInactiveCompanies ? filteredInactiveCompanies : filteredActiveCompanies).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(showInactiveCompanies ? filteredInactiveCompanies : filteredActiveCompanies).map((company) => (
                  <div 
                    key={company.id} 
                    className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                    onClick={() => handleOpenCompanyDashboard(company)}
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
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            <span>{company.email || company.owner_email}</span>
                          </div>
                          {company.contact_phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-2" />
                              <span>{company.contact_phone}</span>
                            </div>
                          )}
                          <div className="flex items-start">
                            <UserIcon className="h-4 w-4 mr-2 mt-0.5" />
                            <span className="text-xs">{company.authorized_person}</span>
                          </div>
                          {company.assignedToAccountants && company.assignedToAccountants.length > 0 && (
                            <div className="flex items-start">
                              <UserIcon className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                              <span className="text-xs text-green-600">
                                Účtovníci: {company.assignedToAccountants.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(company.status)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAssignCompanyModal(true);
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                        >
                          <UserIcon className="h-4 w-4 mr-1" />
                          Priradiť účtovníkov
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCompany(company);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Upraviť
                        </button>
                        {company.status === 'active' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivateCompany(company.id);
                            }}
                            className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Deaktivovať
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivateCompany(company.id);
                            }}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Aktivovať
                          </button>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm 
                    ? 'Žiadne firmy nenájdené' 
                    : showInactiveCompanies 
                      ? 'Žiadne neaktívne firmy' 
                      : 'Žiadne aktívne firmy'
                  }
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Skúste zmeniť vyhľadávací výraz.'
                    : showInactiveCompanies
                      ? 'Všetky firmy sú aktívne.'
                      : 'Zatiaľ neboli vytvorené žiadne firmy.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditCompanyModal
        isOpen={showEditCompanyModal}
        onClose={() => {
          setShowEditCompanyModal(false);
          setSelectedCompanyForEdit(null);
        }}
        onSave={(companyId, companyData) => selectedCompanyForEdit && handleEditCompany(selectedCompanyForEdit.id, companyData)}
        company={selectedCompanyForEdit}
      />
      
      <AssignCompanyModal
        isOpen={showAssignCompanyModal}
        onClose={() => setShowAssignCompanyModal(false)}
        onAssign={handleAssignAccountants}
        companies={[...allCompanies, ...inactiveCompanies]}
        accountants={allAccountants}
      />
    </div>
  );
};

export default AdminCompaniesPage;
