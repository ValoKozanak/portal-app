import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import EditProfileModal from '../components/EditProfileModal';
import CompanyModal from '../components/CompanyModal';
import CompaniesList from '../components/CompaniesList';
import CompanyDashboard from '../components/CompanyDashboard';
import TaskModal, { Task } from '../components/TaskModal';
import FileUploadModal from '../components/FileUploadModal';
import FilePreviewModal from '../components/FilePreviewModal';
import MessagesList from '../components/MessagesList';
import CalendarComponent from '../components/Calendar';
import TimeClock from '../components/TimeClock';
// import AttendanceReport from '../components/AttendanceReport';
import { apiService, Company, FileData } from '../services/apiService';

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
  const [selectedCompanyForDashboard, setSelectedCompanyForDashboard] = useState<any>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

  const [stats, setStats] = useState({
    documents: 12,
    tasks: 5,
    completed: 8,
    pending: 3,
    companies: 1,
    files: 0
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, action: 'Vytvorili ste nový dokument "Projektový plán"', time: '2 hodinami', type: 'document' },
    { id: 2, action: 'Dokončili ste úlohu "Aktualizácia profilu"', time: '1 deň', type: 'task' },
    { id: 3, action: 'Nahrali ste súbor "Prezentácia.pdf"', time: '2 dni', type: 'document' },
    { id: 4, action: 'Prihlásili ste sa do systému', time: '3 dni', type: 'login' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [selectedCompanyForAttendance, setSelectedCompanyForAttendance] = useState<any>(null);

  // Aktualizácia štatistík na základe reálnych dát
  useEffect(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const totalDocuments = documents.length;
    const totalFiles = files.length;
    
    setStats(prev => ({
      ...prev,
      tasks: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      documents: totalDocuments,
      files: totalFiles
    }));
  }, [tasks, documents, files]);

  // Načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = async () => {
    try {
      const count = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(count);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
    }
  };

  useEffect(() => {
    loadUnreadMessagesCount();
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

  // Načítanie úloh pre používateľa
  useEffect(() => {
    const loadUserTasks = async () => {
      try {
        setLoadingTasks(true);
        console.log('Načítavam úlohy pre firmy:', companies);
        // Načítame úlohy zo všetkých firiem používateľa
        const allTasks: any[] = [];
        
        for (const company of companies) {
          try {
            console.log(`Načítavam úlohy pre firmu: ${company.id} - ${company.company_name}`);
            const companyTasks = await apiService.getCompanyTasks(company.id);
                          console.log(`Našiel som ${companyTasks.length} úloh pre firmu ${company.company_name}:`, companyTasks);
            allTasks.push(...companyTasks);
          } catch (error) {
            console.error(`Chyba pri načítaní úloh pre firmu ${company.id}:`, error);
          }
        }
        
        console.log('Celkovo načítané úlohy:', allTasks);
        setTasks(allTasks);
      } catch (error) {
        console.error('Chyba pri načítaní úloh:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    if (companies.length > 0) {
      loadUserTasks();
    }
  }, [companies]);

  // Načítanie dokumentov pre používateľa
  useEffect(() => {
    const loadUserDocuments = async () => {
      try {
        setLoadingDocuments(true);
        // Načítame dokumenty zo všetkých firiem používateľa
        const allDocuments: any[] = [];
        
        for (const company of companies) {
          try {
            const companyFiles = await apiService.getCompanyFiles(company.id);
            allDocuments.push(...companyFiles);
          } catch (error) {
            console.error(`Chyba pri načítaní dokumentov pre firmu ${company.id}:`, error);
          }
        }
        
        setDocuments(allDocuments);
      } catch (error) {
        console.error('Chyba pri načítaní dokumentov:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    if (companies.length > 0) {
      loadUserDocuments();
    }
  }, [companies]);

  // Načítanie súborov pre používateľa
  useEffect(() => {
    const loadUserFiles = async () => {
      try {
        setLoadingFiles(true);
        // Načítame súbory zo všetkých firiem používateľa
        const allFiles: any[] = [];
        
        for (const company of companies) {
          try {
            const companyFiles = await apiService.getCompanyFiles(company.id);
            allFiles.push(...companyFiles);
          } catch (error) {
            console.error(`Chyba pri načítaní súborov pre firmu ${company.id}:`, error);
          }
        }
        
        setFiles(allFiles);
      } catch (error) {
        console.error('Chyba pri načítaní súborov:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    if (companies.length > 0) {
      loadUserFiles();
    }
  }, [companies]);

  // Aktualizuj počet firiem v štatistikách
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      companies: companies.length
    }));
  }, [companies.length]);

  const handleSaveProfile = (updatedProfile: any) => {
    setUserProfile(updatedProfile);
    // Tu by sa v reálnej aplikácii odoslali dáta na server
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

  const handleDeleteCompany = async (companyId: number) => {
    try {
      await apiService.deleteCompany(companyId);
      setCompanies((prev: Company[]) => prev.filter((c: Company) => c.id !== companyId));
      setStats(prev => ({ ...prev, companies: prev.companies - 1 }));
    } catch (error) {
      console.error('Chyba pri mazaní firmy:', error);
    }
  };

  const handleOpenCompanyDashboard = (company: any) => {
    setSelectedCompanyForDashboard(company);
  };

  // Funkcie pre správu úloh
  const handleAddTask = () => {
    if (loading) {
      alert('Načítavam firmy, počkajte prosím...');
      return;
    }
    if (companies.length === 0) {
      alert('Najprv musíte vytvoriť firmu, aby ste mohli pridávať úlohy.');
      return;
    }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        // Editácia existujúcej úlohy
        await apiService.updateTask(editingTask.id, taskData);
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id 
            ? { ...task, ...taskData }
            : task
        ));
      } else {
        // Pridanie novej úlohy - použijeme companyId z taskData
        if (taskData.companyId && companies.length > 0) {
          const selectedCompany = companies.find(c => c.id === taskData.companyId);
          if (selectedCompany) {
            const response = await apiService.createTask({
              title: taskData.title,
              description: taskData.description,
              status: taskData.status,
              priority: taskData.priority,
              assigned_to: taskData.assignedToEmail || taskData.assignedTo,
              user_id: selectedCompany.id,
              company_name: selectedCompany.company_name || '',
              created_by: userEmail,
              due_date: taskData.dueDate
            });
            
            const newTask = {
              id: response.taskId,
              title: taskData.title,
              description: taskData.description,
              status: taskData.status,
              priority: taskData.priority,
              assignedTo: taskData.assignedTo,
              dueDate: taskData.dueDate,
              createdAt: new Date().toISOString(),
              createdBy: userEmail,
              category: taskData.category,
              companyId: selectedCompany.id,
              companyName: selectedCompany.company_name
            };
            
            setTasks(prev => [...prev, newTask]);
          } else {
            alert('Vybraná firma nebola nájdená.');
            return;
          }
        } else {
          alert('Musíte vybrať firmu pre úlohu.');
          return;
        }
      }
      
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Chyba pri ukladaní úlohy:', error);
      alert('Chyba pri ukladaní úlohy');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (window.confirm('Naozaj chcete vymazať túto úlohu?')) {
      try {
        await apiService.deleteTask(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Chyba pri mazaní úlohy:', error);
        alert('Chyba pri mazaní úlohy');
      }
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: Task['status']) => {
    try {
      await apiService.updateTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Chyba pri aktualizácii stavu úlohy:', error);
      alert('Chyba pri aktualizácii stavu úlohy');
    }
  };

  // Funkcie pre správu dokumentov
  const handleUploadFile = () => {
    if (loading) {
      alert('Načítavam firmy, počkajte prosím...');
      return;
    }
    if (companies.length === 0) {
      alert('Najprv musíte vytvoriť firmu, aby ste mohli nahrávať súbory.');
      return;
    }
    setShowFileUploadModal(true);
  };

  const handleFileUpload = async (fileData: FileData) => {
    try {
      // Pridáme nový súbor do stavu
      setFiles(prev => [...prev, fileData]);
      setDocuments(prev => [...prev, fileData]);
      
      setShowFileUploadModal(false);
    } catch (error) {
      console.error('Chyba pri nahrávaní súboru:', error);
      alert('Chyba pri nahrávaní súboru');
    }
  };

  const handleDeleteDocument = async (fileId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        await apiService.deleteFile(fileId);
        setDocuments(prev => prev.filter(doc => doc.id !== fileId));
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
        alert('Chyba pri mazaní dokumentu');
      }
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const blob = await apiService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Chyba pri sťahovaní súboru:', error);
      alert('Chyba pri sťahovaní súboru');
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento súbor?')) {
      try {
        await apiService.deleteFile(fileId);
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } catch (error) {
        console.error('Chyba pri mazaní súboru:', error);
        alert('Chyba pri mazaní súboru');
      }
    }
  };

  const handleFilePreview = (file: FileData) => {
    console.log('handleFilePreview called with file:', file);
    setPreviewFile(file);
    setShowFilePreviewModal(true);
    console.log('showFilePreviewModal set to true');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'document':
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case 'task':
        return <CheckCircleIcon className="h-5 w-5 text-yellow-500" />;
      case 'system':
        return <ChartBarIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Váš Dashboard</h1>
          <p className="text-gray-600">Prehľad vašej aktivity a štatistík</p>
          <p className="text-sm text-gray-500 mt-1">Prihlásený ako: {userProfile.name} ({userEmail})</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Hľadať..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        <button 
          onClick={() => setActiveSection('documents')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'documents' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vaše dokumenty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+2 tento týždeň</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('tasks')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'tasks' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CogIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktívne úlohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-blue-600">3 čakajúce</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('completed')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'completed' ? 'ring-2 ring-yellow-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dokončené</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">+1 tento týždeň</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('companies')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'companies' ? 'ring-2 ring-purple-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vaše firmy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-purple-600">Aktívne spoločnosti</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('files')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'files' ? 'ring-2 ring-indigo-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vaše súbory</p>
              <p className="text-2xl font-bold text-gray-900">{stats.files}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-indigo-600">Nahrané</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('calendar')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'calendar' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kalendár</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.filter(task => task.due_date).length}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-orange-600">Termíny a úlohy</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('messages')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'messages' ? 'ring-2 ring-purple-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Správy</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              {unreadMessagesCount > 0 && (
                <p className="text-sm text-purple-600 font-medium">{unreadMessagesCount} neprečítaných</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-purple-600">Komunikácia</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('timeclock')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'timeclock' ? 'ring-2 ring-emerald-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dochádzka</p>
              <p className="text-2xl font-bold text-gray-900">⏰</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-emerald-600">Časová karta</span>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('attendance-report')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'attendance-report' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Report dochádzky</p>
              <p className="text-2xl font-bold text-gray-900">📊</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-orange-600">Štatistiky</span>
          </div>
        </button>
       </div>

       {/* Conditional Sections */}
       {activeSection === 'files' && (
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
             <h2 className="text-lg font-semibold text-gray-900">Vaše súbory</h2>
             <button
               onClick={handleUploadFile}
               disabled={loading || companies.length === 0}
               className={`px-4 py-2 rounded-md flex items-center ${
                 loading || companies.length === 0 
                   ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                   : 'bg-primary-600 text-white hover:bg-primary-700'
               }`}
             >
               <DocumentTextIcon className="h-5 w-5 mr-2" />
               {loading ? 'Načítavam...' : 'Nahrať súbor'}
             </button>
           </div>
           <div className="p-6">
             {loadingFiles ? (
               <div className="text-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                 <p className="mt-4 text-gray-600">Načítavam súbory...</p>
               </div>
             ) : files.length > 0 ? (
               <div className="space-y-4">
                 {files.map((file) => (
                   <div key={file.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex-1">
                         <h3 className="text-lg font-semibold text-gray-900 mb-2">{file.original_name}</h3>
                         <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                           <div className="flex items-center">
                             <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                             <span>Firma: {file.company_name || 'Neznáma'}</span>
                           </div>
                           <div className="flex items-center">
                             <DocumentTextIcon className="h-4 w-4 mr-1" />
                             <span>Typ: {file.file_type}</span>
                           </div>
                           <div className="flex items-center">
                             <span>Veľkosť: {(file.file_size / 1024).toFixed(1)} KB</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end space-y-2 ml-4">
                         <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                           Súbor
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                       <div className="text-xs text-gray-500">
                         Nahral: {file.uploaded_by} | Dátum: {new Date(file.created_at).toLocaleDateString('sk-SK')}
                       </div>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => handleFilePreview(file)}
                           className="text-green-600 hover:text-green-700 text-sm font-medium"
                         >
                           Náhľad
                         </button>
                         <button
                           onClick={() => handleDownloadFile(file.id, file.original_name)}
                           className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                         >
                           Stiahnuť
                         </button>
                         <button
                           onClick={() => handleDeleteFile(file.id)}
                           className="text-red-600 hover:text-red-700 text-sm font-medium"
                         >
                           Vymazať
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
                            ) : companies.length === 0 ? (
                 <div className="text-center py-12">
                   <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                   <h3 className="mt-2 text-sm font-medium text-gray-900">Najprv vytvorte firmu</h3>
                   <p className="mt-1 text-sm text-gray-500 mb-4">Aby ste mohli nahrávať súbory, musíte najprv vytvoriť firmu.</p>
                   <button
                     onClick={handleAddCompany}
                     className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                   >
                     Pridať firmu
                   </button>
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                   <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne súbory</h3>
                   <p className="mt-1 text-sm text-gray-500">Zatiaľ nemáte žiadne nahrané súbory</p>
                 </div>
               )}
           </div>
         </div>
       )}

       {activeSection === 'companies' && (
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-900">Vaše firmy</h2>
           </div>
           <div className="p-6">
             <CompaniesList
               companies={companies}
               onAddCompany={handleAddCompany}
               onEditCompany={handleEditCompany}
               onDeleteCompany={handleDeleteCompany}
               onOpenDashboard={handleOpenCompanyDashboard}
             />
           </div>
         </div>
       )}

       {activeSection === 'documents' && (
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
             <h2 className="text-lg font-semibold text-gray-900">Vaše dokumenty</h2>
             <button
               onClick={handleUploadFile}
               disabled={loading || companies.length === 0}
               className={`px-4 py-2 rounded-md flex items-center ${
                 loading || companies.length === 0 
                   ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                   : 'bg-primary-600 text-white hover:bg-primary-700'
               }`}
             >
               <DocumentTextIcon className="h-5 w-5 mr-2" />
               {loading ? 'Načítavam...' : 'Nahrať dokument'}
             </button>
           </div>
           <div className="p-6">
             {loadingDocuments ? (
               <div className="text-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                 <p className="mt-4 text-gray-600">Načítavam dokumenty...</p>
               </div>
             ) : documents.length > 0 ? (
               <div className="space-y-4">
                 {documents.map((document) => (
                   <div key={document.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex-1">
                         <h3 className="text-lg font-semibold text-gray-900 mb-2">{document.original_name}</h3>
                         <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                           <div className="flex items-center">
                             <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                             <span>Firma: {document.company_name || 'Neznáma'}</span>
                           </div>
                           <div className="flex items-center">
                             <DocumentTextIcon className="h-4 w-4 mr-1" />
                             <span>Typ: {document.file_type}</span>
                           </div>
                           <div className="flex items-center">
                             <span>Veľkosť: {(document.file_size / 1024).toFixed(1)} KB</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end space-y-2 ml-4">
                         <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                           Nahrané
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                       <div className="text-xs text-gray-500">
                         Nahral: {document.uploaded_by} | Dátum: {new Date(document.created_at).toLocaleDateString('sk-SK')}
                       </div>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => window.open(`/api/files/download/${document.id}`, '_blank')}
                           className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                         >
                           Stiahnuť
                         </button>
                         <button
                           onClick={() => handleDeleteDocument(document.id)}
                           className="text-red-600 hover:text-red-700 text-sm font-medium"
                         >
                           Vymazať
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
                            ) : companies.length === 0 ? (
                 <div className="text-center py-12">
                   <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                   <h3 className="mt-2 text-sm font-medium text-gray-900">Najprv vytvorte firmu</h3>
                   <p className="mt-1 text-sm text-gray-500 mb-4">Aby ste mohli nahrávať dokumenty, musíte najprv vytvoriť firmu.</p>
                   <button
                     onClick={handleAddCompany}
                     className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                   >
                     Pridať firmu
                   </button>
                 </div>
               ) : (
                 <div className="text-center py-12">
                   <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                   <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne dokumenty</h3>
                   <p className="mt-1 text-sm text-gray-500">Zatiaľ nemáte žiadne nahrané dokumenty</p>
                 </div>
               )}
           </div>
         </div>
       )}

       {activeSection === 'tasks' && (
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-900">Vaše úlohy zo všetkých firiem</h2>
           </div>
           <div className="p-6">
             {loadingTasks ? (
               <div className="text-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                 <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
               </div>
             ) : tasks.length > 0 ? (
               <div className="space-y-4">
                 {tasks.map((task) => (
                   <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex-1">
                         <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                         <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                         
                         <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                           <div className="flex items-center">
                             <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                             <span>{task.company_name}</span>
                           </div>
                           <div className="flex items-center">
                             <CalendarIcon className="h-4 w-4 mr-1" />
                             <span>Termín: {new Date(task.due_date).toLocaleDateString('sk-SK')}</span>
                           </div>
                           <div className="flex items-center">
                             <UserIcon className="h-4 w-4 mr-1" />
                             <span>Priradené: {task.assigned_to}</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end space-y-2 ml-4">
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                           task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                           task.status === 'completed' ? 'bg-green-100 text-green-800' :
                           task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {task.status === 'pending' ? 'Čakajúce' :
                            task.status === 'completed' ? 'Dokončené' :
                            task.status === 'in_progress' ? 'V spracovaní' : 'Zrušené'}
                         </span>
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                           task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                           task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                           task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-green-100 text-green-800'
                         }`}>
                           {task.priority === 'urgent' ? 'Urgentná' :
                            task.priority === 'high' ? 'Vysoká' :
                            task.priority === 'medium' ? 'Stredná' : 'Nízka'}
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                       <div className="text-xs text-gray-500">
                         Vytvoril: {task.created_by} | Vytvorené: {new Date(task.created_at).toLocaleDateString('sk-SK')}
                       </div>
                       <div className="flex space-x-2">
                         <span className="text-xs text-gray-500">
                           Úlohy môžu spravovať len účtovníci
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : companies.length === 0 ? (
               <div className="text-center py-12">
                 <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                 <h3 className="mt-2 text-sm font-medium text-gray-900">Najprv vytvorte firmu</h3>
                 <p className="mt-1 text-sm text-gray-500 mb-4">Aby ste mohli vidieť úlohy, musíte najprv vytvoriť firmu.</p>
                 <button
                   onClick={handleAddCompany}
                   className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                 >
                   Pridať firmu
                 </button>
               </div>
             ) : (
               <div className="text-center py-12">
                 <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
                 <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne úlohy</h3>
                 <p className="mt-1 text-sm text-gray-500">Zatiaľ nemáte žiadne úlohy. Úlohy môžu vytvárať len účtovníci priradení k vašim firmám.</p>
               </div>
             )}
           </div>
         </div>
       )}

       {activeSection === 'completed' && (
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-lg font-semibold text-gray-900">Dokončené úlohy zo všetkých firiem</h2>
           </div>
           <div className="p-6">
             {loadingTasks ? (
               <div className="text-center py-12">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                 <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
               </div>
             ) : tasks.filter(task => task.status === 'completed').length > 0 ? (
               <div className="space-y-4">
                 {tasks.filter(task => task.status === 'completed').map((task) => (
                   <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex-1">
                         <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                         <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                         
                         <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                           <div className="flex items-center">
                             <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                             <span>{task.company_name}</span>
                           </div>
                           <div className="flex items-center">
                             <CalendarIcon className="h-4 w-4 mr-1" />
                             <span>Termín: {new Date(task.due_date).toLocaleDateString('sk-SK')}</span>
                           </div>
                           <div className="flex items-center">
                             <UserIcon className="h-4 w-4 mr-1" />
                             <span>Priradené: {task.assigned_to}</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end space-y-2 ml-4">
                         <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                           Dokončené
                         </span>
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                           task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                           task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                           task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                           'bg-green-100 text-green-800'
                         }`}>
                           {task.priority === 'urgent' ? 'Urgentná' :
                            task.priority === 'high' ? 'Vysoká' :
                            task.priority === 'medium' ? 'Stredná' : 'Nízka'}
                         </span>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                       <div className="text-xs text-gray-500">
                         Vytvoril: {task.created_by} | Vytvorené: {new Date(task.created_at).toLocaleDateString('sk-SK')}
                       </div>
                       <div className="flex space-x-2">
                         <span className="text-xs text-gray-500">
                           Úlohy môžu spravovať len účtovníci
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12">
                 <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                 <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne dokončené úlohy</h3>
                 <p className="mt-1 text-sm text-gray-500">Zatiaľ nemáte žiadne dokončené úlohy. Úlohy môžu vytvárať len účtovníci priradení k vašim firmám.</p>
               </div>
             )}
           </div>
         </div>
       )}

               {/* Calendar Section */}
        {activeSection === 'calendar' && (
          <CalendarComponent
            userEmail={userEmail}
            userRole="user"
            tasks={tasks}
            companies={companies}
            onTaskUpdate={() => {
              // Reload tasks after update
              const loadUserTasks = async () => {
                try {
                  setLoadingTasks(true);
                  const allTasks: any[] = [];
                  
                  for (const company of companies) {
                    try {
                      const companyTasks = await apiService.getCompanyTasks(company.id);
                      allTasks.push(...companyTasks);
                    } catch (error) {
                      console.error(`Chyba pri načítaní úloh pre firmu ${company.id}:`, error);
                    }
                  }
                  
                  setTasks(allTasks);
                } catch (error) {
                  console.error('Chyba pri načítaní úloh:', error);
                } finally {
                  setLoadingTasks(false);
                }
              };

              if (companies.length > 0) {
                loadUserTasks();
              }
            }}
          />
        )}

        {/* TimeClock Section */}
        {activeSection === 'timeclock' && (
          <div className="space-y-6">
            {companies.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-12">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Najprv vytvorte firmu</h3>
                  <p className="mt-1 text-sm text-gray-500 mb-4">Aby ste mohli používať dochádzkový systém, musíte najprv vytvoriť firmu.</p>
                  <button
                    onClick={handleAddCompany}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                  >
                    Pridať firmu
                  </button>
                </div>
              </div>
            ) : companies.length === 1 ? (
              <TimeClock 
                companyId={companies[0].id} 
                companyName={companies[0].name} 
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vyberte firmu pre dochádzku</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyForAttendance(company)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-emerald-600" />
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">{company.company_name}</h3>
                          <p className="text-sm text-gray-500">IČO: {company.ico}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCompanyForAttendance && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Dochádzka - {selectedCompanyForAttendance.company_name}
                      </h2>
                      <button
                        onClick={() => setSelectedCompanyForAttendance(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <TimeClock 
                      companyId={selectedCompanyForAttendance.id} 
                      companyName={selectedCompanyForAttendance.company_name} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance Report Section */}
        {activeSection === 'attendance-report' && (
          <div className="space-y-6">
            {companies.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-12">
                  <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Najprv vytvorte firmu</h3>
                  <p className="mt-1 text-sm text-gray-500 mb-4">Aby ste mohli zobraziť reporty dochádzky, musíte najprv vytvoriť firmu.</p>
                  <button
                    onClick={handleAddCompany}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                  >
                    Pridať firmu
                  </button>
                </div>
              </div>
            ) : companies.length === 1 ? (
              {/* <AttendanceReport 
                companyId={companies[0].id} 
                companyName={companies[0].company_name || ''} 
              /> */}
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vyberte firmu pre report dochádzky</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyForAttendance(company)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <ChartBarIcon className="h-6 w-6 text-orange-600" />
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">{company.company_name}</h3>
                          <p className="text-sm text-gray-500">IČO: {company.ico}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCompanyForAttendance && activeSection === 'attendance-report' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Report dochádzky - {selectedCompanyForAttendance.company_name}
                      </h2>
                      <button
                        onClick={() => setSelectedCompanyForAttendance(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                                          {/* <AttendanceReport 
                        companyId={selectedCompanyForAttendance.id} 
                        companyName={selectedCompanyForAttendance.company_name} 
                      /> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

               {/* Messages Section */}
        {activeSection === 'messages' && (
          <div className="bg-white rounded-lg shadow-md">
            <MessagesList 
              userEmail={userEmail} 
              userRole="user" 
              onMessageAction={loadUnreadMessagesCount}
            />
          </div>
        )}

       {/* Default Overview Section */}
       {activeSection === 'overview' && (
         <>
           {/* Companies Section */}
           <div className="bg-white rounded-lg shadow-md">
             <div className="px-6 py-4 border-b border-gray-200">
               <h2 className="text-lg font-semibold text-gray-900">Vaše firmy</h2>
             </div>
             <div className="p-6">
               <CompaniesList
                 companies={companies}
                 onAddCompany={handleAddCompany}
                 onEditCompany={handleEditCompany}
                 onDeleteCompany={handleDeleteCompany}
                 onOpenDashboard={handleOpenCompanyDashboard}
               />
             </div>
           </div>
         </>
       )}

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

       {/* Recent Activity */}
       <div className="bg-white rounded-lg shadow-md">
         <div className="px-6 py-4 border-b border-gray-200">
           <h2 className="text-lg font-semibold text-gray-900">Vaša posledná aktivita</h2>
         </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vaše rýchle akcie</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={handleAddTask}
            disabled={loading || companies.length === 0}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              loading || companies.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            <CogIcon className="h-5 w-5 mr-2" />
            Pridať úlohu
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Vytvoriť dokument
          </button>
          <button 
            onClick={handleAddCompany}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Pridať firmu
          </button>
          <button 
            onClick={() => setShowEditProfileModal(true)}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Upraviť profil
          </button>
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

        {/* Company Dashboard Modal */}
        {selectedCompanyForDashboard && (
          <CompanyDashboard
            company={selectedCompanyForDashboard}
            onClose={() => setSelectedCompanyForDashboard(null)}
          />
        )}

        {/* Task Modal */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          task={editingTask}
          companyEmployees={companies.length > 0 ? [
            {
              id: '1',
              name: 'Vlastník firmy',
              email: userEmail,
              role: 'owner',
              department: 'Management'
            }
          ] : []}
          company={companies.length > 0 ? { id: companies[0].id, name: companies[0].name } : undefined}
          isAccountant={false}
          assignedCompanies={companies.map(company => ({
            id: company.id,
            name: company.company_name || '',
            ico: company.ico || ''
          }))}
        />

        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={showFileUploadModal}
          onClose={() => setShowFileUploadModal(false)}
          companyId={companies.length > 0 ? companies[0].id : undefined}
          onFileUpload={handleFileUpload}
        />

        {/* File Preview Modal */}
        {console.log('Rendering FilePreviewModal, isOpen:', showFilePreviewModal, 'file:', previewFile)}
        <FilePreviewModal
          isOpen={showFilePreviewModal}
          onClose={() => {
            setShowFilePreviewModal(false);
            setPreviewFile(null);
          }}
          file={previewFile}
        />


      </div>
    );
  };

export default Dashboard;
