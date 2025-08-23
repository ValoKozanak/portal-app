import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';
import { hrService } from '../services/hrService';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  senderEmail: string;
  userRole?: 'admin' | 'user' | 'accountant' | 'employee';
  companyId?: number;
  initialRecipient?: string;
  initialSubject?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  senderEmail,
  userRole,
  companyId,
  initialRecipient = '',
  initialSubject = ''
}) => {
  const [recipientEmail, setRecipientEmail] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(companyId);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Aktualizácia recipientEmail keď sa zmení initialRecipient
  useEffect(() => {
    setRecipientEmail(initialRecipient);
  }, [initialRecipient]);

  // Načítanie firiem pre Admin a Accountant
  useEffect(() => {
    const loadCompanies = async () => {
      if (userRole === 'admin' || userRole === 'accountant') {
        try {
          setLoadingCompanies(true);
          let companiesData;
          
          if (userRole === 'admin') {
            companiesData = await apiService.getAllCompanies();
          } else {
            companiesData = await apiService.getAccountantCompanies(senderEmail);
          }
          
          setCompanies(companiesData);
        } catch (error) {
          console.error('Chyba pri načítaní firiem:', error);
        } finally {
          setLoadingCompanies(false);
        }
      }
    };

    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen, userRole, senderEmail]);

  // Načítanie používateľov pre výber príjemcu
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const allUsers = await apiService.getAllUsers();
        
        // Filtrovanie používateľov podľa role
        let filteredUsers = allUsers;
        
        if (userRole === 'user') {
          // User (firma) môže poslať správu Admin, priradeným Accountant a svojim zamestnancom
          const userCompanies = await apiService.getUserCompanies(senderEmail);
          const assignedAccountantEmails: string[] = [];
          const employeeEmails: string[] = [];
          
          // Extraktujeme všetkých priradených účtovníkov a zamestnancov zo všetkých firiem používateľa
          for (const company of userCompanies) {
            if (company.assignedToAccountants) {
              assignedAccountantEmails.push(...company.assignedToAccountants);
            }
            
            // Načítame zamestnancov pre každú firmu
            try {
              const employees = await hrService.getEmployees(company.id);
              employeeEmails.push(...employees.map(emp => emp.email));
            } catch (error) {
              console.error(`Chyba pri načítaní zamestnancov pre firmu ${company.id}:`, error);
            }
          }
          
          filteredUsers = allUsers.filter(user => 
            user.role === 'admin' || 
            (user.role === 'accountant' && assignedAccountantEmails.includes(user.email)) ||
            (user.role === 'employee' && employeeEmails.includes(user.email))
          );
        } else if (userRole === 'accountant') {
          // Accountant môže poslať správu iba Admin a priradeným User (z jeho firiem)
          // Najprv získame firmy, ktoré má accountant na starosti
          const accountantCompanies = await apiService.getAccountantCompanies(senderEmail);
          const assignedUserEmails: string[] = [];
          
          // Extraktujeme všetkých používateľov z firiem, ktoré má accountant na starosti
          accountantCompanies.forEach(company => {
            if (company.owner_email) {
              assignedUserEmails.push(company.owner_email);
            }
          });
          
          filteredUsers = allUsers.filter(user => 
            user.role === 'admin' || 
            (user.role === 'user' && assignedUserEmails.includes(user.email))
          );
        } else if (userRole === 'employee') {
          // Employee môže poslať správu iba svojej firme (company owner)
          if (companyId) {
            const company = await apiService.getCompanyById(companyId);
            if (company && company.owner_email) {
              // Namiesto zobrazenia "User" zobrazíme konkrétnu firmu
              const companyOwner = allUsers.find(user => user.email === company.owner_email);
              if (companyOwner) {
                filteredUsers = [{
                  ...companyOwner,
                  name: `${company.name} (${companyOwner.name})` // Zobrazíme názov firmy + meno vlastníka
                }];
              }
            }
          }
        }
        // Admin môže poslať správu všetkým
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Chyba pri načítaní používateľov:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, userRole, senderEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail || !subject || !content.trim()) {
      setError('Všetky polia musia byť vyplnené');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Odosielam správu:', {
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        subject: subject.trim(),
        content: content.trim(),
        company_id: selectedCompanyId,
        message_type: messageType
      });

      const response = await apiService.sendMessage({
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        subject: subject.trim(),
        content: content.trim(),
        company_id: selectedCompanyId,
        message_type: messageType
      });

      console.log('Správa odoslaná úspešne:', response);

      // Reset formulára
      setRecipientEmail('');
      setSubject('');
      setContent('');
      setMessageType('general');
      
      // Zobrazíme úspešnú správu
      alert('Správa bola úspešne odoslaná!');
      
      onSend();
      onClose();
    } catch (error) {
      console.error('Chyba pri odosielaní správy:', error);
      setError(error instanceof Error ? error.message : 'Chyba pri odosielaní správy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecipientEmail(initialRecipient);
    setSubject(initialSubject);
    setContent('');
    setMessageType('general');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Nová správa
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Príjemca */}
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
              Príjemca *
            </label>
            <div className="relative">
              <input
                type="email"
                id="recipient"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
                required
              />
              {loadingUsers ? (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <select
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="absolute right-3 top-2.5 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <option value="">Vybrať používateľa</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Firma (iba pre Admin a Accountant) */}
          {(userRole === 'admin' || userRole === 'accountant') && (
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Firma (pre ktorú sa správa posiela)
              </label>
              <div className="relative">
                <select
                  id="company"
                  value={selectedCompanyId || ''}
                  onChange={(e) => setSelectedCompanyId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Vybrať firmu (voliteľné)</option>
                  {loadingCompanies ? (
                    <option value="" disabled>Načítavam firmy...</option>
                  ) : (
                    companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} - {company.owner_email}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Predmet */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Predmet *
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Zadajte predmet správy"
              required
            />
          </div>

          {/* Typ správy */}
          <div>
            <label htmlFor="messageType" className="block text-sm font-medium text-gray-700 mb-2">
              Typ správy
            </label>
            <select
              id="messageType"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="general">Všeobecná</option>
              <option value="question">Otázka</option>
              <option value="report">Report</option>
              <option value="urgent">Urgentná</option>
              <option value="welcome">Vitajúca</option>
            </select>
          </div>

          {/* Obsah */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Obsah správy *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Napíšte obsah správy..."
              required
            />
          </div>

          {/* Chyba */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Tlačidlá */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Odosielam...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Odoslať správu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageModal;
