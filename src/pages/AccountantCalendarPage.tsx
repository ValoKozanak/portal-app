import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Company, apiService } from '../services/apiService';
import CalendarComponent from '../components/Calendar';
import { Task } from '../components/TaskModal';

interface AccountantCalendarPageProps {
  userEmail: string;
  onBack: () => void;
}

const AccountantCalendarPage: React.FC<AccountantCalendarPageProps> = ({ userEmail, onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

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
          <h1 className="text-3xl font-bold text-gray-900">Kalendár úloh</h1>
          <p className="text-gray-600 mt-2">
            Prehľad úloh zo všetkých priradených firiem
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam kalendár...</p>
              </div>
            ) : (
              <CalendarComponent
                userEmail={userEmail}
                userRole="accountant"
                tasks={assignedTasks.map(task => ({
                  id: parseInt(task.id),
                  title: task.title,
                  description: task.description,
                  status: task.status,
                  priority: task.priority,
                  assigned_to: task.assignedTo,
                  company_id: task.companyId || 0,
                  company_name: task.companyName || 'Neznáma firma',
                  created_by: task.createdBy,
                  due_date: task.dueDate,
                  created_at: task.createdAt,
                  updated_at: task.createdAt
                }))}
                companies={companies}
                onTaskUpdate={() => {
                  loadAccountantData();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantCalendarPage;
