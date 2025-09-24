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
import PayslipDetailModal from './PayslipDetailModal';
// import AccountingDashboard from './AccountingDashboard'; // ULl sa nepouLlA�va

import { apiService } from '../services/apiService';
import { Company as ApiCompany, FileData } from '../services/apiService';
import { hrService } from '../services/hrService';
import { accountingService } from '../services/accountingService';
import { payrollService } from '../services/payrollService';

// PouLlA�vame API typy, ale zachovA?vame kompatibilitu s existujAscimi komponentmi
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
  // VA?platnA� pA?sky (firma)
  const [payslipsYear, setPayslipsYear] = useState<number>(new Date().getFullYear());
  const [payslipsMonth, setPayslipsMonth] = useState<number | ''>('');
  const [payslipsEmployeeId, setPayslipsEmployeeId] = useState<number | 'all'>('all');
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [payslipsRows, setPayslipsRows] = useState<Array<{
    employeeId: number;
    name: string;
    month?: number;
    gross?: number;
    net?: number;
    settlement?: number;
    workedDays?: number;
    workedHours?: number;
    socialInsurance?: number;
    healthInsurance?: number;
  }>>([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipModalEmployeeId, setPayslipModalEmployeeId] = useState<number | null>(null);
  // HR zamestnanci (raw) pre vA?platnA� pA?sky
  const [hrEmployeesRaw, setHrEmployeesRaw] = useState<any[]>([]);





  // Skuto�TnA� zamestnanci firmy z HR modulu
  const [companyEmployees, setCompanyEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Na�TA�tavame skuto�TnA� sprA?vy cez MessagesList komponent
  const [, setUnreadMessagesCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({
    receivedUnreadCount: 0,
    sentUnreadCount: 0,
    totalUnreadCount: 0
  });

  // SAsbory pre firmu - na�TA�tanA� z fileService
  const [files, setFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // Aslohy pre firmu - na�TA�tanA� z taskService
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

  // Funkcia na na�TA�tanie po�Ttu nepre�TA�tanA?ch sprA?v pre konkrA�tnu firmu
  const loadUnreadMessagesCount = useCallback(async () => {
    try {
      const unreadCount = await apiService.getCompanyUnreadCount(company.id);
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� po�Ttu nepre�TA�tanA?ch sprA?v pre firmu:', error);
    }
  }, [company.id]);

  // Funkcia na na�TA�tanie rozlA�L?enA?ch po�Ttov nepre�TA�tanA?ch sprA?v pre konkrA�tnu firmu
  const loadUnreadCounts = useCallback(async () => {
    try {
      const counts = await apiService.getCompanyUnreadCounts(company.id);
      setUnreadCounts(counts);
      setUnreadMessagesCount(counts.totalUnreadCount);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� rozlA�L?enA?ch po�Ttov sprA?v pre firmu:', error);
    }
  }, [company.id]);

  // Funkcia na na�TA�tanie zamestnancov firmy z HR modulu
  const loadEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const employees = await hrService.getEmployees(company.id);
      setHrEmployeesRaw(employees);
      
      // Konvertujeme HR zamestnancov na formA?t potrebnA? pre TaskModal
      const convertedEmployees: Employee[] = employees.map(emp => ({
        id: emp.id.toString(),
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        role: emp.position,
        department: emp.department || 'NeL?pecifikovanA�'
      }));
      
      setCompanyEmployees(convertedEmployees);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� zamestnancov:', error);
      setCompanyEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [company.id]);

  // Funkcia na otvorenie modalu pre kontaktovanie As�TtovnA�ka
  const handleContactAccountant = (accountantEmail: string) => {
    setSelectedAccountant(accountantEmail);
    setShowMessageModal(true);
  };





  const handleEmptyTrash = async () => {
    try {
      await apiService.emptyTrash(company.id);
      // Refresh sAsborov po vyprA?zdnenA� kA�L?a
      const updatedFiles = await apiService.getCompanyFiles(company.id);
      setFiles(updatedFiles);
    } catch (error) {
      console.error('Chyba pri vyprA?zdL�ovanA� kA�L?a:', error);
    }
  };

  // Handler funkcie pre sAsbory
  const handleFileUpload = (file: FileData) => {
    setFiles(prev => [file, ...prev]);
  };

  const handleFileDelete = async (fileId: number) => {
    try {
      await apiService.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Chyba pri mazanA� sAsboru:', error);
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
      console.error('Chyba pri sLAahovanA� sAsboru:', error);
      alert('Chyba pri sLAahovanA� sAsboru');
    }
  };

  const handleFilePreview = async (file: FileData) => {
    try {
      await apiService.previewFile(file.id);
    } catch (error) {
      console.error('Chyba pri nA?h�lade sAsboru:', error);
    }
  };

  // Handler funkcie pre Aslohy
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
      console.error('Chyba pri mazanA� Aslohy:', error);
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
          assigned_to: task.assignedToEmail || task.assignedTo, // PouLlA�vame email ak je dostupnA?
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
          assigned_to: task.assignedToEmail || task.assignedTo, // PouLlA�vame email ak je dostupnA?
          due_date: task.dueDate,
          category: task.category,
          estimated_hours: task.estimatedHours,
          company_id: company.id,
          created_by: userEmail,
          company_name: company.name
        };
        
        await apiService.createTask(apiTaskData);
        
        // Po vytvorenA� Aslohy znovu na�TA�tame vL?etky Aslohy z API
        console.log('CompanyDashboard: Znovu na�TA�tavam Aslohy po vytvorenA� novej Aslohy');
        const companyTasks = await apiService.getCompanyTasks(company.id);
        console.log('CompanyDashboard: Na�TA�tanA� Aslohy po vytvorenA�:', companyTasks);
        
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
          category: 'other', // Default kategAlria
        }));
        
        setTasks(convertedTasks);
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Chyba pri ukladanA� Aslohy:', error);
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
      pending: '�SakajAsce',
      completed: 'Dokon�TenA�',
      in_progress: 'V spracovanA�',
      cancelled: 'ZruL?enA�',
      unpaid: 'NezaplatenA�',
      paid: 'ZaplatenA�',
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
      low: 'NA�zka',
      medium: 'StrednA?',
      high: 'VysokA?',
      urgent: 'UrgentnA?',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[priority as keyof typeof labels] || priority}
      </span>
    );
  };

  // L�tatistiky
  const stats = {
    totalFiles: files.length,
    documentFiles: files.filter(f => f.category === 'documents').length,
    invoiceFiles: files.filter(f => f.category === 'invoices').length,
    contractFiles: files.filter(f => f.category === 'contracts').length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalInvoices: invoices.length,
    // Len nezaplatenA� faktAsry od DIVIDENDA s.r.o.
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

  

  // Na�TA�tanie sAsborov, Asloh a dokumentov pri otvorenA� dashboardu
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingFiles(true);
        setLoadingTasks(true);
        setLoadingInvoices(true);
        
        // Na�TA�tanie sAsborov
        const companyFiles = await apiService.getCompanyFiles(company.id);
        setFiles(companyFiles);
        
        // Na�TA�tanie Asloh
        const companyTasks = await apiService.getCompanyTasks(company.id);
        
        // Na�TA�tanie prijatA?ch faktAsr
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
          category: 'other', // Default kategAlria
        }));
        console.log('CompanyDashboard: KonvertovanA� Aslohy:', convertedTasks);
        setTasks(convertedTasks);

        // Na�TA�tanie rozlA�L?enA?ch po�Ttov nepre�TA�tanA?ch sprA?v
        await loadUnreadCounts();

        // Na�TA�tanie zamestnancov
        await loadEmployees();

      } catch (error) {
        console.error('Chyba pri na�TA�tanA� dA?t:', error);
        console.error('Error details:', error);
      } finally {
        setLoadingFiles(false);
        setLoadingTasks(false);
        setLoadingInvoices(false);
      }
    };

    loadData();
  }, [company.id, loadUnreadMessagesCount, loadUnreadCounts, loadEmployees]);

  // AutomatickA� aktualizA?cie po�Ttu sprA?v kaLldA?ch 30 sekAsnd
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCounts();
    }, 30000); // 30 sekAsnd

    return () => clearInterval(interval);
  }, [loadUnreadCounts]);

  // Na�TA�tanie vA?platnA?ch pA?sok pod�la filtrov
  useEffect(() => {
    const loadPayslips = async () => {
      if (activeTab !== 'hr-payslips' && activeTab !== 'payslips') return;
      setPayslipsLoading(true);
      try {
        const targetEmployees = payslipsEmployeeId === 'all'
          ? hrEmployeesRaw
          : hrEmployeesRaw.filter(e => e.id === payslipsEmployeeId);

        const rows: Array<{
          employeeId: number; name: string; month?: number; gross?: number; net?: number; settlement?: number; workedDays?: number; workedHours?: number; socialInsurance?: number; healthInsurance?: number;
        }> = [];

        // Ak je zvolenA? konkrA�tny mesiac -> na�TA�taj detail za mesiac pre kaLldA�ho
        if (payslipsMonth) {
          await Promise.all(targetEmployees.map(async (emp) => {
            try {
              const detail = await payrollService.getPayslipDetail(company.id, emp.id, payslipsYear, payslipsMonth as number);
              const p = detail.payslip || {};
              rows.push({
                employeeId: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                month: payslipsMonth as number,
                gross: p.grossWage || 0,
                net: p.netWage || 0,
                settlement: p.settlement || 0,
                workedDays: p.workedDays || 0,
                workedHours: p.workedHours || 0,
                socialInsurance: p.socialInsurance || 0,
                healthInsurance: p.healthInsurance || 0,
              });
            } catch (_) {
              // Bez pA?du �?" zamestnanec mA�Lle nemaLA vA?platu v danom mesiaci
            }
          }));
        } else {
          // Inak ro�TnA? preh�lad pre kaLldA�ho zamestnanca (sumA?r)
          await Promise.all(targetEmployees.map(async (emp) => {
            try {
              const data = await payrollService.getPayslips(company.id, emp.id, payslipsYear);
              rows.push({
                employeeId: emp.id,
                name: `${emp.first_name} ${emp.last_name}`,
                gross: data.summary?.totalGross || 0,
                net: data.summary?.totalNet || 0,
                settlement: data.summary?.totalSettlement || 0,
                workedDays: data.summary?.totalWorkedDays || 0,
                workedHours: data.summary?.totalWorkedHours || 0,
                socialInsurance: data.summary?.totalSocialInsurance || 0,
                healthInsurance: data.summary?.totalHealthInsurance || 0,
              });
            } catch (_) {}
          }));
        }

        // Zoradenie pod�la mena
        rows.sort((a, b) => a.name.localeCompare(b.name, 'sk'));
        setPayslipsRows(rows);
      } finally {
        setPayslipsLoading(false);
      }
    };
    loadPayslips();
  }, [activeTab, payslipsYear, payslipsMonth, payslipsEmployeeId, hrEmployeesRaw, company.id]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* L�tatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">SAsbory</p>
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
              <p className="text-sm font-medium text-gray-600">Aslohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              <p className="text-sm text-gray-500">{stats.pendingTasks} �TakajAscich</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">NezaplatenA� faktAsry</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unpaidInvoices}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalAmount.toFixed(2)} �,� celkovo</p>
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
              <p className="text-sm font-medium text-gray-600">SprA?vy</p>
              <p className="text-2xl font-bold text-gray-900">{unreadCounts.totalUnreadCount}</p>
              <div className="text-sm text-gray-500">
                <div>PrijatA�: {unreadCounts.receivedUnreadCount}</div>
                <div>OdoslanA�: {unreadCounts.sentUnreadCount}</div>
              </div>
              <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>




      </div>

      {/* RA?chle akcie */}
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
              <p className="text-2xl font-bold text-gray-900">dz'A</p>
              <p className="text-sm text-gray-500">SprA?va �ludskA?ch zdrojov</p>
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
              <p className="text-sm font-medium text-gray-600">Aslohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              <p className="text-sm text-gray-500">{stats.pendingTasks} �TakajAscich</p>
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
              <p className="text-sm font-medium text-gray-600">SAsbory</p>
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
              <p className="text-sm font-medium text-gray-600">As�TtovnA� obdobie</p>
              <p className="text-2xl font-bold text-gray-900">dz".</p>
              <p className="text-sm text-gray-500">MzdovA� obdobia</p>
              <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderCompanyPayslips = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">VA?platnA� pA?sky</h2>
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-600">Rok</label>
          <select
            value={payslipsYear}
            onChange={(e) => setPayslipsYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {Array.from({ length: 5 }).map((_, idx) => {
              const y = new Date().getFullYear() - idx;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
          <label className="text-sm text-gray-600 ml-4">Mesiac</label>
          <select
            value={String(payslipsMonth)}
            onChange={(e) => setPayslipsMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">VL?etky</option>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i+1} value={i+1}>{i+1}</option>
            ))}
          </select>
          <label className="text-sm text-gray-600 ml-4">Zamestnanec</label>
          <select
            value={String(payslipsEmployeeId)}
            onChange={(e) => setPayslipsEmployeeId(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">VL?etci</option>
            {hrEmployeesRaw.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SAshrnnA� karty pod�la aktuA?lneho filtra */}
      {!payslipsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">�SistA? mzda spolu</p>
            <p className="text-2xl font-bold text-green-900">
              {payslipsRows.reduce((sum, r) => sum + (r.net || 0), 0).toFixed(2)} �,�
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">HrubA? mzda spolu</p>
            <p className="text-2xl font-bold text-blue-900">
              {payslipsRows.reduce((sum, r) => sum + (r.gross || 0), 0).toFixed(2)} �,�
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-700">VyplatenA� spolu</p>
            <p className="text-2xl font-bold text-purple-900">
              {payslipsRows.reduce((sum, r) => sum + (r.settlement || 0), 0).toFixed(2)} �,�
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700">Po�Tet zA?znamov</p>
            <p className="text-2xl font-bold text-yellow-900">{payslipsRows.length}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {payslipsLoading ? (
          <div className="p-6">Na�TA�tavam...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zamestnanec</th>
                  {payslipsMonth && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesiac</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HrubA?</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">�SistA?</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VyplatenA�</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ZP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OdpracovanA� (dni / h)</th>
                  {payslipsMonth && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcie</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payslipsRows.map((row) => (
                  <tr key={`${row.employeeId}-${row.month || 'year'}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.name}</td>
                    {payslipsMonth && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.month}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(row.gross || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(row.net || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(row.settlement || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(row.socialInsurance || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(row.healthInsurance || 0).toFixed(2)} �,�</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.workedDays || 0} / {row.workedHours || 0}</td>
                    {payslipsMonth && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => { setPayslipModalEmployeeId(row.employeeId); setShowPayslipModal(true); }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Detail
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {payslipsRows.length === 0 && (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={payslipsMonth ? 9 : 7}>L?iadne dA?ta pre zvolenA� filtre.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );



  const renderTasks = () => {
    console.log('CompanyDashboard: renderTasks - loadingTasks:', loadingTasks, 'tasks.length:', tasks.length);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Aslohy</h2>
          <button 
            onClick={handleAddTask}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            PridaLA Aslohu
          </button>
        </div>

        {loadingTasks ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Na�TA�tavam Aslohy...</p>
          </div>
        ) : (
          <>
            {/* Zoznam Asloh */}
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
                        UpraviLA
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        VymazaLA
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PrA?zdny stav */}
            {tasks.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">L?iadne Aslohy</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Zatia�l neboli vytvorenA� Lliadne Aslohy pre tAsto firmu.
                </p>
                <button
                  onClick={handleAddTask}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  VytvoriLA prvAs Aslohu
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">As�TtovnA�ctvo</h3>
        <p className="mt-1 text-sm text-gray-500">
          Pre prA�stup k As�TtovnA�ctvu kliknite na tla�Tidlo niLlL?ie.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/accounting')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            OtvoriLA As�TtovnA�ctvo
          </button>
        </div>
      </div>
    );
  };

  const renderAccountants = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">PriradenA� As�TtovnA�ci</h2>
        <div className="text-sm text-gray-500">
          {company.assignedToAccountants?.length || 0} As�TtovnA�kov priradenA?ch k firme
        </div>
      </div>

      {company.assignedToAccountants && company.assignedToAccountants.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    As�TtovnA�k
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PoslednA� prihlA?senie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcie
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {company.assignedToAccountants.map((accountantEmail, index) => {
                  // SimulovanA� dA?ta pre As�TtovnA�ka (v reA?lnej aplikA?cii by sa na�TA�tali z databA?zy)
                  const accountant = {
                    id: index + 1,
                    name: accountantEmail.includes('@') ? accountantEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : accountantEmail,
                    email: accountantEmail,
                    status: 'active',
                    lastLogin: '1 hodinu',
                    department: 'As�TtovnA�ctvo'
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
                          AktA�vny
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
                          KontaktovaLA
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">L?iadni priradenA� As�TtovnA�ci</h3>
          <p className="mt-1 text-sm text-gray-500">
            K tejto firme zatia�l nie sAs priradenA� Lliadni As�TtovnA�ci.
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
              <p className="text-gray-600">I�SO: {company.ico} | OR: {company.business_registry}</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-blue-800">AktA�vna firma</p>
                <p className="text-xs text-blue-600">{company.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Preh�lad', icon: ChartBarIcon },
              { id: 'tasks', name: 'Aslohy', icon: ClipboardDocumentListIcon },
              { id: 'files', name: 'SAsbory', icon: FolderIcon },
              { id: 'dropbox', name: 'Dropbox', icon: CloudIcon },
              { id: 'hr', name: 'HR', icon: UsersIcon },
              { id: 'accountants', name: 'As�TtovnA�ci', icon: UserIcon },
              { id: 'accounting', name: 'As�TtovnA�ctvo', icon: DocumentTextIcon },
              { id: 'messages', name: 'SprA?vy', icon: EnvelopeIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'accounting') {
                      try { localStorage.setItem('selectedCompanyId', String(company.id)); } catch (e) {}
                      navigate('/accounting');
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
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
                  <p className="mt-4 text-gray-600">Na�TA�tavam sAsbory...</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Dropbox sAsbory</h2>
                <p className="text-sm text-gray-600 mt-1">VaL?e zdie�lanA� sAsbory v Dropboxe</p>
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
                    // Tu mA�Lleme implementovaLA logiku pre import sAsboru z Dropbox
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

        {/* Payslip Detail Modal (firma) */}
        {showPayslipModal && payslipModalEmployeeId && payslipsMonth && (
          <PayslipDetailModal
            isOpen={showPayslipModal}
            onClose={() => setShowPayslipModal(false)}
            companyId={company.id}
            employeeId={payslipModalEmployeeId}
            year={payslipsYear}
            month={payslipsMonth as number}
          />
        )}

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

