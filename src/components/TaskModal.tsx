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
  // Nové props pre účtovníka
  isAccountant?: boolean;
  assignedCompanies?: Array<{
    id: number;
    name: string;
    ico: string;
  }>;
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
  assignedCompanies = []
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

  // Kategórie úloh
  const taskCategories = [
    { id: 'accounting', name: 'Účtovníctvo' },
    { id: 'tax', name: 'Daňové záležitosti' },
    { id: 'legal', name: 'Právne záležitosti' },
    { id: 'hr', name: 'Personalistika' },
    { id: 'operations', name: 'Operácie' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'it', name: 'IT podpora' },
    { id: 'other', name: 'Ostatné' },
  ];

  // Naplnenie formulára pri editácii
  useEffect(() => {
    if (!isOpen) return; // Neresetuj ak nie je modal otvorený
    
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
      // Nastaviť firmu ak je dostupná
      if (task.companyId) {
        setSelectedCompanyId(task.companyId);
      }
    } else {
      // Reset formulára pre novú úlohu
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
      // Nastaviť prvú firmu ako default pre účtovníka
      if (isAccountant && assignedCompanies.length > 0) {
        setSelectedCompanyId(assignedCompanies[0].id);
      } else {
        setSelectedCompanyId('');
      }
    }
    setErrors({});
  }, [task, isOpen, isAccountant]); // Odstránené assignedCompanies z závislostí

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Názov úlohy je povinný';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Popis úlohy je povinný';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Priradenie zamestnanca je povinné';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Termín dokončenia je povinný';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Termín nemôže byť v minulosti';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Kategória je povinná';
    }

    // Pre účtovníka kontrolujeme aj vybranú firmu
    if (isAccountant && !selectedCompanyId) {
      newErrors.company = 'Výber firmy je povinný';
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
      // Pre účtovníkov používame email ako assignedTo
      const assignedToEmail = formData.assignedTo;
      const assignedToName = assignedToEmail.includes('@') 
        ? assignedToEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : assignedToEmail;
      
      // Určiť companyId a companyName
      let companyId: number | undefined;
      let companyName: string | undefined;

      if (isAccountant && selectedCompanyId) {
        // Pre účtovníka používame vybranú firmu
        companyId = selectedCompanyId as number;
        const selectedCompany = assignedCompanies.find(c => c.id === selectedCompanyId);
        companyName = selectedCompany?.name;
      } else if (company) {
        // Pre ostatných používame company prop
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
        createdBy: 'Aktuálny používateľ', // V reálnej aplikácii by tu bolo meno prihláseného používateľa
        companyId: companyId,
        companyName: companyName,
      };

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní úlohy:', error);
      setErrors({ submit: 'Nepodarilo sa uložiť úlohu' });
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
    
    // Vyčistiť chybu pre dané pole
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

  // Kontrola či sú dostupné firmy
  if (!isAccountant && !company) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Chyba
            </h2>
            <p className="text-gray-600 mb-6">
              Pre vytvorenie úlohy musíte mať aspoň jednu firmu. Najprv vytvorte firmu.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Zavrieť
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
            {task ? 'Upraviť úlohu' : 'Nová úloha'}
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
          {/* Názov úlohy */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Názov úlohy *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Zadajte názov úlohy"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Popis */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Popis úlohy *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Podrobný popis úlohy..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Kategória a Priorita */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategória *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Vyberte kategóriu</option>
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
                <option value="low">Nízka</option>
                <option value="medium">Stredná</option>
                <option value="high">Vysoká</option>
                <option value="urgent">Urgentná</option>
              </select>
            </div>
          </div>

          {/* Výber firmy pre účtovníka */}
          {isAccountant && (
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Priradiť firme *
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
                    {company.name} (IČO: {company.ico})
                  </option>
                ))}
              </select>
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company}</p>
              )}
            </div>
          )}

          {/* Priradenie a Termín */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                {isAccountant ? 'Priradiť zamestnancovi firmy' : 'Priradiť zamestnancovi'} *
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
                    <option value="owner">Vlastník firmy</option>
                    <option value="manager">Manažér</option>
                    <option value="employee">Zamestnanec</option>
                    <option value="accountant">Účtovník</option>
                  </>
                ) : (
                  <>
                    <option value="">Vyberte účtovníka</option>
                    {company && company.assignedToAccountants && company.assignedToAccountants.length > 0 ? (
                      company.assignedToAccountants.map((accountantEmail, index) => {
                        const accountantName = accountantEmail.includes('@') 
                          ? accountantEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          : accountantEmail;
                        return (
                          <option key={index} value={accountantEmail}>
                            {accountantName} - Účtovník ({accountantEmail})
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>
                        Žiadni priradení účtovníci
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
                Termín dokončenia *
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

          {/* Odhadované hodiny */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
              Odhadované hodiny
            </label>
            <input
              type="number"
              id="estimatedHours"
              value={formData.estimatedHours}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Napríklad: 8"
            />
          </div>

          {/* Status (len pri editácii) */}
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
                <option value="pending">Čakajúca</option>
                <option value="in_progress">V spracovaní</option>
                <option value="completed">Dokončená</option>
                <option value="cancelled">Zrušená</option>
              </select>
            </div>
          )}

          {/* Chyba pri odosielaní */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Tlačidlá */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ukladám...' : (task ? 'Uložiť zmeny' : 'Vytvoriť úlohu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
