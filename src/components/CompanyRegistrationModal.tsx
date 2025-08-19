import React, { useState } from 'react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/apiService';

interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  ico: string;
  company_name: string;
  address: string;
  business_registry: string;
  vat_id: string;
  tax_id: string;
  authorized_person: string;
  contact_phone: string;
}

const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    ico: '',
    company_name: '',
    address: '',
    business_registry: '',
    vat_id: '',
    tax_id: '',
    authorized_person: '',
    contact_phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationData> = {};

    // Email validácia
    if (!formData.email) {
      newErrors.email = 'Email je povinný';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Neplatný formát emailu';
    }

    // Heslo validácia
    if (!formData.password) {
      newErrors.password = 'Heslo je povinné';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Heslo musí mať aspoň 6 znakov';
    }

    // Potvrdenie hesla
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potvrdenie hesla je povinné';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Heslá sa nezhodujú';
    }

    // Povinné polia
    if (!formData.name) newErrors.name = 'Názov firmy je povinný';
    if (!formData.ico) newErrors.ico = 'IČO je povinné';
    if (!formData.company_name) newErrors.company_name = 'Názov firmy je povinný';
    if (!formData.address) newErrors.address = 'Adresa je povinná';
    if (!formData.authorized_person) newErrors.authorized_person = 'Oprávnená osoba je povinná';
    if (!formData.contact_phone) newErrors.contact_phone = 'Kontaktný telefón je povinný';

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
      await apiService.registerCompany({
        email: formData.email,
        name: formData.name,
        role: 'user',
        status: 'inactive', // Firma bude neaktívna, admin ju aktivuje
        phone: formData.contact_phone,
        ico: formData.ico,
        company_name: formData.company_name,
        address: formData.address,
        business_registry: formData.business_registry,
        vat_id: formData.vat_id,
        tax_id: formData.tax_id,
        authorized_person: formData.authorized_person,
        contact_email: formData.email, // Používame rovnaký email ako registračný
        contact_phone: formData.contact_phone,
        password: formData.password
      });

      alert('Registrácia bola úspešná! Vaša firma čaká na schválenie administrátorom. Budete informovaní emailom.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Chyba pri registrácii:', error);
      alert('Chyba pri registrácii: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Vyčistiť chybu pri zmene hodnoty
    if (errors[name as keyof RegistrationData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Registrácia novej firmy</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Základné údaje */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Základné údaje firmy</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Názov firmy *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.company_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Názov firmy"
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IČO *
              </label>
              <input
                type="text"
                name="ico"
                value={formData.ico}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.ico ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="12345678"
              />
              {errors.ico && (
                <p className="text-red-500 text-sm mt-1">{errors.ico}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresa *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Hlavná 123, 811 01 Bratislava"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Obchodný register
              </label>
              <input
                type="text"
                name="business_registry"
                value={formData.business_registry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bratislava I, odd. Sro, vl. č. 12345/B"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DIČ
              </label>
              <input
                type="text"
                name="vat_id"
                value={formData.vat_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SK1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daňové ID
              </label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oprávnená osoba *
              </label>
              <input
                type="text"
                name="authorized_person"
                value={formData.authorized_person}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.authorized_person ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Meno a priezvisko"
              />
              {errors.authorized_person && (
                <p className="text-red-500 text-sm mt-1">{errors.authorized_person}</p>
              )}
            </div>

            {/* Kontaktné údaje */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontaktné údaje</h3>
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontaktný telefón *
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contact_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="+421 2 1234 5678"
              />
              {errors.contact_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
              )}
            </div>

            {/* Prihlasovacie údaje */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prihlasovacie údaje</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email pre prihlásenie *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="prihlasenie@firma.sk"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Názov používateľa *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Názov používateľa"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heslo *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimálne 6 znakov"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potvrďte heslo *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Zopakujte heslo"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Dôležité:</strong> Po registrácii bude vaša firma neaktívna a čakať na schválenie administrátorom. 
              Budete informovaní emailom o aktivácii vášho účtu.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Zrušiť
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrujem...' : 'Registrovať firmu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegistrationModal;
