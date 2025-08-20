import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  DocumentTextIcon,
  CogIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  CloudIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

// Lazy loading pre nové stránky
const AdminUsersPage = React.lazy(() => import('./AdminUsersPage'));
const AdminCompaniesPage = React.lazy(() => import('./AdminCompaniesPage'));
const AdminTasksPage = React.lazy(() => import('./AdminTasksPage'));
const AdminFilesPage = React.lazy(() => import('./AdminFilesPage'));
const AdminDropboxPage = React.lazy(() => import('./AdminDropboxPage'));
const AdminMessagesPage = React.lazy(() => import('./AdminMessagesPage'));

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    files: 0,
    tasks: 0,
    messages: 0,
    settings: 23,
    admins: 0,
    reports: 0,
    companies: 0
  });

  // State pre full-screen stránky
  const [showUsersPage, setShowUsersPage] = useState(false);
  const [showCompaniesPage, setShowCompaniesPage] = useState(false);
  const [showTasksPage, setShowTasksPage] = useState(false);
  const [showFilesPage, setShowFilesPage] = useState(false);
  const [showDropboxPage, setShowDropboxPage] = useState(false);
  const [showMessagesPage, setShowMessagesPage] = useState(false);

  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, type: 'warning', message: 'Zálohovanie databázy sa nepodarilo', time: '1 hodinu' },
    { id: 2, type: 'info', message: 'Nová verzia systému je dostupná', time: '2 hodiny' },
    { id: 3, type: 'error', message: 'Kritická chyba v systéme', time: '30 minút' },
  ]);

  // Načítanie štatistík
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersData, companiesData, tasksData, filesData, messagesData] = await Promise.all([
          apiService.getAllUsers(),
          apiService.getAllCompanies(),
          apiService.getAllTasks(),
          apiService.getAllFiles(),
          apiService.getAllMessages()
        ]);

        setStats({
          users: usersData.length,
          companies: companiesData.length,
          tasks: tasksData.length,
          files: filesData.length,
          messages: messagesData.length,
          settings: 23,
          admins: usersData.filter(u => u.role === 'admin').length,
          reports: systemAlerts.length
        });
      } catch (error) {
        console.error('Chyba pri načítaní štatistík:', error);
      }
    };

    loadStats();
  }, [systemAlerts.length]);

  // Helper funkcia pre ikony alertov
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Conditional rendering pre full-screen stránky
  if (showUsersPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminUsersPage onBack={() => setShowUsersPage(false)} />
      </React.Suspense>
    );
  }

  if (showCompaniesPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminCompaniesPage onBack={() => setShowCompaniesPage(false)} />
      </React.Suspense>
    );
  }

  if (showTasksPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminTasksPage onBack={() => setShowTasksPage(false)} />
      </React.Suspense>
    );
  }

  if (showFilesPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminFilesPage onBack={() => setShowFilesPage(false)} />
      </React.Suspense>
    );
  }

  if (showDropboxPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminDropboxPage onBack={() => setShowDropboxPage(false)} />
      </React.Suspense>
    );
  }

  if (showMessagesPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminMessagesPage onBack={() => setShowMessagesPage(false)} />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Štatistické karty */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <button 
            onClick={() => setShowUsersPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Celkovo používateľov</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
                <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setShowCompaniesPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Celkovo firiem</p>
                <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
                <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setShowTasksPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Všetky úlohy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
                <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowFilesPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Súbory</p>
                <p className="text-2xl font-bold text-gray-900">{stats.files}</p>
                <p className="text-xs text-gray-500 mt-1">Celkovo v systéme</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowDropboxPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CloudIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dropbox</p>
                <p className="text-2xl font-bold text-gray-900">∞</p>
                <p className="text-xs text-gray-500 mt-1">Cloud úložisko</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowMessagesPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Správy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.messages}</p>
                <p className="text-xs text-gray-500 mt-1">Všetky správy</p>
              </div>
            </div>
          </button>
        </div>

        {/* Ďalšie informačné karty */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrátori</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                <p className="text-xs text-gray-500 mt-1">Aktívni admini</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Systémové upozornenia</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reports}</p>
                <p className="text-xs text-gray-500 mt-1">Aktívne alerty</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nastavenia</p>
                <p className="text-2xl font-bold text-gray-900">{stats.settings}</p>
                <p className="text-xs text-gray-500 mt-1">Konfigurácie</p>
              </div>
            </div>
          </div>
        </div>

        {/* Systémové upozornenia */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Systémové upozornenia</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-md">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-500">{alert.time}</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

