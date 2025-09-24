import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

interface AdminMessagesPageProps {
  onBack: () => void;
  onMessageAction?: () => void;
}

interface Message {
  id: number;
  subject: string;
  content: string;
  sender_email: string;
  sender_name: string;
  recipient_email: string;
  recipient_name: string;
  company_id: number;
  company_name: string;
  message_type: string;
  read_at: string | null;
  created_at: string;
}

const AdminMessagesPage: React.FC<AdminMessagesPageProps> = ({ onBack, onMessageAction }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [senderFilter, setSenderFilter] = useState('all');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [readStatusFilter, setReadStatusFilter] = useState('all');
  const [messageTypeFilter, setMessageTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Na�TA�tanie vL?etkA?ch sprA?v
  useEffect(() => {
    const loadAllMessages = async () => {
      try {
        setLoadingMessages(true);
        console.log('Na�TA�tavam vL?etky sprA?vy...');
        const allMessages = await apiService.getAllMessages();
        console.log('Na�TA�tanA� sprA?vy:', allMessages);
        setMessages(allMessages);
      } catch (error) {
        console.error('Chyba pri na�TA�tanA� sprA?v:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadAllMessages();
  }, []);

  // Filtrovanie sprA?v
  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'all' || 
                          (message.company_name && message.company_name === companyFilter);
    
    const matchesSender = senderFilter === 'all' || 
                         message.sender_email === senderFilter;
    
    const matchesRecipient = recipientFilter === 'all' || 
                            message.recipient_email === recipientFilter;
    
    const matchesReadStatus = readStatusFilter === 'all' || 
                             (readStatusFilter === 'read' && message.read_at) ||
                             (readStatusFilter === 'unread' && !message.read_at);
    
    const matchesMessageType = messageTypeFilter === 'all' || 
                              message.message_type === messageTypeFilter;
    
    return matchesSearch && matchesCompany && matchesSender && matchesRecipient && matchesReadStatus && matchesMessageType;
  });

  // ZA�skanie unikA?tnych hodnA�t pre filter
  const companies = Array.from(new Set(messages.map(msg => msg.company_name).filter(Boolean)));
  const senders = Array.from(new Set(messages.map(msg => msg.sender_email)));
  const recipients = Array.from(new Set(messages.map(msg => msg.recipient_email)));
  const messageTypes = Array.from(new Set(messages.map(msg => msg.message_type)));

  // VA?ber sprA?v
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isSelected = (id: number) => selectedIds.has(id);

  const selectAllVisible = () => {
    setSelectedIds(new Set(filteredMessages.map(m => m.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Naozaj chcete vymazaLA ${selectedIds.size} vybranA?ch sprA?v?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => apiService.deleteMessage(id)));
      setMessages(prev => prev.filter(msg => !selectedIds.has(msg.id)));
      clearSelection();
      onMessageAction?.();
    } catch (error) {
      console.error('Chyba pri hromadnom mazanA� sprA?v:', error);
      alert('Chyba pri hromadnom mazanA� sprA?v');
    }
  };

  // Ozna�Tenie sprA?vy ako pre�TA�tanA?/nepre�TA�tanA?
  const handleToggleReadStatus = async (messageId: number, isRead: boolean) => {
    try {
      if (isRead) {
        await apiService.markMessageAsRead(messageId);
      } else {
        await apiService.markMessageAsUnread(messageId);
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, read_at: isRead ? new Date().toISOString() : null }
          : msg
      ));
      
      // Aktualizujeme po�Tty v Admin dashboarde
      onMessageAction?.();
    } catch (error) {
      console.error('Chyba pri zmenenA� stavu sprA?vy:', error);
      alert('Chyba pri zmenenA� stavu sprA?vy: ' + (error instanceof Error ? error.message : 'NeznA?ma chyba'));
    }
  };

  // Vymazanie sprA?vy
  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Naozaj chcete vymazaLA tAsto sprA?vu?')) return;
    
    try {
      await apiService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Aktualizujeme po�Tty v Admin dashboarde
      onMessageAction?.();
    } catch (error) {
      console.error('Chyba pri mazanA� sprA?vy:', error);
      alert('Chyba pri mazanA� sprA?vy: ' + (error instanceof Error ? error.message : 'NeznA?ma chyba'));
    }
  };

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
                SpA�LA do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <EnvelopeIcon className="h-8 w-8 text-purple-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">SprA?va vL?etkA?ch sprA?v</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam vL?etkA?ch sprA?v</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {messages.length} sprA?v
                  {filteredMessages.length !== messages.length && (
                    <span className="ml-2 text-purple-600">
                      (ZobrazenA�: {filteredMessages.length})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">VybranA�: {selectedIds.size}</span>
                <button
                  onClick={selectAllVisible}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  VybraLA zobrazenA�
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ZruL?iLA vA?ber
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className={`px-3 py-1 text-sm rounded-md flex items-center ${selectedIds.size === 0 ? 'bg-red-100 text-red-300 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  title={selectedIds.size === 0 ? 'Najprv vyberte sprA?vy' : 'VymazaLA vybranA� sprA?vy'}
                >
                  <TrashIcon className="h-4 w-4 mr-1" /> VymazaLA vybranA�
                </button>
              </div>
            </div>
            
            {/* Filtre */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Vyh�ladA?vanie */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Vyh�ladaLA sprA?vy..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
              </div>
              
              {/* Filter pod�la firmy */}
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
              
              {/* Filter pod�la odosielate�la */}
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

              {/* Filter pod�la prA�jemcu */}
              <div>
                <select
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="all">VL?etci prA�jemcovia</option>
                  {recipients.map(recipient => (
                    <option key={recipient} value={recipient}>{recipient}</option>
                  ))}
                </select>
              </div>

              {/* Filter pod�la stavu pre�TA�tania */}
              <div>
                <select
                  value={readStatusFilter}
                  onChange={(e) => setReadStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="all">VL?etky sprA?vy</option>
                  <option value="read">Pre�TA�tanA�</option>
                  <option value="unread">Nepre�TA�tanA�</option>
                </select>
              </div>

              {/* Filter pod�la typu sprA?vy */}
              <div>
                <select
                  value={messageTypeFilter}
                  onChange={(e) => setMessageTypeFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                >
                  <option value="all">VL?etky typy</option>
                  {messageTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset filtrov */}
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCompanyFilter('all');
                  setSenderFilter('all');
                  setRecipientFilter('all');
                  setReadStatusFilter('all');
                  setMessageTypeFilter('all');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                ResetovaLA filtre
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loadingMessages ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Na�TA�tavam sprA?vy...</p>
              </div>
            ) : filteredMessages.length > 0 ? (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="mb-2">
                          <label className="inline-flex items-center space-x-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={isSelected(message.id)}
                              onChange={() => toggleSelect(message.id)}
                            />
                            <span>VybraLA</span>
                          </label>
                        </div>
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">{message.subject}</h3>
                          {message.read_at ? (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Pre�TA�tanA�
                            </span>
                          ) : (
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                              <EyeSlashIcon className="h-3 w-3 mr-1" />
                              Nepre�TA�tanA�
                            </span>
                          )}
                          {message.message_type && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full ml-2">
                              {message.message_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{message.content}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Od: {message.sender_name || message.sender_email}</span>
                          </div>
                          <div className="flex items-center">
                            <span>Pre: {message.recipient_name || message.recipient_email}</span>
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
                          onClick={() => handleToggleReadStatus(message.id, !message.read_at)}
                          className={`text-sm font-medium flex items-center ${
                            message.read_at 
                              ? 'text-orange-600 hover:text-orange-700' 
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {message.read_at ? (
                            <>
                              <EyeSlashIcon className="h-4 w-4 mr-1" />
                              Ozna�TiLA ako nepre�TA�tanA�
                            </>
                          ) : (
                            <>
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Ozna�TiLA ako pre�TA�tanA�
                            </>
                          )}
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
                  {messages.length > 0 ? 'L?iadne sprA?vy nevyhovujAs filtrom' : 'L?iadne sprA?vy'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {messages.length > 0 
                    ? 'SkAsste zmeniLA nastavenia filtrov alebo vyh�ladA?vania.'
                    : 'V systA�me nie sAs Lliadne sprA?vy.'
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

export default AdminMessagesPage;

