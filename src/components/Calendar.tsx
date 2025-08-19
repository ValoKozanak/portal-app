import React, { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { format, isSameDay, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { sk } from 'date-fns/locale';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  UserIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Task, Company } from '../services/apiService';
import TaskModal from './TaskModal';

interface CalendarProps {
  userEmail: string;
  userRole: 'admin' | 'user' | 'accountant';
  tasks: Task[];
  companies: Company[];
  onTaskUpdate: () => void;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: Date;
  type: 'task';
  task: Task;
}

const CalendarComponent: React.FC<CalendarProps> = ({
  userEmail,
  userRole,
  tasks,
  companies,
  onTaskUpdate
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    companyId: 'all',
    status: 'all',
    priority: 'all'
  });

  // Konvertovanie úloh na kalendárne udalosti
  const calendarEvents = useMemo(() => {
    return tasks
      .filter(task => {
        // Filtrovanie podľa firmy
        if (filters.companyId !== 'all' && task.company_id !== parseInt(filters.companyId)) {
          return false;
        }
        // Filtrovanie podľa stavu
        if (filters.status !== 'all' && task.status !== filters.status) {
          return false;
        }
        // Filtrovanie podľa priority
        if (filters.priority !== 'all' && task.priority !== filters.priority) {
          return false;
        }
        return true;
      })
      .filter(task => task.due_date) // Len úlohy s termínom
      .map(task => ({
        id: task.id,
        title: task.title,
        date: parseISO(task.due_date!),
        type: 'task' as const,
        task
      }));
  }, [tasks, filters]);

  // Získanie udalostí pre vybraný dátum
  useEffect(() => {
    if (!selectedDate) return;
    const eventsForDate = calendarEvents.filter(event =>
      isSameDay(event.date, selectedDate)
    );
    setSelectedEvents(eventsForDate);
  }, [selectedDate, calendarEvents]);

  // Funkcia pre získanie udalostí pre konkrétny dátum (pre react-calendar)
  const tileContent = ({ date }: { date: Date }) => {
    const eventsForDate = calendarEvents.filter(event =>
      isSameDay(event.date, date)
    );

    if (eventsForDate.length === 0) return null;

    return (
      <div className="flex flex-col items-center">
        {eventsForDate.map((event, index) => (
          <div
            key={`${event.id}-${index}`}
            className={`w-2 h-2 rounded-full mb-1 ${
              event.task.status === 'completed' ? 'bg-green-500' :
              event.task.status === 'in_progress' ? 'bg-blue-500' :
              event.task.priority === 'urgent' ? 'bg-red-500' :
              event.task.priority === 'high' ? 'bg-orange-500' :
              'bg-gray-500'
            }`}
            title={`${event.title} - ${event.task.status}`}
          />
        ))}
      </div>
    );
  };

  // Funkcia pre získanie CSS tried pre dátum (pre react-calendar)
  const tileClassName = ({ date }: { date: Date }) => {
    const eventsForDate = calendarEvents.filter(event =>
      isSameDay(event.date, date)
    );

    if (eventsForDate.length === 0) return '';

    const hasUrgent = eventsForDate.some(event => event.task.priority === 'urgent');
    const hasHigh = eventsForDate.some(event => event.task.priority === 'high');
    const hasCompleted = eventsForDate.some(event => event.task.status === 'completed');

    if (hasUrgent) return 'bg-red-100 border-red-300';
    if (hasHigh) return 'bg-orange-100 border-orange-300';
    if (hasCompleted) return 'bg-green-100 border-green-300';
    return 'bg-blue-100 border-blue-300';
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingTask(event.task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    onTaskUpdate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const clearFilters = () => {
    setFilters({
      companyId: 'all',
      status: 'all',
      priority: 'all'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Kalendár úloh</h2>
        </div>
        
        {/* Filtre */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtre:</span>
          </div>
          
          {/* Firma */}
          <select
            value={filters.companyId}
            onChange={(e) => setFilters(prev => ({ ...prev, companyId: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Všetky firmy</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          {/* Stav */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Všetky stavy</option>
            <option value="pending">Čakajúce</option>
            <option value="in_progress">V riešení</option>
            <option value="completed">Dokončené</option>
            <option value="cancelled">Zrušené</option>
          </select>

          {/* Priorita */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Všetky priority</option>
            <option value="urgent">Urgentné</option>
            <option value="high">Vysoké</option>
            <option value="medium">Stredné</option>
            <option value="low">Nízke</option>
          </select>

          {/* Vymazať filtre */}
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>Vymazať</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kalendár */}
        <div className="lg:col-span-2">
          <Calendar
            onChange={(value) => setSelectedDate(value as Date)}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="sk"
            className="w-full border-0 shadow-sm"
          />
          
          {/* Legenda */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda:</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Urgentné</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Vysoké</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>V riešení</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Dokončené</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Ostatné</span>
              </div>
            </div>
          </div>
        </div>

        {/* Udalosti pre vybraný dátum */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4">
                         <h3 className="text-lg font-medium text-gray-800 mb-4">
               {selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sk }) : 'Vyberte dátum'}
             </h3>
            
            {selectedEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Žiadne úlohy na tento dátum
              </p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">
                          {event.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {event.task.company_name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {event.task.assigned_to}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(event.task.status)}
                          <span className="text-sm text-gray-600 capitalize">
                            {event.task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.task.priority)}`}>
                          {event.task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(event.date, 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

             {/* Task Modal */}
       {showTaskModal && editingTask && (
         <TaskModal
           isOpen={showTaskModal}
           onClose={() => setShowTaskModal(false)}
           onSave={handleTaskUpdate}
           task={{
             id: editingTask.id.toString(),
             title: editingTask.title,
             description: editingTask.description || '',
             status: editingTask.status,
             priority: editingTask.priority,
             assignedTo: editingTask.assigned_to,
             dueDate: editingTask.due_date || '',
             createdAt: editingTask.created_at,
             createdBy: editingTask.created_by,
             category: 'other',
             companyId: editingTask.company_id,
             companyName: editingTask.company_name
           }}
           companyEmployees={[]}
           company={{ id: editingTask.company_id, name: editingTask.company_name }}
           isAccountant={userRole === 'accountant'}
           assignedCompanies={companies}
         />
       )}
    </div>
  );
};

export default CalendarComponent;
