import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CogIcon, BuildingOfficeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Company, apiService } from '../services/apiService';
import TaskModal, { Task } from '../components/TaskModal';

interface AccountantTasksPageProps {
  userEmail: string;
  onBack: () => void;
}

const AccountantTasksPage: React.FC<AccountantTasksPageProps> = ({ userEmail, onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');

  useEffect(() => {
    loadAccountantData();
  }, [userEmail]);

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
        companyId: apiTask.company_id,
        companyName: apiTask.company_name
      }));
      setAssignedTasks(convertedTasks);
    } catch (error) {
      console.error('Chyba pri načítaní dát účtovníka:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleAddTask = () => {
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
        const updateData = {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          assigned_to: taskData.assignedToEmail || taskData.assignedTo,
          due_date: taskData.dueDate,
          category: taskData.category,
          estimated_hours: taskData.estimatedHours
        };
        await apiService.updateTask(parseInt(editingTask.id), updateData);
        setAssignedTasks(prev => prev.map(task => 
          task.id === editingTask.id 
            ? { ...task, ...taskData }
            : task
        ));
      } else {
        if (taskData.companyId && companies.length > 0) {
          const selectedCompany = companies.find(c => c.id === taskData.companyId);
          if (selectedCompany) {
            const response = await apiService.createTask({
              title: taskData.title,
              description: taskData.description,
              status: taskData.status,
              priority: taskData.priority,
              assigned_to: taskData.assignedToEmail || taskData.assignedTo,
              company_id: selectedCompany.id,
              company_name: selectedCompany.name,
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
              companyName: selectedCompany.name
            };
            
            setAssignedTasks(prev => [...prev, newTask]);
          }
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

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setAssignedTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
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

  const filteredTasks = assignedTasks.filter(task => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'pending') return task.status === 'pending';
    if (taskFilter === 'in_progress') return task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed';
    if (taskFilter === 'cancelled') return task.status === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="font-medium">Späť do Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Prihlásený ako</p>
                <p className="font-medium text-gray-900">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Úlohy zo všetkých priradených firiem</h1>
          <p className="text-gray-600 mt-2">
            Celkovo {assignedTasks.length} úloh z {companies.length} firiem
          </p>
        </div>

        {/* Task Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Správa úloh</h2>
            </div>
            <button
              onClick={handleAddTask}
              disabled={companies.length === 0}
              className={`px-4 py-2 rounded-md flex items-center ${
                companies.length === 0 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <CogIcon className="h-5 w-5 mr-2" />
              {companies.length === 0 ? 'Žiadne firmy' : 'Pridať úlohu'}
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
                <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
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

        {/* Task Modal */}
        {companies.length > 0 && (
          <TaskModal
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false);
              setEditingTask(null);
            }}
            onSave={handleSaveTask}
            task={editingTask}
            companyEmployees={[]}
            company={{ id: companies[0].id, name: companies[0].name }}
            isAccountant={true}
            assignedCompanies={companies}
            userEmail={userEmail}
          />
        )}
      </div>
    </div>
  );
};

export default AccountantTasksPage;
