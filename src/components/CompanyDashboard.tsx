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
  DocumentIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  EnvelopeIcon,
  FolderIcon,
  CloudArrowDownIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import FileManager from './FileManager';
import TaskModal, { Task, Employee } from './TaskModal';
import { apiService } from '../services/apiService';
import { Company as ApiCompany, Task as ApiTask, FileData } from '../services/apiService';

// Používame API typy, ale zachovávame kompatibilitu s existujúcimi komponentmi
type Company = ApiCompany;

interface CompanyDashboardProps {
  company: Company;
  onClose: () => void;
}

const CompanyDashboard: React.FC<CompanyDashboardProps> = ({ company, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Simulované dáta pre firmu
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Výročná správa 2024', type: 'report', status: 'pending', date: '15.12.2024', priority: 'high' },
    { id: 2, name: 'DPH priznanie Q4', type: 'tax', status: 'completed', date: '10.12.2024', priority: 'high' },
    { id: 3, name: 'Zmluva s dodávateľom', type: 'contract', status: 'in_progress', date: '08.12.2024', priority: 'medium' },
    { id: 4, name: 'Faktúra č. 2024/001', type: 'invoice', status: 'pending', date: '05.12.2024', priority: 'low' },
    { id: 5, name: 'Účtovné doklady', type: 'accounting', status: 'completed', date: '01.12.2024', priority: 'medium' },
  ]);

  // Simulované zamestnanci firmy
  const [companyEmployees] = useState<Employee[]>([
    { id: '1', name: 'Mgr. Jana Nováková', email: 'jana.novakova@firma.sk', role: 'Účtovníčka', department: 'Účtovníctvo' },
    { id: '2', name: 'Ing. Peter Kováč', email: 'peter.kovac@firma.sk', role: 'Auditor', department: 'Audit' },
    { id: '3', name: 'Mgr. Anna Svobodová', email: 'anna.svobodova@firma.sk', role: 'Personalistka', department: 'HR' },
    { id: '4', name: 'Ing. Martin Horváth', email: 'martin.horvath@firma.sk', role: 'IT administrátor', department: 'IT' },
    { id: '5', name: 'Mgr. Eva Králová', email: 'eva.kralova@firma.sk', role: 'Právnička', department: 'Právne oddelenie' },
    { id: '6', name: 'Ing. Tomáš Veselý', email: 'tomas.vesely@firma.sk', role: 'Manažér operácií', department: 'Operácie' },
  ]);



  const [invoices, setInvoices] = useState([
    { id: 1, number: '2024/001', amount: 1500, status: 'unpaid', dueDate: '31.12.2024', description: 'Účtovné služby - december 2024' },
    { id: 2, number: '2024/002', amount: 800, status: 'paid', dueDate: '30.11.2024', description: 'Daňové poradenstvo' },
    { id: 3, number: '2024/003', amount: 1200, status: 'overdue', dueDate: '15.11.2024', description: 'Audit účtovných dokladov' },
    { id: 4, number: '2024/004', amount: 950, status: 'unpaid', dueDate: '15.01.2025', description: 'Právne poradenstvo' },
  ]);

  const [messages, setMessages] = useState([
    { id: 1, from: 'Účtovník', subject: 'Výročná správa pripravená', content: 'Výročná správa je pripravená na podpis. Potrebujeme vaše potvrdenie.', date: '15.12.2024', read: false },
    { id: 2, from: 'Auditor', subject: 'Audit dokončený', content: 'Audit vašich účtovných dokladov bol úspešne dokončený. Všetko je v poriadku.', date: '12.12.2024', read: true },
    { id: 3, from: 'Systém', subject: 'Nové DPH priznanie', content: 'Bolo vytvorené nové DPH priznanie za Q4 2024. Prosím, overte údaje.', date: '10.12.2024', read: false },
  ]);

  // Súbory pre firmu - načítané z fileService
  const [files, setFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Úlohy pre firmu - načítané z taskService
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Načítanie súborov a úloh pri otvorení dashboardu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingFiles(true);
        setLoadingTasks(true);
        
        // Načítanie súborov
        const companyFiles = await apiService.getCompanyFiles(company.id);
        setFiles(companyFiles);
        
        // Načítanie úloh
        const companyTasks = await apiService.getCompanyTasks(company.id);
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
      } catch (error) {
        console.error('Chyba pri načítaní dát:', error);
      } finally {
        setLoadingFiles(false);
        setLoadingTasks(false);
      }
    };

    loadData();
  }, [company.id]);

  const [stats, setStats] = useState({
    totalDocuments: documents.length,
    pendingDocuments: documents.filter(d => d.status === 'pending').length,
    completedDocuments: documents.filter(d => d.status === 'completed').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalInvoices: invoices.length,
    unpaidInvoices: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length,
    totalAmount: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
    unreadMessages: messages.filter(m => !m.read).length,
    totalFiles: files.length,
    totalFileSize: files.reduce((sum, f) => sum + f.file_size, 0),
  });

  // State pre TaskModal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Aktualizuj štatistiky pri zmene dát
  useEffect(() => {
    setStats({
      totalDocuments: documents.length,
      pendingDocuments: documents.filter(d => d.status === 'pending').length,
      completedDocuments: documents.filter(d => d.status === 'completed').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalInvoices: invoices.length,
      unpaidInvoices: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length,
      totalAmount: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
      unreadMessages: messages.filter(m => !m.read).length,
      totalFiles: files.length,
      totalFileSize: files.reduce((sum, f) => sum + f.file_size, 0),
    });
  }, [documents, tasks, invoices, messages, files]);

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

  // Funkcie pre správu súborov
  const handleFileUpload = (file: FileData) => {
    setFiles(prev => {
      const newFiles = [...prev, file];
      // Okamžite aktualizuj štatistiky
      setStats(currentStats => ({
        ...currentStats,
        totalFiles: newFiles.length,
        totalFileSize: newFiles.reduce((sum, f) => sum + (f.file_size || 0), 0),
      }));
      return newFiles;
    });
  };

  const handleFileDelete = (fileId: number) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      // Okamžite aktualizuj štatistiky
      setStats(currentStats => ({
        ...currentStats,
        totalFiles: newFiles.length,
        totalFileSize: newFiles.reduce((sum, f) => sum + (f.file_size || 0), 0),
      }));
      return newFiles;
    });
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
      alert('Nepodarilo sa stiahnuť súbor');
    }
  };

  const handleFileOpen = async (file: FileData) => {
    try {
      const blob = await apiService.previewFile(file.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Chyba pri otváraní súboru:', error);
      alert('Nepodarilo sa otvoriť súbor');
    }
  };

  // Funkcie pre správu úloh
  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      if (editingTask) {
        // Editácia existujúcej úlohy
        await apiService.updateTask(parseInt(editingTask.id), {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assigned_to: taskData.assignedTo,
          due_date: taskData.dueDate,
        });
        
        // Aktualizuj lokálny stav
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id 
            ? { ...task, ...taskData }
            : task
        ));
      } else {
        // Pridanie novej úlohy
        const response = await apiService.createTask({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assigned_to: taskData.assignedTo,
          company_id: company.id,
          company_name: company.name,
          created_by: 'current_user', // TODO: získať aktuálneho používateľa
          due_date: taskData.dueDate,
        });
        
        // Pridaj novú úlohu do lokálneho stavu
        const newTask: Task = {
          id: response.taskId.toString(),
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assignedTo: taskData.assignedTo,
          dueDate: taskData.dueDate,
          createdAt: new Date().toISOString(),
          createdBy: 'current_user',
          category: taskData.category,
        };
        
        setTasks(prev => [...prev, newTask]);
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
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Chyba pri mazaní úlohy:', error);
        alert('Chyba pri mazaní úlohy');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => setActiveTab('documents')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dokumenty</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              <p className="text-sm text-gray-500">{stats.pendingDocuments} čakajúcich</p>
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
          onClick={() => setActiveTab('invoices')}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nezaplatené faktúry</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unpaidInvoices}</p>
              <p className="text-sm text-gray-500">{stats.totalAmount} €</p>
              <p className="text-xs text-red-600 mt-1">Kliknite pre zobrazenie</p>
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
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              <p className="text-sm text-gray-500">{stats.unreadMessages} neprečítaných</p>
              <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
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

      {/* Najnovšie aktivity */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Najnovšie aktivity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {documents.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-sm text-gray-500">{doc.date}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(doc.status)}
                  {getPriorityBadge(doc.priority)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Dokumenty</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => setActiveTab('files')}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nahrať súbory
          </button>
        </div>
      </div>

      {/* Simulované dokumenty */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-md font-medium text-gray-900">Systémové dokumenty</h3>
          <p className="text-sm text-gray-500">Dokumenty vytvorené systémom</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dokument
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priorita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dátum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcie
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{doc.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPriorityBadge(doc.priority)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nahrané súbory */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-900">Nahrané súbory</h3>
            <p className="text-sm text-gray-500">Súbory nahrané používateľmi</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Názov súboru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategória
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veľkosť
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nahral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dátum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">{file.original_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {file.file_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.uploaded_by}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.created_at).toLocaleDateString('sk-SK')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleFileDownload(file)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Stiahnuť"
                        >
                          <CloudArrowDownIcon className="h-4 w-4" />
                        </button>
                                                 <button 
                           onClick={() => handleFileOpen(file)}
                           className="text-primary-600 hover:text-primary-900"
                           title="Otvoriť súbor"
                         >
                           <EyeIcon className="h-4 w-4" />
                         </button>
                        <button 
                          onClick={() => handleFileDelete(file.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Vymazať"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prázdny stav pre súbory */}
      {files.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne nahrané súbory</h3>
          <p className="mt-1 text-sm text-gray-500">
            Zatiaľ neboli nahrané žiadne súbory. Kliknite na "Nahrať súbory" pre pridanie.
          </p>
          <button
            onClick={() => setActiveTab('files')}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Nahrať súbory
          </button>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Úlohy</h2>
        <button 
          onClick={handleAddTask}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nová úloha
        </button>
      </div>

      {loadingTasks ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
        </div>
      ) : (
        <>
          {/* Filtre a vyhľadávanie */}
          <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Hľadať úlohy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Všetky statusy</option>
            <option value="pending">Čakajúce</option>
            <option value="in_progress">V spracovaní</option>
            <option value="completed">Dokončené</option>
            <option value="cancelled">Zrušené</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">Všetky priority</option>
            <option value="urgent">Urgentná</option>
            <option value="high">Vysoká</option>
            <option value="medium">Stredná</option>
            <option value="low">Nízka</option>
          </select>
        </div>
      </div>

      {/* Zoznam úloh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserIcon className="h-4 w-4 mr-2" />
                    <span>{task.assignedTo}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Termín: {new Date(task.dueDate).toLocaleDateString('sk-SK')}</span>
                  </div>
                  {task.estimatedHours && (
                    <div className="text-sm text-gray-500">
                      Odhadované hodiny: {task.estimatedHours}h
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 ml-4">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Vytvoril: {task.createdBy}
              </div>
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
            Zatiaľ neboli vytvorené žiadne úlohy.
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
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-primary-600" />
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
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-700">
                            <EnvelopeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-700">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadni priradení účtovníci</h3>
          <p className="mt-1 text-sm text-gray-500">
            K tejto firme nie sú priradení žiadni účtovníci. Admin môže priradiť účtovníkov v sekcii správy firiem.
          </p>
        </div>
      )}

      {/* Informácie o správe účtovníkov */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <UserIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Správa účtovníkov
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>• Účtovníci sú priradení k firme cez Admin dashboard</p>
              <p>• Každý účtovník má prístup k dashboardu tejto firmy</p>
              <p>• Účtovníci môžu spravovať dokumenty, úlohy a súbory firmy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Správy</h2>
        <div className="text-sm text-gray-500">
          {stats.unreadMessages} neprečítaných správ
        </div>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${message.read ? 'border-gray-200' : 'border-blue-500'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900">{message.subject}</h3>
                  {!message.read && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Nové
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Od: {message.from}</p>
                <p className="text-sm text-gray-600 mt-2">{message.content}</p>
                <p className="text-sm text-gray-400 mt-2">{message.date}</p>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Odpovedať
                </button>
                <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                  Označiť ako prečítané
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-7xl shadow-lg rounded-md bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.name} - Dashboard</h1>
            <p className="text-gray-600">IČO: {company.ico} | OR: {company.business_registry}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

                            {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="-mb-px flex space-x-8">
                        {[
                          { id: 'overview', name: 'Prehľad', icon: ChartBarIcon },
                          { id: 'documents', name: 'Dokumenty', icon: DocumentTextIcon },
                          { id: 'tasks', name: 'Úlohy', icon: ClipboardDocumentListIcon },
                          { id: 'invoices', name: 'Faktúry', icon: CurrencyDollarIcon },
                          { id: 'files', name: 'Súbory', icon: FolderIcon },
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
                      {activeTab === 'documents' && renderDocuments()}
                      {activeTab === 'tasks' && renderTasks()}
                      {activeTab === 'invoices' && renderInvoices()}
                      {activeTab === 'files' && (
                        <div>
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
                              companyId={company.id}
                            />
                          )}
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
                      />
                   </div>
                 </div>
               );
             };

export default CompanyDashboard;
