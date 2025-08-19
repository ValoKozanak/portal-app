import React, { useState } from 'react';
import { XMarkIcon, CloudArrowDownIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { DocumentData } from '../services/apiService';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData;
  onDownload: (document: DocumentData) => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      await onDownload(document);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    const previewUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/documents/preview/${document.id}`;
    window.open(previewUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      'faktury': 'Faktúry',
      'zmluvy': 'Zmluvy',
      'vykazy': 'Výkazy',
      'dokumenty': 'Dokumenty',
      'archiv': 'Archív'
    };
    return categoryNames[category] || category;
  };

  const canPreview = document.file_type.startsWith('image/') || 
                    document.file_type === 'application/pdf' ||
                    document.file_type === 'text/';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {document.original_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {getCategoryName(document.category)} • {formatFileSize(document.file_size)} • {formatDate(document.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-gray-700 disabled:opacity-50"
              title="Stiahnuť"
            >
              <CloudArrowDownIcon className="h-5 w-5" />
            </button>
            {canPreview && (
              <button
                onClick={handleOpenInNewTab}
                className="p-2 text-gray-600 hover:text-gray-700"
                title="Otvoriť v novom okne"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Zavrieť"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {canPreview ? (
            <div className="p-6">
              {document.file_type.startsWith('image/') ? (
                <div className="flex justify-center">
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/documents/preview/${document.id}`}
                    alt={document.original_name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const errorDiv = target.parentElement?.querySelector('.preview-error');
                      if (errorDiv) {
                        errorDiv.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="preview-error hidden text-center py-12">
                    <p className="text-gray-500">Nepodarilo sa načítať náhľad obrázka</p>
                    <button
                      onClick={handleDownload}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Stiahnuť súbor
                    </button>
                  </div>
                </div>
              ) : document.file_type === 'application/pdf' ? (
                <div className="flex justify-center">
                  <iframe
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/documents/preview/${document.id}`}
                    className="w-full h-[60vh] border rounded-lg"
                    title={document.original_name}
                  />
                </div>
              ) : document.file_type === 'text/' ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {/* Tu by sa načítal textový obsah */}
                    Náhľad textového súboru
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Náhľad nie je dostupný
                </h3>
                <p className="text-gray-500 mb-4">
                  Tento typ súboru ({document.file_type}) nepodporuje náhľad. Môžete si ho stiahnuť alebo otvoriť v príslušnej aplikácii.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <CloudArrowDownIcon className="h-4 w-4" />
                    Stiahnuť súbor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer s informáciami */}
        <div className="border-t bg-gray-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Kategória:</span>
              <span className="ml-2 text-gray-600">{getCategoryName(document.category)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Veľkosť:</span>
              <span className="ml-2 text-gray-600">{formatFileSize(document.file_size)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Typ:</span>
              <span className="ml-2 text-gray-600">{document.file_type}</span>
            </div>
            {document.description && (
              <div className="md:col-span-3">
                <span className="font-medium text-gray-700">Popis:</span>
                <span className="ml-2 text-gray-600">{document.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;

