import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { Company } from '../services/apiService';

interface CompanyFormData {
  id?: number;
  name: string;
  ico: string;
  address: string;
  business_registry: string;
  vat_id: string;
  tax_id: string;
  authorized_person: string;
  contact_phone: string;
  contact_email: string;
}

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: CompanyFormData) => void;
  currentCompany?: Company;
  isEditing?: boolean;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentCompany,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<CompanyFormData>(
    currentCompany ? {
      id: currentCompany.id,
      name: currentCompany.name,
      ico: currentCompany.ico,
      address: currentCompany.address,
      business_registry: currentCompany.business_registry || '',
      vat_id: currentCompany.vat_id || '',
      tax_id: currentCompany.tax_id || '',
      authorized_person: currentCompany.authorized_person,
      contact_phone: currentCompany.contact_phone || '',
      contact_email: currentCompany.contact_email || ''
    } : {
      name: '',
      ico: '',
      address: '',
      business_registry: '',
      vat_id: '',
      tax_id: '',
      authorized_person: '',
      contact_phone: '',
      contact_email: ''
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Názov firmy je povinný';
    }

    if (!formData.ico.trim()) {
      newErrors.ico = 'IČO je povinné';
    } else if (!/^\d{8}$/.test(formData.ico.replace(/\s/g, ''))) {
      newErrors.ico = 'IČO musí mať 8 číslic';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Adresa je povinná';
    }

    if (!formData.business_registry.trim()) {
      newErrors.business_registry = 'Číslo obchodného registra je povinné';
    }

    if (formData.vat_id && !/^SK\d{10}$/.test(formData.vat_id.replace(/\s/g, ''))) {
      newErrors.vat_id = 'IČ DPH musí mať formát SK + 10 číslic';
    }

    if (formData.tax_id && !/^\d{10}$/.test(formData.tax_id.replace(/\s/g, ''))) {
      newErrors.tax_id = 'DIČ musí mať 10 číslic';
    }

    if (!formData.authorized_person.trim()) {
      newErrors.authorized_person = 'Osoba oprávnená konať je povinná';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Neplatný formát emailu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const companyToSave = {
        ...formData,
        id: currentCompany?.id || undefined
      };
      await onSave(companyToSave);
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Chyba pri ukladaní firmy:', error);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(currentCompany ? {
      id: currentCompany.id,
      name: currentCompany.name,
      ico: currentCompany.ico,
      address: currentCompany.address,
      business_registry: currentCompany.business_registry || '',
      vat_id: currentCompany.vat_id || '',
      tax_id: currentCompany.tax_id || '',
      authorized_person: currentCompany.authorized_person,
      contact_phone: currentCompany.contact_phone || '',
      contact_email: currentCompany.contact_email || ''
    } : {
      name: '',
      ico: '',
      address: '',
      business_registry: '',
      vat_id: '',
      tax_id: '',
      authorized_person: '',
      contact_phone: '',
      contact_email: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Upraviť firmu' : 'Pridať novú firmu'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Základné údaje */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Základné údaje</h3>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Názov firmy *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Názov spoločnosti"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="ico" className="block text-sm font-medium text-gray-700 mb-2">
                IČO *
              </label>
              <input
                type="text"
                id="ico"
                name="ico"
                value={formData.ico}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.ico ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345678"
                maxLength={8}
              />
              {errors.ico && (
                <p className="mt-1 text-sm text-red-600">{errors.ico}</p>
              )}
            </div>

            <div>
              <label htmlFor="business_registry" className="block text-sm font-medium text-gray-700 mb-2">
                Č. obchodného registra *
              </label>
              <input
                type="text"
                id="business_registry"
                name="business_registry"
                value={formData.business_registry}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.business_registry ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345/A"
              />
              {errors.business_registry && (
                <p className="mt-1 text-sm text-red-600">{errors.business_registry}</p>
              )}
            </div>

            <div>
              <label htmlFor="vat_id" className="block text-sm font-medium text-gray-700 mb-2">
                IČ DPH
              </label>
              <input
                type="text"
                id="vat_id"
                name="vat_id"
                value={formData.vat_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.vat_id ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="SK1234567890"
              />
              {errors.vat_id && (
                <p className="mt-1 text-sm text-red-600">{errors.vat_id}</p>
              )}
            </div>

            <div>
              <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-2">
                DIČ
              </label>
              <input
                type="text"
                id="tax_id"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.tax_id ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234567890"
              />
              {errors.tax_id && (
                <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Adresa *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ulica, PSČ Mesto"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="authorized_person" className="block text-sm font-medium text-gray-700 mb-2">
                Osoba oprávnená konať v mene firmy *
              </label>
              <input
                type="text"
                id="authorized_person"
                name="authorized_person"
                value={formData.authorized_person}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.authorized_person ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Meno a priezvisko"
              />
              {errors.authorized_person && (
                <p className="mt-1 text-sm text-red-600">{errors.authorized_person}</p>
              )}
            </div>

            {/* Kontaktné údaje */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Kontaktné údaje</h3>
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefón
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+421 123 456 789"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.contact_email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="firma@email.sk"
              />
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
              )}
            </div>


          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Ukladám...' : (isEditing ? 'Uložiť zmeny' : 'Pridať firmu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyModal;
