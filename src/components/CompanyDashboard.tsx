import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  UserIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  EnvelopeIcon,
  FolderIcon,
  CalendarIcon,
  CloudIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import FileManager from './FileManager';
import TaskModal, { Task, Employee } from './TaskModal';
import MessagesList from './MessagesList';
import MessageModal from './MessageModal';
import DropboxIntegration from './DropboxIntegration';
import HRDashboard from './HRDashboard';
import PayrollPeriodsModal from './PayrollPeriodsModal';
// import AccountingDashboard from './AccountingDashboard'; // Už sa nepoužíva

import { apiService } from '../services/apiService';
import { Company as ApiCompany, FileData } from '../services/apiService';
import { hrService } from '../services/hrService';
import { accountingService } from '../services/accountingService';

// Používame API typy, ale zachovávame kompatibilitu s existujúcimi komponentmi
type Company = ApiCompany;

interface CompanyDashboardProps {
  company: Company;
  onClose: () => void;
  userEmail: string;
  userRole?: 'admin' | 'accountant' | 'company';
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ company, onClose, userEmail, userRole = 'company' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');





  // Skutoční zamestnanci firmy z HR modulu
  const [companyEmployees, setCompanyEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Načítavame skutočné správy cez MessagesList komponent
  const [, setUnreadMessagesCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({
    receivedUnreadCount: 0,
    sentUnreadCount: 0,
    totalUnreadCount: 0
  });

  // Súbory pre firmu - načítané z fileService
  const [files, setFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Úlohy pre firmu - načítané z taskService
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);



  // State pre TaskModal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // State pre MessageModal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState<string>('');

  // State pre PayrollPeriodsModal
  const [showPayrollPeriodsModal, setShowPayrollPeriodsModal] = useState(false);

  // Funkcia na načítanie počtu neprečítaných správ pre konkrétnu firmu
  const loadUnreadMessagesCount = useCallback(async () => {
    try {
      const unreadCount = await apiService.getCompanyUnreadCount(company.id);
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ pre firmu:', error);
    }
  }, [company.id]);

  // Funkcia na načítanie rozlíšených počtov neprečítaných správ pre konkrétnu firmu
  const loadUnreadCounts = useCallback(async () => {
    try {
      const counts = await apiService.getCompanyUnreadCounts(company.id);
      setUnreadCounts(counts);
      setUnreadMessagesCount(counts.totalUnreadCount);
    } catch (error) {
      console.error('Chyba pri načítaní rozlíšených počtov správ pre firmu:', error);
    }
  }, [company.id]);

  // Funkcia na načítanie zamestnancov firmy z HR modulu
  const loadEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const employees = await hrService.getEmployees(company.id);
      
      // Konvertujeme HR zamestnancov na formát potrebný pre TaskModal
      const convertedEmployees: Employee[] = employees.map(emp => ({
        id: emp.id.toString(),
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        role: emp.position,
        department: emp.department || 'Nešpecifikované'
      }));
      
      setCompanyEmployees(convertedEmployees);
    } catch (error) {
      console.error('Chyba pri načítaní zamestnancov:', error);
      setCompanyEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [company.id]);

  // Funkcia na otvorenie modalu pre kontaktovanie účtovníka
  const handleContactAccountant = (accountantEmail: string) => {
    setSelectedAccountant(accountantEmail);
    setShowMessageModal(true);
  };





  const handleEmptyTrash = async () => {
    try {
      await apiService.emptyTrash(company.id);
      // Refresh súborov po vyprázdnení kôša
      const updatedFiles = await apiService.getCompanyFiles(company.id);
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Chyba pri vyprázdňovaní kôša:', error);
    }
  };

  // Handler funkcie pre súbory
  const handleFileUpload = (file: FileData) => {
    setFiles(prev => [file, ...prev]);
  };

  const handleFileDelete = async (fileId: number) => {
    try {
      await apiService.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Chyba pri mazaní súboru:', error);
    }
  };

  const handleFileDownload = async (file: FileData) => {
    try {
      const blob = await apiService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Chyba pri sťahovaní súboru:', error);
      alert('Chyba pri sťahovaní súboru');
    }
  };

  const handleFilePreview = async (file: FileData) => {
    try {
      await apiService.previewFile(file.id);
    } catch (error) {
      console.error('Chyba pri náhľade súboru:', error);
    }
  };

  // Handler funkcie pre úlohy
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
        // Update existing task - convert TaskModal Task to API Task format
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
        // Create new task - convert TaskModal Task to API Task format
        const apiTaskData = {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedToEmail || task.assignedTo, // Používame email ak je dostupný
          due_date: task.dueDate,
          category: task.category,
          estimated_hours: task.estimatedHours,
          company_id: company.id,
          created_by: userEmail,
          company_name: company.name
        };
        
        await apiService.createTask(apiTaskData);
        
        // Po vytvorení úlohy znovu načítame všetky úlohy z API
        console.log('CompanyDashboard: Znovu načítavam úlohy po vytvorení novej úlohy');
        const companyTasks = await apiService.getCompanyTasks(company.id);
        console.log('CompanyDashboard: Načítané úlohy po vytvorení:', companyTasks);
        
        // Konvertujeme API Task na TaskModal Task
        const convertedTasks: Task[] = companyTasks.map(apiTask => ({
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
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Chyba pri ukladaní úlohy:', error);
    }
  };

  // Helper funkcie
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
      unpaid: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Čakajúce',
      completed: 'Dokončené',
      in_progress: 'V spracovaní',
      cancelled: 'Zrušené',
      unpaid: 'Nezaplatené',
      paid: 'Zaplatené',
      overdue: 'Po splatnosti',
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

  // Štatistiky
  const stats = {
    totalFiles: files.length,
    documentFiles: files.filter(f => f.category === 'documents').length,
    invoiceFiles: files.filter(f => f.category === 'invoices').length,
    contractFiles: files.filter(f => f.category === 'contracts').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalInvoices: invoices.length,
    // Len nezaplatené faktúry od DIVIDENDA s.r.o.
    unpaidInvoices: invoices.filter(i => {
      const isUnpaid = (i.kc_likv && parseFloat(i.kc_likv) > 0) || i.status === 'unpaid' || i.status === 'overdue';
      const isDividenda = i.supplier_name?.includes('DIVIDENDA') || i.supplier_name?.includes('36543039');
      return isUnpaid && isDividenda;
    }).length,
    totalAmount: invoices.filter(i => {
      const isUnpaid = (i.kc_likv && parseFloat(i.kc_likv) > 0) || i.status === 'unpaid' || i.status === 'overdue';
      const isDividenda = i.supplier_name?.includes('DIVIDENDA') || i.supplier_name?.includes('36543039');
      return isUnpaid && isDividenda;
    }).reduce((sum, i) => sum + (parseFloat(i.kc_likv) || parseFloat(i.total_amount) || 0), 0),
    totalFileSize: files.reduce((sum, f) => sum + f.file_size, 0),
  };

  

  // Načítanie súborov, úloh a dokumentov pri otvorení dashboardu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingFiles(true);
        setLoadingTasks(true);
        setLoadingInvoices(true);
        
        // Načítanie súborov
        const companyFiles = await apiService.getCompanyFiles(company.id);
        setFiles(companyFiles);
        
        // Načítanie úloh
        const companyTasks = await apiService.getCompanyTasks(company.id);
        
        // Načítanie prijatých faktúr
        const receivedInvoices = await accountingService.getReceivedInvoices(company.id, { limit: 1000 });
        setInvoices(receivedInvoices);
        
        
        // Konvertujeme API Task na TaskModal Task
        const convertedTasks: Task[] = companyTasks.map(apiTask => ({
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
        console.log('CompanyDashboard: Konvertované úlohy:', convertedTasks);
        setTasks(convertedTasks);

        // Načítanie rozlíšených počtov neprečítaných správ
        await loadUnreadCounts();

        // Načítanie zamestnancov
        await loadEmployees();

      } catch (error) {
        console.error('Chyba pri načítaní dát:', error);
        console.error('Error details:', error);
      } finally {
        setLoadingFiles(false);
        setLoadingTasks(false);
        setLoadingInvoices(false);
      }
    };

    loadData();
  }, [company.id, loadUnreadMessagesCount, loadUnreadCounts, loadEmployees]);

  // Automatické aktualizácie počtu správ každých 30 sekúnd
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCounts();
    }, 30000); // 30 sekúnd

    return () => clearInterval(interval);
  }, [loadUnreadCounts]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Súbory</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              <p className="text-sm text-gray-500">{stats.documentFiles} dokumentov</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('tasks')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Úlohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              <p className="text-sm text-gray-500">{stats.pendingTasks} čakajúcich</p>
              <p className="text-xs text-green-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/accounting/received-invoices?filter=dividenda')}
          className="bg-white dark:bg-dark-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nezaplatené faktúry</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unpaidInvoices}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalAmount.toFixed(2)} € celkovo</p>
              <p className="text-xs text-yellow-600 mt-1">DIVIDENDA s.r.o. - kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('messages')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Správy</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCounts.totalUnreadCount}</p>
              <div className="text-sm text-gray-500">
                <div>Prijaté: {unreadCounts.receivedUnreadCount}</div>
                <div>Odoslané: {unreadCounts.sentUnreadCount}</div>
              </div>
              <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>




      </div>

      {/* Rýchle akcie */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => setActiveTab('hr')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">HR, Personalistika a mzdy</p>
              <p className="text-2xl font-bold text-gray-900">👥</p>
              <p className="text-sm text-gray-500">Správa ľudských zdrojov</p>
              <p className="text-xs text-orange-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('tasks')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Úlohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              <p className="text-sm text-gray-500">{stats.pendingTasks} čakajúcich</p>
              <p className="text-xs text-green-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('files')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Súbory</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              <p className="text-sm text-gray-500">{formatFileSize(stats.totalFileSize)} celkovo</p>
              <p className="text-xs text-indigo-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => setShowPayrollPeriodsModal(true)}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Účtovné obdobie</p>
              <p className="text-2xl font-bold text-gray-900">📅</p>
              <p className="text-sm text-gray-500">Mzdové obdobia</p>
              <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );



  const renderTasks = () => {
    console.log('CompanyDashboard: renderTasks - loadingTasks:', loadingTasks, 'tasks.length:', tasks.length);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Úlohy</h2>
          <button 
            onClick={handleAddTask}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Pridať úlohu
          </button>
        </div>

        {loadingTasks ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
          </div>
        ) : (
          <>
            {/* Zoznam úloh */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {task.dueDate}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {task.assignedTo}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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

            {/* Prázdny stav */}
            {tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne úlohy</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Zatiaľ neboli vytvorené žiadne úlohy pre túto firmu.
                </p>
                <button
                  onClick={handleAddTask}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Vytvoriť prvú úlohu
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };



  const renderAccounting = () => {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <CalculatorIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Účtovníctvo</h3>
        <p className="mt-1 text-sm text-gray-500">
          Pre prístup k účtovníctvu kliknite na tlačidlo nižšie.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/accounting')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Otvoriť účtovníctvo
          </button>
        </div>
      </div>
    );
  };

  const renderAccountants = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Priradení účtovníci</h2>
        <div className="text-sm text-gray-500">
          {company.assignedToAccountants?.length || 0} účtovníkov priradených k firme
        </div>
      </div>

      {company.assignedToAccountants && company.assignedToAccountants.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Účtovník
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posledné prihlásenie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {company.assignedToAccountants.map((accountantEmail, index) => {
                  // Simulované dáta pre účtovníka (v reálnej aplikácii by sa načítali z databázy)
                  const accountant = {
                    id: index + 1,
                    name: accountantEmail.includes('@') ? accountantEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : accountantEmail,
                    email: accountantEmail,
                    status: 'active',
                    lastLogin: '1 hodinu',
                    department: 'Účtovníctvo'
                  };

                  return (
                    <tr key={accountant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {accountant.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{accountant.name}</div>
                            <div className="text-sm text-gray-500">{accountant.department}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{accountant.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktívny
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {accountant.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => handleContactAccountant(accountant.email)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Kontaktovať
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadni priradení účtovníci</h3>
          <p className="mt-1 text-sm text-gray-500">
            K tejto firme zatiaľ nie sú priradení žiadni účtovníci.
          </p>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <MessagesList
      userEmail={userEmail}
      userRole={userRole === 'company' ? 'user' : userRole}
      companyId={company.id}
      isAdmin={userRole === 'admin'}
      onMessageAction={loadUnreadCounts}
    />
  );


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={onClose}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Dashboard
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{company.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{company.name} - Dashboard</h1>
              <p className="text-gray-600">IČO: {company.ico} | OR: {company.business_registry}</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-blue-800">Aktívna firma</p>
                <p className="text-xs text-blue-600">{company.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Prehľad', icon: ChartBarIcon },
              { id: 'tasks', name: 'Úlohy', icon: ClipboardDocumentListIcon },
              { id: 'files', name: 'Súbory', icon: FolderIcon },
              { id: 'dropbox', name: 'Dropbox', icon: CloudIcon },
              { id: 'hr', name: 'HR', icon: UsersIcon },
              { id: 'accountants', name: 'Účtovníci', icon: UserIcon },
              { id: 'accounting', name: 'Účtovníctvo', icon: DocumentTextIcon },
              { id: 'messages', name: 'Správy', icon: EnvelopeIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'files' && (
            <div>
              {(() => {
                console.log('CompanyDashboard: Rendering files tab, loadingFiles:', loadingFiles, 'files.length:', files.length);
                return null;
              })()}
              {loadingFiles ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Načítavam súbory...</p>
                </div>
              ) : (
                <FileManager
                  files={files}
                  onFileUpload={handleFileUpload}
                  onFileDelete={handleFileDelete}
                  onFileDownload={handleFileDownload}
                  onFilePreview={handleFilePreview}
                  companyId={company.id}
                  loading={loadingFiles}
                  userRole={userRole}
                  onEmptyTrash={handleEmptyTrash}
                />
              )}
            </div>
          )}
          {activeTab === 'dropbox' && (
            <div className="bg-white rounded-lg shadow-md">
              {(() => {
                console.log('=== COMPANY DASHBOARD - DROPBOX TAB ===');
                console.log('CompanyDashboard: Rendering dropbox tab');
                console.log('CompanyDashboard: activeTab:', activeTab);
                console.log('CompanyDashboard: company.id:', company.id);
                console.log('CompanyDashboard: userEmail:', userEmail);
                console.log('CompanyDashboard: company.owner_email:', company.owner_email);
                console.log('CompanyDashboard: userRole:', userRole);
                console.log('CompanyDashboard: company.name:', company.name);
                return null;
              })()}
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Dropbox súbory</h2>
                <p className="text-sm text-gray-600 mt-1">Vaše zdieľané súbory v Dropboxe</p>
              </div>
              <div className="p-6">
                <DropboxIntegration
                  companyId={company.id}
                  userEmail={userEmail}
                  companyEmail={company.owner_email}
                  isCompanyView={true}
                  userRole={userRole}
                  companyName={company.name}
                  companyICO={company.ico}
                  onFileSelect={(file) => {
                    console.log('Selected Dropbox file:', file);
                    // Tu môžeme implementovať logiku pre import súboru z Dropbox
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === 'hr' && (
            <HRDashboard companyId={company.id} />
          )}
          {activeTab === 'accountants' && renderAccountants()}
          {activeTab === 'accounting' && renderAccounting()}
          {activeTab === 'messages' && renderMessages()}
        </div>

        {/* Task Modal */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          task={editingTask}
          companyEmployees={companyEmployees}
          company={company}
          isAccountant={userRole === 'accountant'}
          userEmail={userEmail}
        />

        {/* Message Modal */}
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedAccountant('');
          }}
          onSend={() => {
            setShowMessageModal(false);
            setSelectedAccountant('');
            loadUnreadCounts();
          }}
          senderEmail={userEmail}
          userRole={userRole === 'company' ? 'user' : userRole}
          companyId={company.id}
          initialRecipient={selectedAccountant}
        />

        {/* Payroll Periods Modal */}
        <PayrollPeriodsModal
          isOpen={showPayrollPeriodsModal}
          onClose={() => setShowPayrollPeriodsModal(false)}
          companyId={company.id}
          userEmail={userEmail}
          userRole={userRole}
        />

      </div>
    </div>
  );
};

export default CompanyDashboard;
