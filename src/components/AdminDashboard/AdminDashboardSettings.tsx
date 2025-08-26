import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

const AdminDashboardSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Nastavenia</h2>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Systémové nastavenia</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Všeobecné nastavenia</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Automatické zálohovanie</p>
                    <p className="text-sm text-gray-500">Zálohovanie dát každý deň o 2:00</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Zapnuté
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email notifikácie</p>
                    <p className="text-sm text-gray-500">Posielanie emailových upozornení</p>
                  </div>
                  <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                    Vypnuté
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dvojfaktorová autentifikácia</p>
                    <p className="text-sm text-gray-500">Vyžadovať 2FA pre všetkých používateľov</p>
                  </div>
                  <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                    Vypnuté
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Bezpečnosť</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Minimálna dĺžka hesla</p>
                    <p className="text-sm text-gray-500">Aktuálne: 8 znakov</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Zmeniť
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Session timeout</p>
                    <p className="text-sm text-gray-500">Aktuálne: 30 minút</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Zmeniť
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Údržba</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vyčistiť cache</p>
                    <p className="text-sm text-gray-500">Vymazať všetky dočasné súbory</p>
                  </div>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
                    Vyčistiť
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Export dát</p>
                    <p className="text-sm text-gray-500">Stiahnuť zálohu všetkých dát</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    Exportovať
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSettings;
















