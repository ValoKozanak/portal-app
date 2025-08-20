import React from 'react';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Stats {
  users: number;
  companies: number;
  tasks: number;
  documents: number;
  admins: number;
  reports: number;
}

interface AdminDashboardOverviewProps {
  stats: Stats;
  users: any[];
  companies: any[];
  tasks: any[];
  files: any[];
}

const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  stats,
  users,
  companies,
  tasks,
  files
}) => {
  const statCards = [
    {
      name: 'Používatelia',
      value: stats.users,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Firmy',
      value: stats.companies,
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      name: 'Úlohy',
      value: stats.tasks,
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500',
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Dokumenty',
      value: stats.documents,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  const recentTasks = tasks.slice(0, 5);
  const recentFiles = files.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Štatistiky */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">z minulého mesiaca</span>
            </div>
          </div>
        ))}
      </div>

      {/* Graf a aktivita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktívne úlohy */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Aktívne úlohy</h3>
          </div>
          <div className="p-6">
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.companyName}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Žiadne aktívne úlohy</p>
            )}
          </div>
        </div>

        {/* Posledné dokumenty */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Posledné dokumenty</h3>
          </div>
          <div className="p-6">
            {recentFiles.length > 0 ? (
              <div className="space-y-4">
                {recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{file.original_name}</p>
                        <p className="text-sm text-gray-500">{file.company_name}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(file.created_at).toLocaleDateString('sk-SK')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Žiadne dokumenty</p>
            )}
          </div>
        </div>
      </div>

      {/* Systémové informácie */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Systémové informácie</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <ChartBarIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Celkový výkon</p>
              <p className="text-2xl font-semibold text-gray-900">98%</p>
            </div>
            <div className="text-center">
              <UsersIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Aktívni používatelia</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.users}</p>
            </div>
            <div className="text-center">
              <BuildingOfficeIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Spracované firmy</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.companies}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;










