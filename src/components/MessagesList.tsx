import React, { useState, useEffect, useCallback } from 'react';
import { 
  EnvelopeIcon,
  PaperAirplaneIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';
import { hrService } from '../services/hrService';
import MessageModal from './MessageModal';

interface MessagesListProps {
  userEmail: string;
  userRole?: 'admin' | 'user' | 'accountant' | 'employee';
  companyId?: number;
  isAdmin?: boolean;
  onMessageAction?: () => void;
}

interface Message {
  id: number;
  sender_email: string;
  recipient_email: string;
  subject: string;
  content: string;
  company_id?: number;
  message_type: string;
  read_at?: string;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
  company_name?: string;
}

const MessagesList: React.FC<MessagesListProps> = ({ userEmail, userRole, companyId, isAdmin = false, onMessageAction }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'received' | 'sent'>('all');

  // Na�TA�tanie sprA?v
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      let messagesData: Message[];
      
      // Kontrola, �Ti je pouLlA�vate�l prihlA?senA?
      const token = apiService.getToken();
      if (!token) {
        console.log('PouLlA�vate�l nie je prihlA?senA?, presko�Tenie na�TA�tania sprA?v');
        setMessages([]);
        return;
      }
      
      console.log('Na�TA�tavam sprA?vy pre:', { userEmail, userRole, companyId, isAdmin });
      
      if (isAdmin) {
        messagesData = await apiService.getAllMessages();
      } else if (userRole === 'employee' && companyId) {
        // Pre zamestnancov pouLlA�vame user endpoint (rovnakA? ako pre user)
        console.log('PouLlA�vam user endpoint pre employee:', userEmail);
        messagesData = await apiService.getUserMessages(userEmail);
      } else if (companyId) {
        messagesData = await apiService.getCompanyMessages(companyId);
      } else {
        messagesData = await apiService.getUserMessages(userEmail);
      }
      
      console.log('Na�TA�tanA� sprA?vy:', messagesData);
      console.log('Po�Tet sprA?v:', messagesData.length);
      setMessages(messagesData);
    } catch (error) {
      console.error('Chyba pri na�TA�tanA� sprA?v:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, companyId, userEmail, userRole]);

  useEffect(() => {
    // Na�TA�tame sprA?vy iba ak je pouLlA�vate�l prihlA?senA?
    const token = apiService.getToken();
    if (token && userEmail) {
      loadMessages();
    }
  }, [userEmail, companyId, isAdmin, loadMessages]);

  // Filtrovanie sprA?v pod�la oprA?vnenA�
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  useEffect(() => {
    const filterMessagesByPermissions = async () => {
      let filtered = messages.filter(message => {
        if (filter === 'unread') {
          return !message.read_at && message.recipient_email === userEmail;
        }
        if (filter === 'received') {
          return message.recipient_email === userEmail;
        }
        if (filter === 'sent') {
          return message.sender_email === userEmail;
        }
        return true;
      });

      // Dodato�TnA� filtrovanie pod�la oprA?vnenA� pre prijA�manie sprA?v
      if (userRole === 'user') {
        // User mA�Lle prijA�maLA sprA?vy od Admin, priradenA?ch Accountant a svojich zamestnancov
        const userCompanies = await apiService.getUserCompanies(userEmail);
        const assignedAccountantEmails: string[] = [];
        const employeeEmails: string[] = [];
        
        // Na�TA�tame priradenA?ch As�TtovnA�kov a zamestnancov zo vL?etkA?ch firiem
        for (const company of userCompanies) {
          if (company.assignedToAccountants) {
            assignedAccountantEmails.push(...company.assignedToAccountants);
          }
          
          // Na�TA�tame zamestnancov pre kaLldAs firmu
          try {
            const employees = await hrService.getEmployees(company.id);
            employeeEmails.push(...employees.map(emp => emp.email));
          } catch (error) {
            console.error(`Chyba pri na�TA�tanA� zamestnancov pre firmu ${company.id}:`, error);
          }
        }
        
        filtered = filtered.filter(message => 
          message.sender_email === 'admin@portal.sk' || 
          assignedAccountantEmails.includes(message.sender_email) ||
          employeeEmails.includes(message.sender_email) || // sprA?vy od zamestnancov
          message.sender_email === userEmail // vlastnA� sprA?vy
        );
      } else if (userRole === 'accountant') {
        // Accountant mA�Lle prijA�maLA sprA?vy iba od Admin a priradenA?ch User
        const accountantCompanies = await apiService.getAccountantCompanies(userEmail);
        const assignedUserEmails: string[] = [];
        
        accountantCompanies.forEach(company => {
          if (company.owner_email) {
            assignedUserEmails.push(company.owner_email);
          }
        });
        
        filtered = filtered.filter(message => 
          message.sender_email === 'admin@portal.sk' || 
          assignedUserEmails.includes(message.sender_email) ||
          message.sender_email === userEmail // vlastnA� sprA?vy
        );
      } else if (userRole === 'employee') {
        // Employee mA�Lle prijA�maLA sprA?vy od svojej firmy (company owner) a posielaLA sprA?vy svojej firme
        console.log('Filtrovanie pre employee:', { userEmail, companyId });
        console.log('VL?etky sprA?vy pred filtrovanA�m:', messages);
        
        if (companyId) {
          const company = await apiService.getCompanyById(companyId);
          console.log('Company data:', company);
          if (company && company.owner_email) {
            console.log('Company owner email:', company.owner_email);
            console.log('User email:', userEmail);
            
            filtered = filtered.filter(message => {
              const isFromCompany = message.sender_email === company.owner_email;
              const isToCompany = message.recipient_email === company.owner_email;
              const isFromUser = message.sender_email === userEmail;
              const isToUser = message.recipient_email === userEmail;
              
              console.log('Message:', message.subject, {
                isFromCompany,
                isToCompany,
                isFromUser,
                isToUser,
                sender: message.sender_email,
                recipient: message.recipient_email
              });
              
              return isFromCompany || isToCompany || isFromUser || isToUser;
            });
            console.log('FiltrovanA� sprA?vy pre employee:', filtered);
          }
        } else {
          console.log('companyId nie je nastavenA� pre employee');
        }
      }
      // Admin mA�Lle prijA�maLA sprA?vy od vL?etkA?ch
      
      setFilteredMessages(filtered);
    };

    filterMessagesByPermissions();
  }, [messages, filter, userEmail, userRole]);

  // Ozna�Tenie sprA?vy ako pre�TA�tanA?
  const handleMarkAsRead = async (messageId: number) => {
    try {
      await apiService.markMessageAsRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read_at: new Date().toISOString() } : msg
      ));
      onMessageAction?.();
    } catch (error) {
      console.error('Chyba pri ozna�TenA� sprA?vy ako pre�TA�tanA?:', error);
    }
  };

  // Ozna�Tenie sprA?vy ako nepre�TA�tanA?
  const handleMarkAsUnread = async (messageId: number) => {
    try {
      await apiService.markMessageAsUnread(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read_at: undefined } : msg
      ));
      onMessageAction?.();
    } catch (error) {
      console.error('Chyba pri ozna�TenA� sprA?vy ako nepre�TA�tanA?:', error);
    }
  };

  // Vymazanie sprA?vy
  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm('Naozaj chcete vymazaLA tAsto sprA?vu?')) return;
    
    try {
      await apiService.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      onMessageAction?.();
    } catch (error) {
      console.error('Chyba pri vymazanA� sprA?vy:', error);
    }
  };

  // Odpove�Z na sprA?vu
  const handleReply = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageModal(true);
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <span className="text-red-500">dzs�</span>;
      case 'question':
        return <span className="text-blue-500">�t"</span>;
      case 'report':
        return <span className="text-green-500">dz"S</span>;
      case 'welcome':
        return <span className="text-purple-500">dz'<</span>;
      default:
        return <EnvelopeIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent': return 'UrgentnA?';
      case 'question': return 'OtA?zka';
      case 'report': return 'Report';
      case 'welcome': return 'VitajAsca';
      default: return 'VL?eobecnA?';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Na�TA�tavam sprA?vy...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SprA?vy</h2>
          <p className="text-gray-600 mt-1">
            {filteredMessages.length} sprA?v
            {filter === 'unread' && (
              <span className="text-blue-600 font-medium">
                {' '}({filteredMessages.filter(m => !m.read_at && m.recipient_email === userEmail).length} nepre�TA�tanA?ch)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowMessageModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          NovA? sprA?va
        </button>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          VL?etky ({messages.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Nepre�TA�tanA� ({messages.filter(m => !m.read_at && m.recipient_email === userEmail).length})
        </button>
        <button
          onClick={() => setFilter('received')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'received'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          PrijatA� ({messages.filter(m => m.recipient_email === userEmail).length})
        </button>
        <button
          onClick={() => setFilter('sent')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'sent'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          OdoslanA� ({messages.filter(m => m.sender_email === userEmail).length})
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">L?iadne sprA?vy</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'Zatia�l nemA?te Lliadne sprA?vy.' : 
               filter === 'unread' ? 'VL?etky sprA?vy sAs pre�TA�tanA�.' : 
               filter === 'received' ? 'Zatia�l ste neprijali Lliadne sprA?vy.' :
               'Zatia�l ste neodoslali Lliadne sprA?vy.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                message.read_at ? 'border-gray-200' : 'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getMessageTypeIcon(message.message_type)}
                    <h3 className="text-lg font-medium text-gray-900">{message.subject}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getMessageTypeLabel(message.message_type)}
                    </span>
                    {!message.read_at && message.recipient_email === userEmail && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        NovA�
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Od:</span> {message.sender_name || message.sender_email}
                    </p>
                    <p>
                      <span className="font-medium">Pre:</span> {message.recipient_name || message.recipient_email}
                    </p>
                    {message.company_name && (
                      <p>
                        <span className="font-medium">Firma:</span> {message.company_name}
                      </p>
                    )}
                    <p className="text-gray-500">
                      {new Date(message.created_at).toLocaleString('sk-SK')}
                    </p>
                  </div>
                  
                  <p className="text-gray-700 mt-3">{message.content}</p>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {(message.recipient_email === userEmail || isAdmin) && (
                    <button
                      onClick={() => message.read_at ? handleMarkAsUnread(message.id) : handleMarkAsRead(message.id)}
                      className="text-gray-600 hover:text-gray-700 p-1"
                      title={message.read_at ? 'Ozna�TiLA ako nepre�TA�tanA�' : 'Ozna�TiLA ako pre�TA�tanA�'}
                    >
                      {message.read_at ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleReply(message)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="OdpovedaLA"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="VymazaLA"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedMessage(null);
        }}
        onSend={() => {
          loadMessages();
          onMessageAction?.();
        }}
        senderEmail={userEmail}
        userRole={userRole}
        companyId={companyId}
        initialRecipient={selectedMessage?.sender_email === userEmail ? selectedMessage.recipient_email : selectedMessage?.sender_email}
        initialSubject={selectedMessage ? `Re: ${selectedMessage.subject}` : ''}
      />
    </div>
  );
};

export default MessagesList;

