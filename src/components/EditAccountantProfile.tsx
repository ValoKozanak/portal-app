import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, KeyIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { User, apiService } from '../services/apiService';

interface EditAccountantProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, userData: Partial<User>) => void;
  user: User | null;
}

const EditAccountantProfile: React.FC<EditAccountantProfileProps> = ({
  isOpen,
  onClose,
  onSave,
  user
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      });
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordChange(false);
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Meno je povinnA?';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email je povinnA?';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'NeplatnA? formA?t emailu';
    }

    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'NeplatnA? formA?t telefAlnu';
    }

    // ValidA?cia hesla ak sa menA?
    if (showPasswordChange) {
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'NovA? heslo je povinnA?';
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = 'Heslo musA? maLA aspoL? 6 znakov';
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'HeslA? sa nezhodujAs';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // AktualizA?cia Asdajov pouLlA?vate?la
      await onSave(user.id, formData);
      
      // Zmena hesla ak je poLladovanA?
      if (showPasswordChange && passwordData.newPassword) {
        await apiService.changeUserPassword(user.id, passwordData.newPassword);
      }
      
      onClose();
    } catch (error) {
      console.error('Chyba pri uloLlenA? profilu:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">UpraviLA profil As?TtovnA?ka</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Meno */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Meno a priezvisko *
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Zadajte meno a priezvisko"
              />
              <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="uctovnik@email.sk"
              />
              <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* TelefAln */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              TelefAln
            </label>
            <div className="relative">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+421 901 234 567"
              />
              <PhoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Zmena hesla */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Zmena hesla</h3>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showPasswordChange ? 'SkryLA' : 'ZmeniLA heslo'}
              </button>
            </div>
            
            {showPasswordChange && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    NovA? heslo *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.newPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="MinimA?lne 6 znakov"
                    />
                    <KeyIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Potvr?Zte novA? heslo *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Zopakujte novA? heslo"
                    />
                    <KeyIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* InformA?cie o As?TtovnA?kovi */}
          <div className="bg-gray-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">InformA?cie o As?TtovnA?kovi</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">ID:</span> {user.id}</p>
              <p><span className="font-medium">Rola:</span> As?TtovnA?k (ModerA?tor)</p>
              <p><span className="font-medium">Status:</span> {user.status}</p>
            </div>
          </div>

          {/* Tla?TidlA? */}
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
              {isSubmitting ? 'UkladA?m...' : 'UloLliLA zmeny'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountantProfile;

