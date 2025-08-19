import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { FileData } from '../services/apiService';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileData | null;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && file) {
      loadPreview();
    }
  }, [isOpen, file]);

  const loadPreview = async () => {
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      // Použijeme API service pre náhľad
      const response = await fetch(`http://localhost:5000/api/files/preview/${file.id}`);
      if (!response.ok) {
        throw new Error('Nepodarilo sa načítať náhľad');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      setError('Nepodarilo sa načítať náhľad súboru');
      console.error('Chyba pri načítaní náhľadu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInNewTab = async () => {
    if (!file) return;

    try {
      window.open(`http://localhost:5000/api/files/preview/${file.id}`, '_blank');
    } catch (err) {
      console.error('Chyba pri otváraní súboru:', err);
      alert('Nepodarilo sa otvoriť súbor');
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      const response = await fetch(`http://localhost:5000/api/files/download/${file.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Chyba pri sťahovaní súboru:', err);
      alert('Nepodarilo sa stiahnuť súbor');
    }
  };

  const isImage = file?.file_type.includes('image');
  const isPdf = file?.file_type.includes('pdf');
  const isText = file?.file_type.includes('text') || file?.file_type.includes('document');

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900">{file.original_name}</h2>
            <span className="text-sm text-gray-500">
              {file.file_size > 1024 * 1024 
                ? `${(file.file_size / (1024 * 1024)).toFixed(1)} MB`
                : `${(file.file_size / 1024).toFixed(1)} KB`
              }
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenInNewTab}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Otvoriť v novom okne"
            >
              Otvoriť
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              title="Stiahnuť súbor"
            >
              Stiahnuť
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Načítavam náhľad...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-gray-600">{error}</p>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Otvoriť v novom okne
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Stiahnuť súbor
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {isImage && (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={previewUrl}
                    alt={file.original_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              {isPdf && (
                <div className="h-full">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={file.original_name}
                  />
                </div>
              )}
              {isText && (
                <div className="h-full p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50 p-4 rounded border h-full overflow-auto">
                    {/* Pre textové súbory by sme tu zobrazili obsah */}
                    Simulovaný textový súbor: {file.original_name}
                    
                    Tento súbor bol vytvorený v simulovanom prostredí.
                    Dátum vytvorenia: {new Date(file.created_at).toLocaleDateString('sk-SK')}
                    Veľkosť: {file.file_size} bajtov
                    Kategória: {file.file_type}
                    
                    Obsah súboru:
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
                    nisi ut aliquip ex ea commodo consequat.
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;

