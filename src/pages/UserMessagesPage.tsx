import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
  TrashIcon,
  MagnifyingGlassIcon
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
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [senderFilter, setSenderFilter] = useState('all');

  // Na?TA?tanie nepre?TA?tanA?ch sprA?v pouLlA?vate?la
  useEffect(() => {
    const loadUnreadMessages = async () => {
      try {
        setLoadingMessages(true);
        console.log('Na?TA?tavam nepre?TA?tanA? sprA?vy pre:', userEmail);
        const unreadMessages = await apiService.getUnreadMessages(userEmail);
        console.log('Na?TA?tanA? sprA?vy:', unreadMessages);
        setMessages(unreadMessages);
      } catch (error) {
        console.error('Chyba pri na?TA?tanA? nepre?TA?tanA?ch sprA?v:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadUnreadMessages();
  }, [userEmail]);

  // Ozna?Tenie sprA?vy ako pre?TA?tanA?
  const handleMarkAsRead = async (messageId: number) => {
    try {
      await apiService.markMessageAsRead(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Chyba pri ozna?TenA? sprA?vy ako pre?TA?tanA?:', error);
      alert('Chyba pri ozna?TenA? sprA?vy ako pre?TA?tanA?: ' + (error instanceof Error ? error.message : 'NeznA?ma chyba'));
    }
  };

  // Vymazanie sprA?vy
  const handleDeleteMessage = async (messageId: number) => {
    try {
      await apiService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Chyba pri mazanA? sprA?vy:', error);
      alert('Chyba pri mazanA? sprA?vy: ' + (error instanceof Error ? error.message : 'NeznA?ma chyba'));
    }
  };

  // Ozna?Tenie vL?etkA?ch filtrovanA?ch sprA?v ako pre?TA?tanA?
  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(filteredMessages.map(msg => apiService.markMessageAsRead(msg.id)));
      setMessages(prev => prev.filter(msg => !filteredMessages.find(fm => fm.id === msg.id)));
    } catch (error) {
      console.error('Chyba pri ozna?TenA? vL?etkA?ch sprA?v ako pre?TA?tanA?:', error);
      alert('Chyba pri ozna?TenA? vL?etkA?ch sprA?v ako pre?TA?tanA?: ' + (error instanceof Error ? error.message : 'NeznA?ma chyba'));
    }
  };

  // Filtrovanie sprA?v
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'all' || 
                          (message.company_name && message.company_name === companyFilter);
    
    const matchesSender = senderFilter === 'all' || 
                         message.sender_email === senderFilter;
    
    return matchesSearch && matchesCompany && matchesSender;
  });

  // ZA?skanie unikA?tnych firiem a odosielate?lov pre filter
  const companies = Array.from(new Set(messages.map(msg => msg.company_name).filter(Boolean)));
  const senders = Array.from(new Set(messages.map(msg => msg.sender_email)));

  // FormA?tovanie dA?tumu
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
                SpA?LA do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-8 w-8 text-purple-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Nepre?TA?tanA? sprA?vy</h1>
              </div>
            </div>
            {filteredMessages.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center transition-colors"
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                Ozna?TiLA vL?etky ako pre?TA?tanA?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam nepre?TA?tanA?ch sprA?v</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {messages.length} nepre?TA?tanA?ch sprA?v
                  {filteredMessages.length !== messages.length && (
                    <span className="ml-2 text-purple-600">
                      (ZobrazenA?: {filteredMessages.length})
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Filtre */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Vyh?ladA?vanie */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Vyh?ladaLA sprA?vy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              
              {/* Filter pod?la firmy */}
              <div>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="all">VL?etky firmy</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              
              {/* Filter pod?la odosielate?la */}
              <div>
                <select
                  value={senderFilter}
                  onChange={(e) => setSenderFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="all">VL?etci odosielatelia</option>
                  {senders.map(sender => (
                    <option key={sender} value={sender}>{sender}</option>
                  ))}
                </select>
              </div>
              
              {/* Reset filtrov */}
              <div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCompanyFilter('all');
                    setSenderFilter('all');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                >
                  ResetovaLA filtre
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loadingMessages ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Na?TA?tavam sprA?vy...</p>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{message.subject}</h3>
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            Nepre?TA?tanA?
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
                          Ozna?TiLA ako pre?TA?tanA?
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          VymazaLA
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <EnvelopeIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {messages.length > 0 ? 'L?iadne sprA?vy nevyhovujAs filtrom' : 'L?iadne nepre?TA?tanA? sprA?vy'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {messages.length > 0 
                    ? 'SkAsste zmeniLA nastavenia filtrov alebo vyh?ladA?vania.'
                    : 'VL?etky vaL?e sprA?vy sAs pre?TA?tanA?. NovA? sprA?vy sa zobrazia tu.'
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

export default UserMessagesPage;

