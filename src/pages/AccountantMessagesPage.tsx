import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import MessagesList from '../components/MessagesList';

interface AccountantMessagesPageProps {
  userEmail: string;
  onBack: () => void;
}

const AccountantMessagesPage: React.FC<AccountantMessagesPageProps> = ({ userEmail, onBack }) => {
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
          <h1 className="text-3xl font-bold text-gray-900">Správy</h1>
          <p className="text-gray-600 mt-2">
            Komunikácia s firmami a správami
          </p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <MessagesList 
              userEmail={userEmail} 
              userRole="accountant" 
              onMessageAction={() => {
                // Refresh messages count if needed
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantMessagesPage;
