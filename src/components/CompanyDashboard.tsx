import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
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
  CloudIcon
} from '@heroicons/react/24/outline';
import FileManager from './FileManager';
import TaskModal, { Task, Employee } from './TaskModal';
import MessagesList from './MessagesList';
import DropboxIntegration from './DropboxIntegration';

import { apiService } from '../services/apiService';
import { Company as ApiCompany, FileData } from '../services/apiService';

// Používame API typy, ale zachovávame kompatibilitu s existujúcimi komponentmi
type Company = ApiCompany;

interface CompanyDashboardProps {
  company: Company;
  onClose: () => void;
  userEmail: string;
  userRole?: 'admin' | 'accountant' | 'company';
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ company, onClose, userEmail, userRole = 'company' }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Simulované dáta pre stare dokumenty (historické - už sa nepoužívajú)
  const oldDocuments = [
    { id: 1, name: 'Výročná správa 2024', type: 'report', status: 'pending', date: '15.12.2024', priority: 'high' },
    { id: 2, name: 'DPH priznanie Q4', type: 'tax', status: 'completed', date: '10.12.2024', priority: 'high' },
    { id: 3, name: 'Zmluva s dodávateľom', type: 'contract', status: 'in_progress', date: '08.12.2024', priority: 'medium' },
    { id: 4, name: 'Faktúra č. 2024/001', type: 'invoice', status: 'pending', date: '05.12.2024', priority: 'low' },
    { id: 5, name: 'Účtovné doklady', type: 'accounting', status: 'completed', date: '01.12.2024', priority: 'medium' },
  ];

  // Simulované zamestnanci firmy
  const [companyEmployees] = useState<Employee[]>([
    { id: '1', name: 'Mgr. Jana Nováková', email: 'jana.novakova@firma.sk', role: 'Účtovníčka', department: 'Účtovníctvo' },
    { id: '2', name: 'Ing. Peter Kováč', email: 'peter.kovac@firma.sk', role: 'Auditor', department: 'Audit' },
    { id: '3', name: 'Mgr. Anna Svobodová', email: 'anna.svobodova@firma.sk', role: 'Personalistka', department: 'HR' },
    { id: '4', name: 'Ing. Martin Horváth', email: 'martin.horvath@firma.sk', role: 'IT administrátor', department: 'IT' },
    { id: '5', name: 'Mgr. Eva Králová', email: 'eva.kralova@firma.sk', role: 'Právnička', department: 'Právne oddelenie' },
    { id: '6', name: 'Ing. Tomáš Veselý', email: 'tomas.vesely@firma.sk', role: 'Manažér operácií', department: 'Operácie' },
  ]);

  const [invoices] = useState([
    { id: 1, number: '2024/001', amount: 1500, status: 'unpaid', dueDate: '31.12.2024', description: 'Účtovné služby - december 2024' },
    { id: 2, number: '2024/002', amount: 800, status: 'paid', dueDate: '30.11.2024', description: 'Daňové poradenstvo' },
    { id: 3, number: '2024/003', amount: 1200, status: 'overdue', dueDate: '15.11.2024', description: 'Audit účtovných dokladov' },
    { id: 4, number: '2024/004', amount: 950, status: 'unpaid', dueDate: '15.01.2025', description: 'Právne poradenstvo' },
  ]);

  // Načítavame skutočné správy cez MessagesList komponent
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Súbory pre firmu - načítané z fileService
  const [files, setFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Úlohy pre firmu - načítané z taskService
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);



  // State pre TaskModal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Funkcia na načítanie počtu neprečítaných správ
  const loadUnreadMessagesCount = async () => {
    try {
      const unreadCount = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error('Chyba pri načítaní počtu neprečítaných správ:', error);
    }
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
    unpaidInvoices: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length,
    totalAmount: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
    unreadMessages: unreadMessagesCount,
    totalFileSize: files.reduce((sum, f) => sum + f.file_size, 0),
  };

  console.log('CompanyDashboard: Stats objekt:', stats);
  console.log('CompanyDashboard: Tasks state:', tasks);

  // Načítanie súborov, úloh a dokumentov pri otvorení dashboardu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingFiles(true);
        setLoadingTasks(true);
        
        console.log('CompanyDashboard: Začínam načítanie dát pre firmu ID:', company.id);
        console.log('CompanyDashboard: User email:', userEmail);
        
        // Načítanie súborov
        const companyFiles = await apiService.getCompanyFiles(company.id);
        setFiles(companyFiles);
        
        // Načítanie úloh
        console.log('CompanyDashboard: Načítavam úlohy pre firmu ID:', company.id);
        const companyTasks = await apiService.getCompanyTasks(company.id);
        console.log('CompanyDashboard: Načítané úlohy z API:', companyTasks);
        
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

        // Načítanie počtu neprečítaných správ
        await loadUnreadMessagesCount();

      } catch (error) {
        console.error('Chyba pri načítaní dát:', error);
        console.error('Error details:', error);
      } finally {
        setLoadingFiles(false);
        setLoadingTasks(false);
      }
    };

    loadData();
  }, [company.id, userEmail]);

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

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faktúry</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unpaidInvoices}</p>
              <p className="text-sm text-gray-500">{stats.totalAmount} € celkovo</p>
            </div>
          </div>
        </div>

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
              <p className="text-2xl font-bold text-gray-900">{unreadMessagesCount}</p>
              <p className="text-sm text-gray-500">{stats.unreadMessages} neprečítaných</p>
              <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>
      </div>

      {/* Rýchle akcie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => setActiveTab('documents')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Súbory</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
              <p className="text-sm text-gray-500">Organizované v kategóriách</p>
              <p className="text-xs text-blue-600 mt-1">Kliknite pre zobrazenie</p>
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

  const renderInvoices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Faktúry</h2>
        <div className="text-sm text-gray-500">
          Celková suma nezaplatených: <span className="font-bold text-red-600">{stats.totalAmount} €</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Číslo faktúry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Popis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Splatnosť
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{invoice.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.amount} €</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {invoice.status === 'unpaid' && (
                        <button className="text-green-600 hover:text-green-900">
                          <CreditCardIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
                        <button className="text-primary-600 hover:text-primary-900">
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
      onMessageAction={loadUnreadMessagesCount}
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
              { id: 'invoices', name: 'Faktúry', icon: CurrencyDollarIcon },
              { id: 'files', name: 'Súbory', icon: FolderIcon },
              { id: 'dropbox', name: 'Dropbox', icon: CloudIcon },
              { id: 'accountants', name: 'Účtovníci', icon: UserIcon },
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
          {activeTab === 'invoices' && renderInvoices()}
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
                  onFileSelect={(file) => {
                    console.log('Selected Dropbox file:', file);
                    // Tu môžeme implementovať logiku pre import súboru z Dropbox
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === 'accountants' && renderAccountants()}
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
      </div>
    </div>
  );
};

export default CompanyDashboard;
