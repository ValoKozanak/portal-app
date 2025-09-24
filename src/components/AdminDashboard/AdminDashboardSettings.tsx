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
            <h3 className="text-lg font-medium text-gray-900">SystA?movA? nastavenia</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">VL?eobecnA? nastavenia</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">AutomatickA? zA?lohovanie</p>
                    <p className="text-sm text-gray-500">ZA?lohovanie dA?t kaLldA? deL? o 2:00</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    ZapnutA?
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email notifikA?cie</p>
                    <p className="text-sm text-gray-500">Posielanie emailovA?ch upozornenA?</p>
                  </div>
                  <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                    VypnutA?
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">DvojfaktorovA? autentifikA?cia</p>
                    <p className="text-sm text-gray-500">VyLladovaLA 2FA pre vL?etkA?ch pouLlA?vate?lov</p>
                  </div>
                  <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400">
                    VypnutA?
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Bezpe?TnosLA</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">MinimA?lna d?sLlka hesla</p>
                    <p className="text-sm text-gray-500">AktuA?lne: 8 znakov</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    ZmeniLA
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Session timeout</p>
                    <p className="text-sm text-gray-500">AktuA?lne: 30 minAst</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    ZmeniLA
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">AsdrLlba</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Vy?TistiLA cache</p>
                    <p className="text-sm text-gray-500">VymazaLA vL?etky do?TasnA? sAsbory</p>
                  </div>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
                    Vy?TistiLA
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Export dA?t</p>
                    <p className="text-sm text-gray-500">StiahnuLA zA?lohu vL?etkA?ch dA?t</p>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    ExportovaLA
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

















