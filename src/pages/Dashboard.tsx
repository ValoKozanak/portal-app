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
  CalendarIcon
} from '@heroicons/react/24/outline';
import EditProfileModal from '../components/EditProfileModal';
import CompanyModal from '../components/CompanyModal';
import CompanyDashboard from '../components/CompanyDashboard';
import TaskModal, { Task } from '../components/TaskModal';
import { apiService, Company } from '../services/apiService';

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
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = useCallback(async () => {
    try {
      const count = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
    }
  }, [userEmail]);

  useEffect(() => {
    loadUnreadMessagesCount();
  }, [loadUnreadMessagesCount]);

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

  // Funkcie pre správu úloh
  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiService.deleteTask(parseInt(taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Chyba pri mazaní úlohy:', error);
    }
  };

  const handleSaveTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      if (editingTask) {
        // Update existing task
        const apiTaskData = {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedToEmail || task.assignedTo, // Používame email ak je dostupný
          due_date: task.dueDate,
          category: task.category,
          estimated_hours: task.estimatedHours
        };
        
        await apiService.updateTask(parseInt(editingTask.id), apiTaskData);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...task } : t));
      } else {
        // Create new task - potrebujeme vybrať firmu
        if (companies.length === 0) {
          alert('Pre vytvorenie úlohy potrebujete mať aspoň jednu firmu.');
          return;
        }
        
        const selectedCompany = companies[0]; // Použijeme prvú firmu
        const apiTaskData = {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedToEmail || task.assignedTo, // Používame email ak je dostupný
          due_date: task.dueDate,
          category: task.category,
          estimated_hours: task.estimatedHours,
          company_id: selectedCompany.id,
          created_by: userEmail,
          company_name: selectedCompany.name
        };
        
        const newTaskResponse = await apiService.createTask(apiTaskData);
        const createdApiTask = await apiService.getTask(newTaskResponse.taskId);
        const createdTask: Task = {
          id: createdApiTask.id.toString(),
          title: createdApiTask.title,
          description: createdApiTask.description || '',
          status: createdApiTask.status,
          priority: createdApiTask.priority,
          assignedTo: createdApiTask.assigned_to,
          dueDate: createdApiTask.due_date || '',
          createdAt: createdApiTask.created_at,
          createdBy: createdApiTask.created_by,
          category: 'other',
        };
        
        setTasks(prev => [createdTask, ...prev]);
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Chyba pri ukladaní úlohy:', error);
    }
  };

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

  // Helper funkcie pre úlohy
  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: 'Čakajúce',
      completed: 'Dokončené',
      in_progress: 'V spracovaní',
      cancelled: 'Zrušené',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    const labels = {
      low: 'Nízka',
      medium: 'Stredná',
      high: 'Vysoká',
      urgent: 'Urgentná',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[priority as keyof typeof labels] || priority}
      </span>
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Váš Dashboard</h1>
          <p className="text-gray-600">Vyberte si firmu pre prácu</p>
          <p className="text-sm text-gray-500 mt-1">Prihlásený ako: {userProfile.name} ({userEmail})</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Upraviť profil
          </button>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div className="bg-white rounded-lg shadow-md p-6">
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

        <div className="bg-white rounded-lg shadow-md p-6">
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

       {/* Tasks Section */}
       <div className="bg-white rounded-lg shadow-md">
         <div className="px-6 py-4 border-b border-gray-200">
           <div className="flex justify-between items-center">
             <h2 className="text-lg font-semibold text-gray-900">Vaše úlohy</h2>
             <button 
               onClick={handleAddTask}
               className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
             >
               <PlusIcon className="h-5 w-5 mr-2" />
               Pridať úlohu
             </button>
           </div>
         </div>
         <div className="p-6">
           {loadingTasks ? (
             <div className="text-center py-12">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
               <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
             </div>
           ) : tasks.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {tasks.map((task) => (
                 <div key={task.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                   <div className="flex items-start justify-between mb-3">
                     <div className="flex-1">
                       <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                       <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                       <div className="flex items-center text-sm text-gray-500 mb-2">
                         <CalendarIcon className="h-4 w-4 mr-1" />
                         {task.dueDate}
                       </div>
                       <div className="flex items-center text-sm text-gray-500">
                         <UserIcon className="h-4 w-4 mr-1" />
                         {task.assignedTo}
                       </div>
                     </div>
                     <div className="flex flex-col items-end space-y-2 ml-4">
                       {getStatusBadge(task.status)}
                       {getPriorityBadge(task.priority)}
                     </div>
                   </div>
                   
                   <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                     <div className="flex space-x-2">
                       <button 
                         onClick={() => handleEditTask(task)}
                         className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                       >
                         Upraviť
                       </button>
                       <button 
                         onClick={() => handleDeleteTask(task.id)}
                         className="text-red-600 hover:text-red-700 text-sm font-medium"
                       >
                         Vymazať
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-12">
               <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
               <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne úlohy</h3>
               <p className="mt-1 text-sm text-gray-500 mb-4">
                 Zatiaľ nemáte žiadne úlohy. Vytvorte prvú úlohu pre vašu firmu.
               </p>
               <button
                 onClick={handleAddTask}
                 className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
               >
                 Vytvoriť prvú úlohu
               </button>
             </div>
           )}
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

       {/* Task Modal */}
       <TaskModal
         isOpen={showTaskModal}
         onClose={() => {
           setShowTaskModal(false);
           setEditingTask(null);
         }}
         onSave={handleSaveTask}
         task={editingTask}
         companyEmployees={[]}
         company={companies[0] || null}
         userEmail={userEmail}
       />
      </div>
    );
  };

export default Dashboard;
