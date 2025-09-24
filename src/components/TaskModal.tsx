import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  assignedToEmail?: string;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  category: string;
  estimatedHours?: number;
  actualHours?: number;
  attachments?: string[];
  comments?: Comment[];
  companyId?: number;
  companyName?: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  task?: Task | null;
  companyEmployees: Employee[];
  company?: {
    id: number;
    name: string;
    assignedToAccountants?: string[];
  };
  // NovA� props pre As�TtovnA�ka
  isAccountant?: boolean;
  assignedCompanies?: Array<{
    id: number;
    name: string;
    ico: string;
  }>;
  userEmail?: string; // Email prihlA?senA�ho pouLlA�vate�la
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  task, 
  companyEmployees,
  company,
  isAccountant = false,
  assignedCompanies = [],
  userEmail = ''
}) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo: string;
    dueDate: string;
    category: string;
    estimatedHours: string;
  }>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    category: '',
    estimatedHours: '',
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | ''>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KategAlrie Asloh
  const taskCategories = [
    { id: 'accounting', name: 'As�TtovnA�ctvo' },
    { id: 'tax', name: 'DaL�ovA� zA?leLlitosti' },
    { id: 'legal', name: 'PrA?vne zA?leLlitosti' },
    { id: 'hr', name: 'Personalistika' },
    { id: 'operations', name: 'OperA?cie' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'it', name: 'IT podpora' },
    { id: 'other', name: 'OstatnA�' },
  ];

  // Naplnenie formulA?ra pri editA?cii
  useEffect(() => {
    if (!isOpen) return; // Neresetuj ak nie je modal otvorenA?
    
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        category: task.category,
        estimatedHours: task.estimatedHours?.toString() || '',
      });
      // NastaviLA firmu ak je dostupnA?
      if (task.companyId) {
        setSelectedCompanyId(task.companyId);
      }
    } else {
      // Reset formulA?ra pre novAs Aslohu
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        category: '',
        estimatedHours: '',
      });
      // NastaviLA prvAs firmu ako default pre As�TtovnA�ka
      if (isAccountant && assignedCompanies.length > 0) {
        setSelectedCompanyId(assignedCompanies[0].id);
      } else {
        setSelectedCompanyId('');
      }
    }
    setErrors({});
  }, [task, isOpen, isAccountant]); // OdstrA?nenA� assignedCompanies z zA?vislostA�

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'NA?zov Aslohy je povinnA?';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Popis Aslohy je povinnA?';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Priradenie zamestnanca je povinnA�';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'TermA�n dokon�Tenia je povinnA?';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'TermA�n nemA�Lle byLA v minulosti';
      }
    }

    if (!formData.category) {
      newErrors.category = 'KategAlria je povinnA?';
    }

    // Pre As�TtovnA�ka kontrolujeme aj vybranAs firmu
    if (isAccountant && !selectedCompanyId) {
      newErrors.company = 'VA?ber firmy je povinnA?';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Pre As�TtovnA�kov pouLlA�vame generickA� hodnoty pre assignedTo, ale email As�TtovnA�ka pre assignedToEmail
      const assignedToEmail = isAccountant ? userEmail : formData.assignedTo;
      const assignedToName = isAccountant 
        ? formData.assignedTo 
        : (formData.assignedTo.includes('@') 
          ? formData.assignedTo.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : formData.assignedTo);
      
      // Ur�TiLA companyId a companyName
      let companyId: number | undefined;
      let companyName: string | undefined;

      if (isAccountant && selectedCompanyId) {
        // Pre As�TtovnA�ka pouLlA�vame vybranAs firmu
        companyId = selectedCompanyId as number;
        const selectedCompany = assignedCompanies.find(c => c.id === selectedCompanyId);
        companyName = selectedCompany?.name;
      } else if (company) {
        // Pre ostatnA?ch pouLlA�vame company prop
        companyId = company.id;
        companyName = company.name;
      }

      const taskData: Omit<Task, 'id' | 'createdAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        assignedTo: assignedToName,
        assignedToEmail: assignedToEmail,
        dueDate: formData.dueDate,
        category: formData.category,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        createdBy: userEmail || 'AktuA?lny pouLlA�vate�l',
        companyId: companyId,
        companyName: companyName,
      };

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladanA� Aslohy:', error);
      setErrors({ submit: 'Nepodarilo sa uloLliLA Aslohu' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('handleInputChange called:', field, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('New formData:', newData);
      return newData;
    });
    
    // Vy�TistiLA chybu pre danA� pole
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  };

  if (!isOpen) return null;

  // Kontrola �Ti sAs dostupnA� firmy
  if (!isAccountant && !company) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Chyba
            </h2>
            <p className="text-gray-600 mb-6">
              Pre vytvorenie Aslohy musA�te maLA aspoL� jednu firmu. Najprv vytvorte firmu.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ZavrieLA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'UpraviLA Aslohu' : 'NovA? Asloha'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* NA?zov Aslohy */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              NA?zov Aslohy *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Zadajte nA?zov Aslohy"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Popis */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Popis Aslohy *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="PodrobnA? popis Aslohy..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* KategAlria a Priorita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                KategAlria *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Vyberte kategAlriu</option>
                {taskCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priorita
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="low">NA�zka</option>
                <option value="medium">StrednA?</option>
                <option value="high">VysokA?</option>
                <option value="urgent">UrgentnA?</option>
              </select>
            </div>
          </div>

          {/* VA?ber firmy pre As�TtovnA�ka */}
          {isAccountant && (
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                PriradiLA firme *
              </label>
              <select
                id="company"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value ? parseInt(e.target.value) : '')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.company ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Vyberte firmu</option>
                {assignedCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} (I�SO: {company.ico})
                  </option>
                ))}
              </select>
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>
          )}

          {/* Priradenie a TermA�n */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                {isAccountant ? 'PriradiLA zamestnancovi firmy' : 'PriradiLA zamestnancovi'} *
              </label>
              <select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {isAccountant ? (
                  <>
                    <option value="">Vyberte zamestnanca firmy</option>
                    <option value="owner">VlastnA�k firmy</option>
                    <option value="manager">ManaLlA�r</option>
                    <option value="employee">Zamestnanec</option>
                    <option value="accountant">As�TtovnA�k</option>
                  </>
                ) : (
                  <>
                    <option value="">Vyberte As�TtovnA�ka</option>
                    {company && company.assignedToAccountants && company.assignedToAccountants.length > 0 ? (
                      company.assignedToAccountants.map((accountantEmail, index) => {
                        const accountantName = accountantEmail.includes('@') 
                          ? accountantEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          : accountantEmail;
                        return (
                          <option key={index} value={accountantEmail}>
                            {accountantName} - As�TtovnA�k ({accountantEmail})
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>
                        L?iadni priradenA� As�TtovnA�ci
                      </option>
                    )}
                  </>
                )}
              </select>
              {errors.assignedTo && (
                <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>
              )}
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                TermA�n dokon�Tenia *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.dueDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>
          </div>

          {/* OdhadovanA� hodiny */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
              OdhadovanA� hodiny
            </label>
            <input
              type="number"
              id="estimatedHours"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="NaprA�klad: 8"
            />
          </div>

          {/* Status (len pri editA?cii) */}
          {task && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">�SakajAsca</option>
                <option value="in_progress">V spracovanA�</option>
                <option value="completed">Dokon�TenA?</option>
                <option value="cancelled">ZruL?enA?</option>
              </select>
            </div>
          )}

          {/* Chyba pri odosielanA� */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Tla�TidlA? */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              ZruL?iLA
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'UkladA?m...' : (task ? 'UloLliLA zmeny' : 'VytvoriLA Aslohu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

