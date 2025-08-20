import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

interface UserMessagesPageProps {
  userEmail?: string;
  onBack: () => void;
}

interface Message {
  id: number;
  subject: string;
  content: string;
  sender_email: string;
  sender_name: string;
  recipient_email: string;
  company_id: number;
  company_name: string;
  is_read: boolean;
  created_at: string;
}

const UserMessagesPage: React.FC<UserMessagesPageProps> = ({ 
  userEmail = 'user@portal.sk', 
  onBack 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Načítanie neprečítaných správ používateľa
  useEffect(() => {
    const loadUnreadMessages = async () => {
      try {
        setLoadingMessages(true);
        const unreadMessages = await apiService.getUnreadMessages(userEmail);
        setMessages(unreadMessages);
      } catch (error) {
        console.error('Chyba pri načítaní neprečítaných správ:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadUnreadMessages();
  }, [userEmail]);

  // Označenie správy ako prečítaná
  const handleMarkAsRead = async (messageId: number) => {
    try {
      await apiService.markMessageAsRead(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Chyba pri označení správy ako prečítaná:', error);
      alert('Chyba pri označení správy ako prečítaná: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  // Vymazanie správy
  const handleDeleteMessage = async (messageId: number) => {
    try {
      await apiService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Chyba pri mazaní správy:', error);
      alert('Chyba pri mazaní správy: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
  };

  // Označenie všetkých správ ako prečítané
  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(messages.map(msg => apiService.markMessageAsRead(msg.id)));
      setMessages([]);
    } catch (error) {
      console.error('Chyba pri označení všetkých správ ako prečítané:', error);
      alert('Chyba pri označení všetkých správ ako prečítané: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
    }
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
                <EnvelopeIcon className="h-8 w-8 text-purple-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Neprečítané správy</h1>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center transition-colors"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Označiť všetky ako prečítané
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam neprečítaných správ</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {messages.length} neprečítaných správ
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loadingMessages ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam správy...</p>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{message.subject}</h3>
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            Neprečítané
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{message.content}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Od: {message.sender_name} ({message.sender_email})</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            <span>{formatDate(message.created_at)}</span>
                          </div>
                          {message.company_name && (
                            <div className="flex items-center">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {message.company_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleMarkAsRead(message.id)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Označiť ako prečítané
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Vymazať
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <EnvelopeIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Žiadne neprečítané správy</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Všetky vaše správy sú prečítané. Nové správy sa zobrazia tu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMessagesPage;
