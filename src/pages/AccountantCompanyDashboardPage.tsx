import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Company } from '../services/apiService';

// Lazy loading pre CompanyDashboard aby sme predišli cirkulárnej závislosti
const CompanyDashboard = React.lazy(() => import('../components/CompanyDashboard'));

interface AccountantCompanyDashboardPageProps {
  company: Company;
  userEmail: string;
  onBack: () => void;
}

const AccountantCompanyDashboardPage: React.FC<AccountantCompanyDashboardPageProps> = ({ 
  company, 
  userEmail, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-2 -ml-2"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Späť na zoznam firiem</span>
              </button>
              <div className="border-l border-gray-300 h-6 mx-2"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Dashboard firmy</h1>
                <p className="text-sm text-gray-600">{company.name}</p>
              </div>
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <React.Suspense fallback={
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 ml-3">Načítavam dashboard firmy...</p>
              </div>
            </div>
          }>
            <CompanyDashboard
              company={company}
              onClose={onBack}
              userEmail={userEmail}
              userRole="accountant"
            />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default AccountantCompanyDashboardPage;
