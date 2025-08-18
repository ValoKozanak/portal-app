import React, { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOfficeIcon, EnvelopeIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import { Company, apiService } from '../services/apiService';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyId: number, companyData: Partial<Company>) => void;
  company: Company | null;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  company
}) => {
  const [formData, setFormData] = useState({
    ico: '',
    name: '',
    address: '',
    business_registry: '',
    vat_id: '',
    tax_id: '',
    authorized_person: '',
    contact_email: '',
    contact_phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or company changes
  useEffect(() => {
    if (isOpen && company) {
      setFormData({
        ico: company.ico,
        name: company.name,
        address: company.address,
        business_registry: company.business_registry || '',
        vat_id: company.vat_id || '',
        tax_id: company.tax_id || '',
        authorized_person: company.authorized_person,
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || ''
      });
      setErrors({});
    }
  }, [isOpen, company]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ico.trim()) {
      newErrors.ico = 'IČO je povinné';
    } else if (!/^\d{8}$/.test(formData.ico)) {
      newErrors.ico = 'IČO musí mať presne 8 číslic';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Názov firmy je povinný';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Adresa je povinná';
    }

    if (!formData.authorized_person.trim()) {
      newErrors.authorized_person = 'Osoba oprávnená konať je povinná';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Neplatný formát emailu';
    }

    if (formData.contact_phone && !/^\+?[\d\s\-()]+$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Neplatný formát telefónu';
    }

    if (formData.tax_id && !/^\d{10}$/.test(formData.tax_id)) {
      newErrors.tax_id = 'DIČ musí mať presne 10 číslic';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(company.id, formData);
      onClose();
    } catch (error) {
      console.error('Chyba pri uložení firmy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Upraviť firmu</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Základné informácie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IČO */}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.ico ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345678"
                maxLength={8}
              />
              {errors.ico && (
                <p className="mt-1 text-sm text-red-600">{errors.ico}</p>
              )}
            </div>

            {/* Názov firmy */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Názov firmy *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Názov firmy s.r.o."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Adresa */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Adresa *
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Hlavná 123, 81101 Bratislava"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Obchodný register a IČ DPH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="business_registry" className="block text-sm font-medium text-gray-700 mb-2">
                Číslo obchodného registra
              </label>
              <input
                type="text"
                id="business_registry"
                name="business_registry"
                value={formData.business_registry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="12345/A"
              />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="SK1234567890"
              />
            </div>
          </div>

          {/* DIČ */}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.tax_id ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="1234567890"
              maxLength={10}
            />
            {errors.tax_id && (
              <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>
            )}
          </div>

          {/* Osoba oprávnená konať */}
          <div>
            <label htmlFor="authorized_person" className="block text-sm font-medium text-gray-700 mb-2">
              Osoba oprávnená konať v mene firmy *
            </label>
            <div className="relative">
              <input
                type="text"
                id="authorized_person"
                name="authorized_person"
                value={formData.authorized_person}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.authorized_person ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ing. Ján Novák"
              />
              <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.authorized_person && (
              <p className="mt-1 text-sm text-red-600">{errors.authorized_person}</p>
            )}
          </div>

          {/* Kontaktné informácie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                Kontaktný email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.contact_email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="info@firma.sk"
                />
                <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
              )}
            </div>

            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-2">
                Kontaktný telefón
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.contact_phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+421 2 123 456 78"
                />
                <PhoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.contact_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>
              )}
            </div>
          </div>

          {/* Informácie o firme */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Informácie o firme</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">ID:</span> {company.id}</p>
              <p><span className="font-medium">Vlastník:</span> {company.owner_email}</p>
              <p><span className="font-medium">Vytvorená:</span> {new Date(company.created_at).toLocaleDateString('sk-SK')}</p>
              <p><span className="font-medium">Priradení účtovníci:</span> {company.assignedToAccountants.length}</p>
            </div>
          </div>

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
              {isSubmitting ? 'Ukladám...' : 'Uložiť zmeny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCompanyModal;
