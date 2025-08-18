import React from 'react';
import { XMarkIcon, ClockIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CmsHistoryItem } from '../services/cmsService';

interface CmsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CmsHistoryItem[];
  onRestore: (id: number) => void;
  section: string;
  field: string;
}

const CmsHistoryModal: React.FC<CmsHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRestore,
  section,
  field
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">História zmien</h2>
            <p className="text-sm text-gray-600 mt-1">
              {section} → {field}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh]">
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadna história</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Pre toto pole ešte neboli vykonané žiadne zmeny.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Verzia {item.version}
                          </span>
                          {index === 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Aktuálna
                            </span>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {item.value}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>{item.created_by}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>{new Date(item.created_at).toLocaleString('sk-SK')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {index > 0 && (
                        <button
                          onClick={() => onRestore(item.id)}
                          className="ml-4 flex items-center text-sm text-blue-600 hover:text-blue-700"
                          title="Obnoviť túto verziu"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Obnoviť
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Zavrieť
          </button>
        </div>
      </div>
    </div>
  );
};

export default CmsHistoryModal;
