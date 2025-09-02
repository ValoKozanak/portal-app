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
  EnvelopeIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

// Lazy loading pre nové stránky
const AdminUsersPage = React.lazy(() => import('./AdminUsersPage'));
const AdminCompaniesPage = React.lazy(() => import('./AdminCompaniesPage'));
const AdminTasksPage = React.lazy(() => import('./AdminTasksPage'));
const AdminFilesPage = React.lazy(() => import('./AdminFilesPage'));
const AdminDropboxPage = React.lazy(() => import('./AdminDropboxPage'));
const AdminMessagesPage = React.lazy(() => import('./AdminMessagesPage'));
const AdminSettingsPage = React.lazy(() => import('./AdminSettingsPage'));
const AdminPohodaImportPage = React.lazy(() => import('./AdminPohodaImportPage'));
const AdminPohodaExportPage = React.lazy(() => import('./AdminPohodaExportPage'));
const MdbManagement = React.lazy(() => import('../components/admin/MdbManagement'));


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

  const [unreadCounts, setUnreadCounts] = useState({
    receivedUnreadCount: 0,
    sentUnreadCount: 0,
    totalUnreadCount: 0
  });

  // State pre full-screen stránky
  const [showUsersPage, setShowUsersPage] = useState(false);
  const [showCompaniesPage, setShowCompaniesPage] = useState(false);
  const [showTasksPage, setShowTasksPage] = useState(false);
  const [showFilesPage, setShowFilesPage] = useState(false);
  const [showDropboxPage, setShowDropboxPage] = useState(false);
  const [showMessagesPage, setShowMessagesPage] = useState(false);
  const [showSettingsPage, setShowSettingsPage] = useState(false);
  const [showPohodaImportPage, setShowPohodaImportPage] = useState(false);
  const [showPohodaExportPage, setShowPohodaExportPage] = useState(false);
  const [showMdbManagement, setShowMdbManagement] = useState(false);



  const [systemAlerts, setSystemAlerts] = useState([
    { id: 1, type: 'warning', message: 'Zálohovanie databázy sa nepodarilo', time: '1 hodinu' },
    { id: 2, type: 'info', message: 'Nová verzia systému je dostupná', time: '2 hodiny' },
    { id: 3, type: 'error', message: 'Kritická chyba v systéme', time: '30 minút' },
  ]);

  // Načítanie neprečítaných správ pre admin
  const loadUnreadCounts = async () => {
    try {
      // Pre admin používame admin@portal.sk ako default
      const counts = await apiService.getUnreadCounts('admin@portal.sk');
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Chyba pri načítaní neprečítaných správ:', error);
    }
  };

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

        // Načítame aj neprečítané správy
        await loadUnreadCounts();
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
        <AdminMessagesPage 
          onBack={() => setShowMessagesPage(false)} 
          onMessageAction={loadUnreadCounts}
        />
      </React.Suspense>
    );
  }

  if (showSettingsPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminSettingsPage onBack={() => setShowSettingsPage(false)} />
      </React.Suspense>
    );
  }

  if (showPohodaImportPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminPohodaImportPage onBack={() => setShowPohodaImportPage(false)} />
      </React.Suspense>
    );
  }

  if (showPohodaExportPage) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <AdminPohodaExportPage onBack={() => setShowPohodaExportPage(false)} />
      </React.Suspense>
    );
  }

  if (showMdbManagement) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Načítavam...</div>}>
        <MdbManagement onBack={() => setShowMdbManagement(false)} />
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
                <p className="text-2xl font-bold text-gray-900">{unreadCounts.totalUnreadCount}</p>
                <div className="text-sm text-gray-500">
                  <div>Prijaté: {unreadCounts.receivedUnreadCount}</div>
                  <div>Čakajúce: {unreadCounts.sentUnreadCount}</div>
                </div>
                <p className="text-xs text-purple-600 mt-1">Kliknite pre zobrazenie</p>
              </div>
              {unreadCounts.totalUnreadCount > 0 && (
                <div className="ml-auto">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCounts.totalUnreadCount}
                  </span>
                </div>
              )}
            </div>
          </button>


        </div>

        {/* POHODA Import/Export karty */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setShowPohodaImportPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDownTrayIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">POHODA Import</p>
                <p className="text-2xl font-bold text-gray-900">📥</p>
                <p className="text-xs text-gray-500 mt-1">Import faktúr a dát</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowPohodaExportPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpTrayIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">POHODA Export</p>
                <p className="text-2xl font-bold text-gray-900">📤</p>
                <p className="text-xs text-gray-500 mt-1">Export faktúr a dát</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowMdbManagement(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">MDB Management</p>
                <p className="text-2xl font-bold text-gray-900">🗄️</p>
                <p className="text-xs text-gray-500 mt-1">DigitalOcean Spaces</p>
              </div>
            </div>
          </button>
        </div>

        {/* Ďalšie informačné karty */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <button
            onClick={() => setShowSettingsPage(true)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-8 w-8 text-indigo-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">POHODA mServer</p>
                <p className="text-2xl font-bold text-gray-900">⚙️</p>
                <p className="text-xs text-gray-500 mt-1">Nastavenia mServer</p>
              </div>
            </div>
          </button>


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

