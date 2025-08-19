import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import CompanyDashboard from '../components/CompanyDashboard';
import TaskModal, { Task, Employee } from '../components/TaskModal';
import FileUploadModal from '../components/FileUploadModal';
import FilePreviewModal from '../components/FilePreviewModal';
import MessagesList from '../components/MessagesList';
import CalendarComponent from '../components/Calendar';
import TimeClock from '../components/TimeClock';
// import AttendanceReport from '../components/AttendanceReport';
import { Company, apiService } from '../services/apiService';

interface AccountantDashboardProps {
  userEmail: string;
}

const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ userEmail }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyForDashboard, setSelectedCompanyForDashboard] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [selectedCompanyForAttendance, setSelectedCompanyForAttendance] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    documents: 0,
    tasks: 0,
    completed: 0,
    pending: 0,
    companies: 0,
  });

  // Načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = async () => {
    try {
      const unreadCount = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
    }
  };

  // Načítanie firiem a úloh priradených účtovníkovi
  useEffect(() => {
    const loadAccountantData = async () => {
      try {
        // Načítanie firiem priradených účtovníkovi cez API
        const assignedCompanies = await apiService.getAccountantCompanies(userEmail);
        setCompanies(assignedCompanies);

        // Načítanie úloh zo všetkých priradených firiem (nie len priradené účtovníkovi)
        const companyTasksArrays = await Promise.all(
          assignedCompanies.map((company) => apiService.getCompanyTasks(company.id))
        );
        const allCompanyTasks = companyTasksArrays.flat();

        // Konvertujeme API Task na TaskModal Task
        const convertedTasks: Task[] = allCompanyTasks.map(apiTask => ({
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
          companyId: apiTask.user_id,
          companyName: apiTask.company_name
        }));
        setAssignedTasks(convertedTasks);

        // Načítanie dokumentov zo všetkých priradených firiem
        const allDocuments: any[] = [];
        const allFiles: any[] = [];
        for (const company of assignedCompanies) {
          try {
            const companyFiles = await apiService.getCompanyFiles(company.id);
            allDocuments.push(...companyFiles);
            allFiles.push(...companyFiles); // Pre teraz sú súbory a dokumenty to isté
          } catch (error) {
            console.error(`Chyba pri načítaní dokumentov pre firmu ${company.id}:`, error);
          }
        }
        setDocuments(allDocuments);
        setFiles(allFiles);
      } catch (error) {
        console.error('Chyba pri načítaní dát účtovníka:', error);
      } finally {
        setLoadingTasks(false);
        setLoadingDocuments(false);
        setLoadingFiles(false);
        setLoadingCompanies(false);
      }
    };

    loadAccountantData();
    loadUnreadMessagesCount();
  }, [userEmail]);

  // Aktualizácia štatistík na základe reálnych dát
  useEffect(() => {
    const totalTasks = assignedTasks.length;
    const completedTasks = assignedTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = assignedTasks.filter(task => task.status === 'pending').length;
    const totalDocuments = documents.length;
    
    setStats({
      documents: totalDocuments,
      tasks: totalTasks, // Zobrazujeme všetky úlohy
      completed: completedTasks,
      pending: pendingTasks,
      companies: companies.length,
    });
  }, [assignedTasks, documents, companies.length]);

  // Automatické aktualizácie počtu neprečítaných správ každých 30 sekúnd
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000); // 30 sekúnd

    return () => clearInterval(interval);
  }, [userEmail]);

  const handleOpenCompanyDashboard = (company: Company) => {
    setSelectedCompanyForDashboard(company);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    // TODO: implementovať API volanie pre aktualizáciu úlohy
    console.log('Aktualizácia úlohy:', taskId, newStatus);
    setAssignedTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  // Funkcie pre správu úloh
  const handleAddTask = () => {
    if (loadingCompanies) {
      alert('Načítavam firmy, počkajte prosím...');
      return;
    }
    if (companies.length === 0) {
      alert('Nemáte priradené žiadne firmy. Kontaktujte administrátora.');
      return;
    }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        // Editácia existujúcej úlohy
        await apiService.updateTask(parseInt(editingTask.id), taskData);
        setAssignedTasks(prev => prev.map(task => 
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
              id: response.taskId.toString(),
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
            
            setAssignedTasks(prev => [...prev, newTask]);
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

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Naozaj chcete vymazať túto úlohu?')) {
      try {
        await apiService.deleteTask(parseInt(taskId));
        setAssignedTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Chyba pri mazaní úlohy:', error);
        alert('Chyba pri mazaní úlohy');
      }
    }
  };

  // Funkcie pre správu dokumentov
  const handleUploadFile = () => {
    if (loadingCompanies) {
      alert('Načítavam firmy, počkajte prosím...');
      return;
    }
    if (companies.length === 0) {
      alert('Nemáte priradené žiadne firmy. Kontaktujte administrátora.');
      return;
    }
    setShowFileUploadModal(true);
  };

  const handleFilePreview = (file: any) => {
    setPreviewFile(file);
    setShowFilePreviewModal(true);
  };

  const handleFileUpload = async (fileData: any) => {
    try {
      // Obnovíme zoznam dokumentov a súborov
      const allDocuments: any[] = [];
      const allFiles: any[] = [];
      for (const company of companies) {
        try {
          const companyFiles = await apiService.getCompanyFiles(company.id);
          allDocuments.push(...companyFiles);
          allFiles.push(...companyFiles);
        } catch (error) {
          console.error(`Chyba pri načítaní dokumentov pre firmu ${company.id}:`, error);
        }
      }
      setDocuments(allDocuments);
      setFiles(allFiles);
      
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
        setFiles(prev => prev.filter(file => file.id !== fileId));
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
        alert('Chyba pri mazaní dokumentu');
      }
    }
  };

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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    const labels = {
      urgent: 'Urgentná',
      high: 'Vysoká',
      medium: 'Stredná',
      low: 'Nízka',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

    const filteredCompanies = companies.filter(company =>
            (company.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (company.ico?.includes(searchTerm) || false) ||
    (company.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)        
  );

  const filteredTasks = assignedTasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return task.status === 'pending';
    if (taskFilter === 'in_progress') return task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed';
    if (taskFilter === 'cancelled') return task.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard účtovníka</h1>
            <p className="text-gray-600 mt-2">Správa priradených firiem a úloh</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Prihlásený ako</p>
              <p className="font-medium text-gray-900">{userEmail}</p>
            </div>
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Dokumenty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
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
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Úlohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              <p className="text-sm text-gray-500">{stats.pending} čakajúcich</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('completed')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'completed' ? 'ring-2 ring-green-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dokončené</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('files')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'files' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Súbory</p>
              <p className="text-2xl font-bold text-gray-900">{files.length}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
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
              <p className="text-sm font-medium text-gray-600">Priradené firmy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
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
              <p className="text-2xl font-bold text-gray-900">{assignedTasks.filter(task => task.dueDate).length}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('messages')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'messages' ? 'ring-2 ring-indigo-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Správy</p>
              <p className="text-2xl font-bold text-gray-900">{unreadMessagesCount}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              {unreadMessagesCount > 0 && (
                <p className="text-sm text-indigo-600 font-medium">{unreadMessagesCount} neprečítaných</p>
              )}
            </div>
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
              <CalendarIcon className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dochádzka</p>
              <p className="text-2xl font-bold text-gray-900">⏰</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveSection('attendance-report')}
          className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 ${
            activeSection === 'attendance-report' ? 'ring-2 ring-red-500' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Report dochádzky</p>
              <p className="text-2xl font-bold text-gray-900">📊</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vaše rýchle akcie</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowFileUploadModal(true)}
            disabled={loadingCompanies || companies.length === 0}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              loadingCompanies || companies.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Nahrať dokument
          </button>
          <button 
            onClick={handleAddTask}
            disabled={loadingCompanies || companies.length === 0}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              loadingCompanies || companies.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
            }`}
          >
            <CogIcon className="h-5 w-5 mr-2" />
            Vytvoriť úlohu
          </button>
          <button 
            onClick={() => setActiveSection('companies')}
            disabled={loadingCompanies || companies.length === 0}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              loadingCompanies || companies.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
            }`}
          >
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Zobraziť firmy
          </button>
          <button 
            onClick={() => {
              // Generovanie reportu pre účtovníka
              alert('Generovanie reportu...\n\nTáto funkcia by generovala report o všetkých priradených firmách a úlohách.');
            }}
            disabled={loadingCompanies || companies.length === 0}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              loadingCompanies || companies.length === 0 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Generovať report
          </button>
        </div>
      </div>

      {/* Conditional Sections */}
             {activeSection === 'tasks' && (
         <div className="bg-white rounded-lg shadow-md">
           <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
             <div>
               <h2 className="text-lg font-semibold text-gray-900">Úlohy zo všetkých priradených firiem</h2>
               <p className="text-sm text-gray-600 mt-1">Celkovo {assignedTasks.length} úloh z {companies.length} firiem</p>
             </div>
                         <button
              onClick={handleAddTask}
              disabled={loadingCompanies || companies.length === 0}
              className={`px-4 py-2 rounded-md flex items-center ${
                loadingCompanies || companies.length === 0 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <CogIcon className="h-5 w-5 mr-2" />
              {loadingCompanies ? 'Načítavam...' : 'Pridať úlohu'}
            </button>
           </div>

          {/* Task Filter */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    taskFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Všetky ({assignedTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('pending')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    taskFilter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Čakajúce ({assignedTasks.filter(t => t.status === 'pending').length})
                </button>
                <button
                  onClick={() => setTaskFilter('in_progress')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    taskFilter === 'in_progress'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  V spracovaní ({assignedTasks.filter(t => t.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setTaskFilter('completed')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    taskFilter === 'completed'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Dokončené ({assignedTasks.filter(t => t.status === 'completed').length})
                </button>
                <button
                  onClick={() => setTaskFilter('cancelled')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    taskFilter === 'cancelled'
                      ? 'bg-gray-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Zrušené ({assignedTasks.filter(t => t.status === 'cancelled').length})
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            <span>{task.companyName}</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>Termín: {new Date(task.dueDate).toLocaleDateString('sk-SK')}</span>
                          </div>
                          {task.estimatedHours && (
                            <div>
                              <span>Odhad: {task.estimatedHours}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Vytvoril: {task.createdBy} | Kategória: {task.category}
                      </div>
                      <div className="flex space-x-2">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Začať prácu
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            Dokončiť
                          </button>
                        )}
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Upraviť
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Vymazať
                        </button>
                        <button
                          onClick={() => {
                            const company = companies.find(c => c.id === task.companyId);
                            if (company) {
                              handleOpenCompanyDashboard(company);
                            }
                          }}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Otvoriť firmu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nemáte priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500">Kontaktujte administrátora, aby vám priradil firmy.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {taskFilter === 'all' ? 'Žiadne úlohy' : 'Žiadne úlohy s vybraným filtrom'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {taskFilter === 'all' 
                    ? 'Zatiaľ nemáte žiadne úlohy od priradených firiem.' 
                    : 'Skúste zmeniť filter alebo sa vrátiť na "Všetky"'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'documents' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dokumenty zo všetkých priradených firiem</h2>
              <p className="text-sm text-gray-600 mt-1">Celkovo {documents.length} dokumentov z {companies.length} firiem</p>
            </div>
            <button
              onClick={handleUploadFile}
              disabled={loadingCompanies || companies.length === 0}
              className={`px-4 py-2 rounded-md flex items-center ${
                loadingCompanies || companies.length === 0 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {loadingCompanies ? 'Načítavam...' : 'Nahrať dokument'}
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nemáte priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500">Kontaktujte administrátora, aby vám priradil firmy.</p>
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

      {activeSection === 'completed' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dokončené úlohy zo všetkých priradených firiem</h2>
              <p className="text-sm text-gray-600 mt-1">Celkovo {stats.completed} dokončených úloh z {companies.length} firiem</p>
            </div>
          </div>
          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
              </div>
            ) : assignedTasks.filter(task => task.status === 'completed').length > 0 ? (
              <div className="space-y-4">
                {assignedTasks
                  .filter(task => task.status === 'completed')
                  .map((task) => (
                    <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                              <span>{task.companyName}</span>
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>Termín: {new Date(task.dueDate).toLocaleDateString('sk-SK')}</span>
                            </div>
                            {task.estimatedHours && (
                              <div>
                                <span>Odhad: {task.estimatedHours}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Vytvoril: {task.createdBy} | Kategória: {task.category}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Upraviť
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Vymazať
                          </button>
                          <button
                            onClick={() => {
                              const company = companies.find(c => c.id === task.companyId);
                              if (company) {
                                handleOpenCompanyDashboard(company);
                              }
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Otvoriť firmu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nemáte priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500">Kontaktujte administrátora, aby vám priradil firmy.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne dokončené úlohy</h3>
                <p className="mt-1 text-sm text-gray-500">Zatiaľ nemáte žiadne dokončené úlohy</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'files' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Súbory zo všetkých priradených firiem</h2>
              <p className="text-sm text-gray-600 mt-1">Celkovo {files.length} súborov z {companies.length} firiem</p>
            </div>
            <button
              onClick={handleUploadFile}
              disabled={loadingCompanies || companies.length === 0}
              className={`px-4 py-2 rounded-md flex items-center ${
                loadingCompanies || companies.length === 0 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <FolderIcon className="h-5 w-5 mr-2" />
              {loadingCompanies ? 'Načítavam...' : 'Nahrať súbor'}
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
                            <FolderIcon className="h-4 w-4 mr-1" />
                            <span>Typ: {file.file_type}</span>
                          </div>
                          <div className="flex items-center">
                            <span>Veľkosť: {(file.file_size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
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
                          onClick={() => window.open(`/api/files/download/${file.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Stiahnuť
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(file.id)}
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nemáte priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500">Kontaktujte administrátora, aby vám priradil firmy.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
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
            <h2 className="text-lg font-semibold text-gray-900">Priradené firmy</h2>
          </div>
          <div className="p-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Hľadať firmy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="mt-6">
              {filteredCompanies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanies.map((company) => (
                    <div key={company.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{company.company_name}</h3>
                          <p className="text-sm text-gray-600 mb-2">IČO: {company.ico}</p>
                          <p className="text-sm text-gray-500 mb-2">Vlastník: {company.email}</p>
                          <p className="text-sm text-gray-500">{company.address}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenCompanyDashboard(company)}
                            className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md"
                            title="Otvoriť Dashboard"
                          >
                            <ChartBarIcon className="h-5 w-5" />
                          </button>
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
      )}

      {activeSection === 'calendar' && (
        <CalendarComponent
          userEmail={userEmail}
          userRole="accountant"
          tasks={assignedTasks.map(task => ({
            id: parseInt(task.id),
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigned_to: task.assignedTo,
            user_id: task.companyId || 0,
            company_name: task.companyName || 'Neznáma firma',
            created_by: task.createdBy,
            due_date: task.dueDate,
            created_at: task.createdAt,
            updated_at: task.createdAt
          }))}
          companies={companies}
          onTaskUpdate={() => {
            // Reload tasks after update
            const loadAccountantData = async () => {
              try {
                const assignedCompanies = await apiService.getAccountantCompanies(userEmail);
                setCompanies(assignedCompanies);

                const companyTasksArrays = await Promise.all(
                  assignedCompanies.map((company) => apiService.getCompanyTasks(company.id))
                );
                const allCompanyTasks = companyTasksArrays.flat();

                const convertedTasks: Task[] = allCompanyTasks.map(apiTask => ({
                  id: apiTask.id.toString(),
                  title: apiTask.title,
                  description: apiTask.description || '',
                  status: apiTask.status,
                  priority: apiTask.priority,
                  assignedTo: apiTask.assigned_to,
                  dueDate: apiTask.due_date || '',
                  createdAt: apiTask.created_at,
                  createdBy: apiTask.created_by,
                  category: 'other',
                  companyId: apiTask.user_id,
                  companyName: apiTask.company_name
                }));

                setAssignedTasks(convertedTasks);
              } catch (error) {
                console.error('Chyba pri načítaní dát účtovníka:', error);
              } finally {
                setLoadingTasks(false);
                setLoadingCompanies(false);
              }
            };

            loadAccountantData();
          }}
        />
      )}

      {activeSection === 'messages' && (
        <div className="bg-white rounded-lg shadow-md">
          <MessagesList 
            userEmail={userEmail} 
            userRole="accountant" 
            onMessageAction={loadUnreadMessagesCount}
          />
        </div>
      )}

      {/* Default Overview Section */}
      {activeSection === 'overview' && (
        <>
          {/* Moje úlohy */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Moje úlohy</h2>
            </div>

            <div className="p-6">
              {loadingTasks ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
                </div>
              ) : assignedTasks.length > 0 ? (
                <div className="space-y-4">
                  {assignedTasks.map((task) => (
                    <div key={task.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                              <span>{task.companyName}</span>
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>Termín: {new Date(task.dueDate).toLocaleDateString('sk-SK')}</span>
                            </div>
                            {task.estimatedHours && (
                              <div>
                                <span>Odhad: {task.estimatedHours}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Vytvoril: {task.createdBy} | Kategória: {task.category}
                        </div>
                        <div className="flex space-x-2">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Začať prácu
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Dokončiť
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const company = companies.find(c => c.id === task.companyId);
                              if (company) {
                                handleOpenCompanyDashboard(company);
                              }
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Otvoriť firmu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne priradené úlohy</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Zatiaľ vám neboli priradené žiadne úlohy od firiem.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeSection === 'timeclock' && (
        <div className="space-y-6">
          {companies.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500 mb-4">Nemáte priradené žiadne firmy pre dochádzku.</p>
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
                        <h3 className="font-medium text-gray-900">{company.name}</h3>
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
                      Dochádzka - {selectedCompanyForAttendance.name}
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
                    companyName={selectedCompanyForAttendance.name} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'attendance-report' && (
        <div className="space-y-6">
          {companies.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500 mb-4">Nemáte priradené žiadne firmy pre report dochádzky.</p>
              </div>
            </div>
          ) : companies.length === 1 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Report dochádzky</h3>
                <p className="mt-1 text-sm text-gray-500 mb-4">Report dochádzky pre {companies[0].name}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vyberte firmu pre report dochádzky</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompanyForAttendance(company)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <ChartBarIcon className="h-6 w-6 text-red-600" />
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{company.name}</h3>
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
                      Report dochádzky - {selectedCompanyForAttendance.name}
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
                  <div className="text-center py-12">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Report dochádzky</h3>
                    <p className="mt-1 text-sm text-gray-500 mb-4">Report dochádzky pre {selectedCompanyForAttendance.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

              {/* Company Dashboard Modal */}
        {selectedCompanyForDashboard && (
          <CompanyDashboard
            company={selectedCompanyForDashboard}
            onClose={() => setSelectedCompanyForDashboard(null)}
          />
        )}

        {/* Task Modal */}
        {!loadingCompanies && companies.length > 0 && (
          <TaskModal
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
            task={editingTask}
            companyEmployees={[]} // Prázdny array pre účtovníka
            company={{ id: companies[0].id, name: companies[0].company_name || '' }}
            isAccountant={true}
            assignedCompanies={companies.map(company => ({
              id: company.id,
              name: company.company_name || '',
              ico: company.ico || ''
            }))}
          />
        )}

        {/* File Upload Modal */}
        {!loadingCompanies && companies.length > 0 && (
                      <FileUploadModal
              isOpen={showFileUploadModal}
              onClose={() => setShowFileUploadModal(false)}
              companyId={companies.length > 0 ? companies[0].id : undefined}
              onFileUpload={handleFileUpload}
            />
        )}

        {/* File Preview Modal */}
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

export default AccountantDashboard;

