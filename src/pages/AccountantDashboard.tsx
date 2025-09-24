import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  EnvelopeIcon,
  CalendarIcon,
  CloudIcon,
  UserIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { Company, apiService } from '../services/apiService';
import AccountantDropboxPage from './AccountantDropboxPage';
import AccountantTasksPage from './AccountantTasksPage';
import AccountantFilesPage from './AccountantFilesPage';
import AccountantCompaniesPage from './AccountantCompaniesPage';
import AccountantCalendarPage from './AccountantCalendarPage';
import AccountantMessagesPage from './AccountantMessagesPage';


interface AccountantDashboardProps {
  userEmail: string;
}

const AccountantDashboard: React.FC<AccountantDashboardProps> = ({ userEmail }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [, setLoadingCompanies] = useState(true);

  const [showDropboxPage, setShowDropboxPage] = useState(false);
  const [showTasksPage, setShowTasksPage] = useState(false);
  const [showFilesPage, setShowFilesPage] = useState(false);
  const [showCompaniesPage, setShowCompaniesPage] = useState(false);
  const [showCalendarPage, setShowCalendarPage] = useState(false);
  const [showMessagesPage, setShowMessagesPage] = useState(false);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [stats, setStats] = useState({
    documents: 0,
    tasks: 0,
    completed: 0,
    pending: 0,
    companies: 0,
  });

  // AktualizA?cia L?tatistA�k na zA?klade po�Ttu firiem
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      companies: companies.length,
    }));
  }, [companies.length]);

  // Na�TA�tanie po�Ttu nepre�TA�tanA?ch sprA?v
  const loadUnreadMessagesCount = async () => {
    try {
      const unreadCount = await apiService.getUnreadCount(userEmail);
      setUnreadMessagesCount(unreadCount);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� po�Ttu nepre�TA�tanA?ch sprA?v:', error);
    }
  };

  // Na�TA�tanie Asloh As�TtovnA�ka
  const loadAccountantTasks = async () => {
    try {
      const accountantTasks = await apiService.getAccountantTasks(userEmail);
      const pendingTasks = accountantTasks.filter(task => task.status === 'pending');
      const completedTasks = accountantTasks.filter(task => task.status === 'completed');
      
      setStats(prev => ({
        ...prev,
        tasks: accountantTasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
      }));
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� Asloh As�TtovnA�ka:', error);
    }
  };

  // Na�TA�tanie firiem priradenA?ch As�TtovnA�kovi
  useEffect(() => {
    const loadAccountantData = async () => {
      try {
        const assignedCompanies = await apiService.getAccountantCompanies(userEmail);
        setCompanies(assignedCompanies);
      } catch (error) {
        console.error('Chyba pri na�TA�tanA� dA?t As�TtovnA�ka:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadAccountantData();
    loadUnreadMessagesCount();
    loadAccountantTasks();
  }, [userEmail]);

  // AutomatickA� aktualizA?cie po�Ttu nepre�TA�tanA?ch sprA?v kaLldA?ch 30 sekAsnd
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000); // 30 sekAsnd

    return () => clearInterval(interval);
  }, [loadUnreadMessagesCount]);



  // Ak sa mA? zobraziLA Dropbox strA?nka, zobrazA�me ju na celAs obrazovku
  if (showDropboxPage) {
    return (
      <AccountantDropboxPage
        userEmail={userEmail}
        onBack={() => setShowDropboxPage(false)}
      />
    );
  }

  // Ak sa mA? zobraziLA Tasks strA?nka, zobrazA�me ju na celAs obrazovku
  if (showTasksPage) {
    return (
      <AccountantTasksPage
        userEmail={userEmail}
        onBack={() => setShowTasksPage(false)}
      />
    );
  }

  // Ak sa mA? zobraziLA Files strA?nka, zobrazA�me ju na celAs obrazovku
  if (showFilesPage) {
    return (
      <AccountantFilesPage
        userEmail={userEmail}
        onBack={() => setShowFilesPage(false)}
      />
    );
  }

  // Ak sa mA? zobraziLA Companies strA?nka, zobrazA�me ju na celAs obrazovku
  if (showCompaniesPage) {
    return (
      <AccountantCompaniesPage
        userEmail={userEmail}
        onBack={() => setShowCompaniesPage(false)}
      />
    );
  }

  // Ak sa mA? zobraziLA Calendar strA?nka, zobrazA�me ju na celAs obrazovku
  if (showCalendarPage) {
    return (
      <AccountantCalendarPage
        userEmail={userEmail}
        onBack={() => setShowCalendarPage(false)}
      />
    );
  }

  // Ak sa mA? zobraziLA Messages strA?nka, zobrazA�me ju na celAs obrazovku
  if (showMessagesPage) {
    return (
      <AccountantMessagesPage
        userEmail={userEmail}
        onBack={() => setShowMessagesPage(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard As�TtovnA�ka</h1>
            <p className="text-gray-600 mt-2">SprA?va priradenA?ch firiem a Asloh</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">PrihlA?senA? ako</p>
              <p className="font-medium text-gray-900">{userEmail}</p>
            </div>
            <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* L�tatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">


        <button 
           onClick={() => setShowTasksPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aslohy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              <p className="text-sm text-gray-500">{stats.pending} �TakajAscich</p>
            </div>
          </div>
        </button>

        <button 
           onClick={() => setShowTasksPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dokon�TenA�</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
           onClick={() => setShowFilesPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">SAsbory</p>
                             <p className="text-2xl font-bold text-gray-900">�z</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
           onClick={() => setShowCompaniesPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">PriradenA� firmy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
           onClick={() => setShowCalendarPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">KalendA?r</p>
                             <p className="text-2xl font-bold text-gray-900">�z</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

                 <button 
           onClick={() => setShowDropboxPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
         >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CloudIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dropbox</p>
              <p className="text-2xl font-bold text-gray-900">�z</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

        <button 
           onClick={() => setShowMessagesPage(true)}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">SprA?vy</p>
              <p className="text-2xl font-bold text-gray-900">{unreadMessagesCount}</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
              {unreadMessagesCount > 0 && (
                <p className="text-sm text-indigo-600 font-medium">{unreadMessagesCount} nepre�TA�tanA?ch</p>
              )}
            </div>
          </div>
        </button>

        <button 
           onClick={() => navigate('/accounting')}
           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalculatorIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">As�TtovnA�ctvo</p>
              <p className="text-2xl font-bold text-gray-900">�z</p>
              <p className="text-xs text-gray-500 mt-1">Kliknite pre zobrazenie</p>
            </div>
          </div>
        </button>

      </div>
    </div>
  );
};

export default AccountantDashboard;


