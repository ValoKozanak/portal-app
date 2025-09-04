import React, { useState, useEffect, useCallback } from 'react';
import { 
  UsersIcon, 
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PlusIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import EditProfileModal from '../components/EditProfileModal';
import CompanyModal from '../components/CompanyModal';
import CompanyDashboard from '../components/CompanyDashboard';
import { Task } from '../components/TaskModal';
import UserTasksPage from './UserTasksPage';
import UserMessagesPage from './UserMessagesPage';
import UserEmployeesPage from './UserEmployeesPage';
import { apiService, Company } from '../services/apiService';
import { hrService } from '../services/hrService';

// Helper funkcia pre lokálne formátovanie dátumu
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DashboardProps {
  userEmail?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userEmail = 'user@portal.sk' }) => {
  const [userProfile, setUserProfile] = useState({
    name: 'Používateľ',
    email: userEmail,
    phone: '+421 123 456 789',
    bio: 'Aktívny používateľ portálu s záujmom o dokumenty a úlohy.'
  });

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showTasksPage, setShowTasksPage] = useState(false);
  const [showMessagesPage, setShowMessagesPage] = useState(false);
  const [showEmployeesPage, setShowEmployeesPage] = useState(false);
  const [employeesCount, setEmployeesCount] = useState({ working: 0, notWorking: 0, total: 0 });

  // Načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = useCallback(async () => {
    try {
      const count = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
    }
  }, [userEmail]);

  // Načítanie počtu zamestnancov
  const loadEmployeesCount = useCallback(async () => {
    try {
      const userCompanies = await apiService.getUserCompanies(userEmail);
      let totalWorking = 0;
      let totalNotWorking = 0;
      let totalEmployees = 0;

      for (const company of userCompanies) {
        try {
          const employees = await hrService.getEmployees(company.id);
          totalEmployees += employees.length;
          
          // Načítanie dochádzky a dovoleniek pre každého zamestnanca
          const today = formatDate(new Date());
          
          for (const employee of employees) {
            try {
              const [attendance, leaveRequests] = await Promise.all([
                hrService.getAttendance(company.id, employee.id),
                hrService.getLeaveRequests(company.id)
              ]);
              
              const employeeAttendance = attendance.filter(att => att.employee_id === employee.id);
              const employeeLeaveRequests = leaveRequests.filter(leave => leave.employee_id === employee.id);
              
              // Používame rovnakú logiku ako v UserEmployeesPage
              // Najprv kontrolujeme status zamestnania z databázy
              if (employee.status === 'terminated' || employee.status === 'inactive') {
                totalNotWorking++;
              } else if (employee.status === 'on_leave') {
                totalNotWorking++;
              } else {
                // Kontrola dochádzky na dnešný deň
                const todayAttendance = employeeAttendance.find(att => att.date === today);
                
                if (todayAttendance && todayAttendance.status === 'present') {
                  totalWorking++;
                } else {
                  // Kontrola dovoleniek
                  const activeLeave = employeeLeaveRequests.find(leave => 
                    leave.status === 'approved' && 
                    leave.start_date <= today && 
                    leave.end_date >= today
                  );
                  
                  if (!activeLeave) {
                    totalNotWorking++;
                  }
                }
              }
            } catch (error) {
              console.error(`Chyba pri načítaní detailov pre zamestnanca ${employee.id}:`, error);
              // Ak sa nepodarí načítať údaje, považujeme za neprítomného
              totalNotWorking++;
            }
          }
        } catch (error) {
          console.error(`Chyba pri načítaní zamestnancov pre firmu ${company.id}:`, error);
        }
      }

      setEmployeesCount({ working: totalWorking, notWorking: totalNotWorking, total: totalEmployees });
    } catch (error) {
      console.error('Chyba pri načítaní počtu zamestnancov:', error);
    }
  }, [userEmail]);

  useEffect(() => {
    loadUnreadMessagesCount();
    loadEmployeesCount();
  }, [loadUnreadMessagesCount, loadEmployeesCount]);

  // Načítanie úloh používateľa
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const apiTasks = await apiService.getUserTasks(userEmail);
        
        // Konvertujeme API Task na TaskModal Task
        const convertedTasks: Task[] = apiTasks.map(apiTask => ({
          id: apiTask.id.toString(),
          title: apiTask.title,
          description: apiTask.description || '',
          status: apiTask.status,
          priority: apiTask.priority,
          assignedTo: apiTask.assigned_to,
          dueDate: apiTask.due_date || '',
          createdAt: apiTask.created_at,
          createdBy: apiTask.created_by,
          category: 'other', // Default kategória
        }));
        
        setTasks(convertedTasks);
      } catch (error) {
        console.error('Chyba pri načítaní úloh:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, [userEmail]);





  // Načítanie firiem z API
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const userCompanies = await apiService.getUserCompanies(userEmail);
        setCompanies(userCompanies);
      } catch (error) {
        console.error('Chyba pri načítaní firiem:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [userEmail]);

  // Po načítaní firiem automaticky otvoríme dashboard vybranej firmy (ak je uložená v localStorage)
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('selectedCompanyId');
      if (savedId && companies.length > 0 && !selectedCompany) {
        const company = companies.find(c => c.id === Number(savedId));
        if (company) {
          setSelectedCompany(company);
        }
      }
    } catch (e) {
      // ignorovať chybu pri localStorage
    }
  }, [companies, selectedCompany]);

  const handleSaveProfile = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
    console.log('Profil bol aktualizovaný:', updatedProfile);
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setIsEditingCompany(false);
    setShowCompanyModal(true);
  };

  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    setIsEditingCompany(true);
    setShowCompanyModal(true);
  };



  const handleSaveCompany = async (company: any) => {
    try {
      if (isEditingCompany) {
        // Aktualizácia existujúcej firmy
        await apiService.updateCompany(company.id, company);
        setCompanies((prev: Company[]) => prev.map((c: Company) => c.id === company.id ? company : c));
      } else {
        // Vytvorenie novej firmy
        const companyData = {
          ...company,
          owner_email: userEmail,
          status: 'active'
        };
        
        // Kontrola povinných polí
        if (!companyData.name || !companyData.ico || !companyData.address || !companyData.authorized_person) {
          alert('Chýbajú povinné údaje: názov firmy, IČO, adresa alebo oprávnená osoba');
          return;
        }
        
        console.log('Vytváram firmu s dátami:', companyData);
        const response = await apiService.createCompany(companyData);
        console.log('Odpoveď z API:', response);
        const newCompany = { ...company, id: response.companyId, owner_email: userEmail, status: 'active' };
        setCompanies((prev: Company[]) => [...prev, newCompany]);
        setShowCompanyModal(false);
        setEditingCompany(null);
        setIsEditingCompany(false);
      }
    } catch (error) {
      console.error('Chyba pri ukladaní firmy:', error);
      alert('Chyba pri ukladaní firmy: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };



  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleBackToCompanySelection = () => {
    setSelectedCompany(null);
  };

  // Ak je vybraná firma, zobrazíme dashboard firmy
  if (selectedCompany) {
    return (
      <CompanyDashboard
        company={selectedCompany}
        onClose={handleBackToCompanySelection}
        userEmail={userEmail}
        userRole="company"
      />
    );
  }

  // Ak je zobrazená stránka úloh, zobrazíme ju
  if (showTasksPage) {
    return (
      <UserTasksPage
        userEmail={userEmail}
        onBack={() => setShowTasksPage(false)}
      />
    );
  }

  // Ak je zobrazená stránka správ, zobrazíme ju
  if (showMessagesPage) {
    return (
      <UserMessagesPage
        userEmail={userEmail}
        onBack={() => setShowMessagesPage(false)}
      />
    );
  }

  // Ak je zobrazená stránka zamestnancov, zobrazíme ju
  if (showEmployeesPage) {
    return (
      <UserEmployeesPage
        userEmail={userEmail}
        onBack={() => setShowEmployeesPage(false)}
      />
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Váš Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Vyberte si firmu pre prácu</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Prihlásený ako: {userProfile.name} ({userEmail})</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
          >
            Upraviť profil
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
         </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vaše firmy</p>
              <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                </div>
                </div>
              </div>

        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowEmployeesPage(true)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Zamestnanci</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-green-600">{employeesCount.working}</p>
                <span className="text-sm text-gray-500">/</span>
                <p className="text-2xl font-bold text-red-600">{employeesCount.notWorking}</p>
              </div>
              <p className="text-sm text-gray-500">{employeesCount.total} celkovo</p>
            </div>
          </div>
        </div>

        

        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowMessagesPage(true)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Neprečítané správy</p>
              <p className="text-2xl font-bold text-gray-900">{unreadMessagesCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktívne firmy</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowTasksPage(true)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vaše úlohy</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              <p className="text-sm text-gray-500">{tasks.filter(t => t.status === 'pending').length} čakajúcich</p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Selection */}
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-900">Vaše firmy</h2>
          <p className="text-sm text-gray-600 mt-1">Vyberte firmu, s ktorou chcete pracovať</p>
           </div>
           <div className="p-6">
          {loading ? (
               <div className="text-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Načítavam vaše firmy...</p>
               </div>
          ) : companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <div 
                  key={company.id} 
                  className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary-300"
                  onClick={() => handleSelectCompany(company)}
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
                        {company.address && (
                          <div className="flex items-start">
                            <UserIcon className="h-4 w-4 mr-2 mt-0.5" />
                            <span className="text-xs">{company.address}</span>
                 </div>
               )}
           </div>
         </div>
                    <div className="flex flex-col items-end space-y-2">
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status === 'active' ? 'Aktívna' : 'Neaktívna'}
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                       <div className="flex space-x-2">
                 <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleEditCompany(company);
                         }}
                         className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                       >
                         Upraviť
                 </button>
                     </div>
                    <div className="flex items-center text-primary-600">
                      <span className="text-sm font-medium mr-1">Vybrať firmu</span>
                      <ArrowRightIcon className="h-4 w-4" />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Nemáte žiadne firmy</h3>
              <p className="mt-2 text-sm text-gray-500 mb-6">
                Pre prácu v portáli potrebujete vytvoriť aspoň jednu firmu.
              </p>
              <button
                onClick={handleAddCompany}
                className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 flex items-center mx-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Pridať prvú firmu
              </button>
            </div>
          )}
          
          {companies.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleAddCompany}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Pridať ďalšiu firmu
              </button>
               </div>
             )}
           </div>
         </div>

       {/* User Profile */}
       <div className="bg-white rounded-lg shadow-md">
         <div className="px-6 py-4 border-b border-gray-200">
           <h2 className="text-lg font-semibold text-gray-900">Váš profil</h2>
         </div>
         <div className="p-6">
           <div className="flex items-start space-x-4">
             <div className="flex-shrink-0">
               <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                 <UsersIcon className="h-8 w-8 text-primary-600" />
               </div>
             </div>
             <div className="flex-1 min-w-0">
               <h3 className="text-lg font-medium text-gray-900">{userProfile.name}</h3>
               <p className="text-sm text-gray-500">{userProfile.email}</p>
               {userProfile.phone && (
                 <p className="text-sm text-gray-500">{userProfile.phone}</p>
               )}
               {userProfile.bio && (
                 <p className="text-sm text-gray-600 mt-2">{userProfile.bio}</p>
               )}
             </div>
             <button
               onClick={() => setShowEditProfileModal(true)}
               className="text-primary-600 hover:text-primary-700 text-sm font-medium"
             >
               Upraviť
             </button>
           </div>
         </div>
       </div>



       {/* Edit Profile Modal */}
       <EditProfileModal
         isOpen={showEditProfileModal}
         onClose={() => setShowEditProfileModal(false)}
         onSave={handleSaveProfile}
         currentProfile={userProfile}
       />

       {/* Company Modal */}
        <CompanyModal
          isOpen={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          onSave={handleSaveCompany}
          currentCompany={editingCompany}
          isEditing={isEditingCompany}
        />


      </div>
    );
  };

export default Dashboard;
