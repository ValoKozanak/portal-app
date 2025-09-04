import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import TaskModal, { Task } from '../components/TaskModal';
import { apiService } from '../services/apiService';

interface UserTasksPageProps {
  userEmail?: string;
  onBack: () => void;
}

interface Company {
  id: number;
  name: string;
}

const UserTasksPage: React.FC<UserTasksPageProps> = ({ 
  userEmail = 'user@portal.sk', 
  onBack 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Načítanie úloh používateľa
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const apiTasks = await apiService.getUserTasks(userEmail);
        
        // Konvertujeme API Task na TaskModal Task
        const convertedTasks: Task[] = apiTasks.map(apiTask => ({
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
        console.error('Chyba pri načítaní úloh:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, [userEmail]);

  // Načítanie firiem používateľa
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const userCompanies = await apiService.getUserCompanies(userEmail);
        setCompanies(userCompanies.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Chyba pri načítaní firiem:', error);
      }
    };

    loadCompanies();
  }, [userEmail]);

  // Funkcie pre správu úloh
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
      alert('Chyba pri mazaní úlohy: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  const handleSaveTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      if (editingTask) {
        // Aktualizácia existujúcej úlohy
        await apiService.updateTask(parseInt(editingTask.id), {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedTo,
          due_date: task.dueDate,
        });
        
        setTasks(prev => prev.map(t => 
          t.id === editingTask.id 
            ? { ...t, ...task, id: editingTask.id, createdAt: t.createdAt }
            : t
        ));
      } else {
        // Vytvorenie novej úlohy - potrebujeme vybrat firmu
        if (companies.length === 0) {
          alert('Pre vytvorenie úlohy potrebujete mať aspoň jednu firmu.');
          return;
        }
        
        const selectedCompany = companies[0]; // Použijeme prvú firmu
        const response = await apiService.createTask({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assignedTo,
          due_date: task.dueDate,
          created_by: userEmail,
          company_id: selectedCompany.id,
          company_name: selectedCompany.name,
        });
        
        // Načítame úlohu znova, aby sme mali kompletné údaje
        const createdTask = await apiService.getTask(response.taskId);
        const convertedTask: Task = {
          id: createdTask.id.toString(),
          title: createdTask.title,
          description: createdTask.description || '',
          status: createdTask.status,
          priority: createdTask.priority,
          assignedTo: createdTask.assigned_to,
          dueDate: createdTask.due_date || '',
          createdAt: createdTask.created_at,
          createdBy: createdTask.created_by,
          category: 'other',
        };
        
        setTasks(prev => [...prev, convertedTask]);
      }
      
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Chyba pri ukladaní úlohy:', error);
      alert('Chyba pri ukladaní úlohy: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  // Filtrovanie a hromadné akcie
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return task.status === 'pending';
    if (taskFilter === 'in_progress') return task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed';
    if (taskFilter === 'cancelled') return task.status === 'cancelled';
    return true;
  });

  const toggleSelect = (taskId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const isSelected = (taskId: string) => selectedIds.has(taskId);
  const selectAllVisible = () => setSelectedIds(new Set(filteredTasks.map(t => t.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatusChange = async (newStatus: Task['status']) => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => 
        apiService.updateTask(parseInt(id), { status: newStatus })
      ));
      setTasks(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: newStatus } : t));
      clearSelection();
    } catch (error) {
      console.error('Chyba pri hromadnej zmene stavu úloh:', error);
      alert('Chyba pri hromadnej zmene stavu úloh');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Naozaj chcete vymazať ${selectedIds.size} vybraných úloh?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => apiService.deleteTask(parseInt(id))));
      setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
      clearSelection();
    } catch (error) {
      console.error('Chyba pri hromadnom mazaní úloh:', error);
      alert('Chyba pri hromadnom mazaní úloh');
    }
  };

  // Helper funkcie pre úlohy
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
                <ClipboardDocumentListIcon className="h-8 w-8 text-orange-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Vaše úlohy</h1>
              </div>
            </div>
            <button
              onClick={handleAddTask}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Pridať úlohu
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam úloh</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {tasks.length} úloh • {tasks.filter(t => t.status === 'pending').length} čakajúcich
                  {filteredTasks.length !== tasks.length && (
                    <span className="ml-2 text-primary-600">(Zobrazené: {filteredTasks.length})</span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Vybrané: {selectedIds.size}</span>
                <button onClick={selectAllVisible} className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">Vybrať zobrazené</button>
                <button onClick={clearSelection} className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">Zrušiť výber</button>
                <div className="hidden md:flex items-center space-x-1">
                  <button onClick={() => handleBulkStatusChange('pending')} disabled={selectedIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedIds.size===0?'bg-yellow-100 text-yellow-300 cursor-not-allowed':'bg-yellow-600 text-white hover:bg-yellow-700'}`}>Čakajúce</button>
                  <button onClick={() => handleBulkStatusChange('in_progress')} disabled={selectedIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedIds.size===0?'bg-blue-100 text-blue-300 cursor-not-allowed':'bg-blue-600 text-white hover:bg-blue-700'}`}>V spracovaní</button>
                  <button onClick={() => handleBulkStatusChange('completed')} disabled={selectedIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedIds.size===0?'bg-green-100 text-green-300 cursor-not-allowed':'bg-green-600 text-white hover:bg-green-700'}`}>Dokončené</button>
                  <button onClick={() => handleBulkStatusChange('cancelled')} disabled={selectedIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedIds.size===0?'bg-gray-100 text-gray-300 cursor-not-allowed':'bg-gray-600 text-white hover:bg-gray-700'}`}>Zrušené</button>
                  <button onClick={handleBulkDelete} disabled={selectedIds.size===0} className={`px-3 py-2 text-sm rounded-md ${selectedIds.size===0?'bg-red-100 text-red-300 cursor-not-allowed':'bg-red-600 text-white hover:bg-red-700'}`}>Vymazať vybrané</button>
                </div>
              </div>
            </div>
            {/* Filter stavov */}
            <div className="mt-3 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <button onClick={() => setTaskFilter('all')} className={`px-3 py-1 text-sm rounded-md ${taskFilter==='all'?'bg-primary-600 text-white':'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>Všetky ({tasks.length})</button>
              <button onClick={() => setTaskFilter('pending')} className={`px-3 py-1 text-sm rounded-md ${taskFilter==='pending'?'bg-yellow-600 text-white':'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>Čakajúce ({tasks.filter(t=>t.status==='pending').length})</button>
              <button onClick={() => setTaskFilter('in_progress')} className={`px-3 py-1 text-sm rounded-md ${taskFilter==='in_progress'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>V spracovaní ({tasks.filter(t=>t.status==='in_progress').length})</button>
              <button onClick={() => setTaskFilter('completed')} className={`px-3 py-1 text-sm rounded-md ${taskFilter==='completed'?'bg-green-600 text-white':'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>Dokončené ({tasks.filter(t=>t.status==='completed').length})</button>
              <button onClick={() => setTaskFilter('cancelled')} className={`px-3 py-1 text-sm rounded-md ${taskFilter==='cancelled'?'bg-gray-600 text-white':'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}>Zrušené ({tasks.filter(t=>t.status==='cancelled').length})</button>
            </div>
          </div>
          
          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam úlohy...</p>
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="mb-2">
                          <label className="inline-flex items-center space-x-2 text-sm text-gray-600">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              checked={isSelected(task.id)}
                              onChange={() => toggleSelect(task.id)}
                            />
                            <span>Vybrať</span>
                          </label>
                        </div>
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
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Žiadne úlohy</h3>
                <p className="mt-2 text-sm text-gray-500 mb-6">
                  Zatiaľ nemáte žiadne úlohy. Vytvorte prvú úlohu pre vašu firmu.
                </p>
                <button
                  onClick={handleAddTask}
                  className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 flex items-center mx-auto"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Vytvoriť prvú úlohu
                </button>
              </div>
            )}
          </div>
        </div>
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
         companyEmployees={[]}
         company={companies.length > 0 ? companies[0] : undefined}
         userEmail={userEmail}
       />
    </div>
  );
};

export default UserTasksPage;
