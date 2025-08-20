import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { taskService } from '../services/taskService';
import { Task } from '../components/TaskModal';

interface AdminTasksPageProps {
  onBack: () => void;
}

const AdminTasksPage: React.FC<AdminTasksPageProps> = ({ onBack }) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Načítanie všetkých úloh
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const tasks = await taskService.getAllTasks();
        setAllTasks(tasks);
      } catch (error) {
        console.error('Chyba pri načítaní úloh:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, []);

  // Filtrovanie úloh
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Aktualizácia statusu úlohy
  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updatedTask = await taskService.updateTask(taskId, { status: newStatus });
      if (updatedTask) {
        setAllTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
      }
    } catch (error) {
      console.error('Chyba pri aktualizácii úlohy:', error);
      alert('Chyba pri aktualizácii úlohy');
    }
  };

  // Vymazanie úlohy
  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Naozaj chcete vymazať túto úlohu?')) {
      try {
        const success = await taskService.deleteTask(taskId);
        if (success) {
          setAllTasks(prev => prev.filter(task => task.id !== taskId));
        }
      } catch (error) {
        console.error('Chyba pri mazaní úlohy:', error);
        alert('Chyba pri mazaní úlohy');
      }
    }
  };

  // Helper funkcie pre badge
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

  // Formátovanie dátumu
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Štatistiky
  const stats = {
    total: allTasks.length,
    pending: allTasks.filter(t => t.status === 'pending').length,
    inProgress: allTasks.filter(t => t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    cancelled: allTasks.filter(t => t.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Späť do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-8 w-8 text-green-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Správa úloh</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Štatistiky */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Celkovo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Čakajúce</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">V spracovaní</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Dokončené</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <XMarkIcon className="h-8 w-8 text-gray-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Zrušené</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam úloh</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {filteredTasks.length} úloh z {allTasks.length}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                >
                  <option value="all">Všetky statusy</option>
                  <option value="pending">Čakajúce</option>
                  <option value="in_progress">V spracovaní</option>
                  <option value="completed">Dokončené</option>
                  <option value="cancelled">Zrušené</option>
                </select>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Vyhľadať úlohu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
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
                        {task.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Dokončiť
                          </button>
                        )}
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                          >
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Spustiť
                          </button>
                        )}
                        {task.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                            className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Zrušiť
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Vymazať
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm || statusFilter !== 'all' ? 'Žiadne úlohy nenájdené' : 'Žiadne úlohy'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Skúste zmeniť vyhľadávací výraz alebo filter.'
                    : 'Zatiaľ neboli vytvorené žiadne úlohy.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTasksPage;
