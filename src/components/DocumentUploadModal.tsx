import React, { useState, useEffect } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { apiService, DocumentData } from '../services/apiService';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (document: DocumentData) => void;
  companyId: number;
  userEmail?: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  allowedTypes: string[];
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  companyId,
  userEmail = 'user@portal.sk'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ostatne');
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const response = await apiService.getDocumentCategories();
      setCategories(Object.entries(response).map(([id, category]: [string, any]) => ({
        id,
        name: category.name,
        description: category.description,
        allowedTypes: category.allowedTypes
      })));
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error);
      setError('Nepodarilo sa načítať kategórie dokumentov');
    }
  };

  const handleFileSelect = (file: File) => {
    setError('');
    
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (selectedCategoryData && !selectedCategoryData.allowedTypes.includes(file.type)) {
      setError(`Tento typ súboru nie je podporovaný pre kategóriu "${selectedCategoryData.name}"`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('Súbor je príliš veľký. Maximálna veľkosť je 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vyberte súbor na nahranie');
      return;
    }

    if (!selectedCategory) {
      setError('Vyberte kategóriu dokumentu');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('company_id', companyId.toString());
      formData.append('category', selectedCategory);
      formData.append('uploaded_by', userEmail);
      if (description) {
        formData.append('description', description);
      }

      const response = await apiService.uploadDocument(formData);
      onUpload(response.document);
      
      // Reset form
      setSelectedFile(null);
      setSelectedCategory('ostatne');
      setDescription('');
      onClose();
    } catch (error: any) {
      console.error('Chyba pri nahrávaní dokumentu:', error);
      setError(error.message || 'Chyba pri nahrávaní dokumentu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setError('');
    
    // Ak je vybraný súbor, skontrolujeme kompatibilitu
    if (selectedFile) {
      const categoryData = categories.find(cat => cat.id === categoryId);
      if (categoryData && !categoryData.allowedTypes.includes(selectedFile.type)) {
        setError(`Tento typ súboru nie je podporovaný pre kategóriu "${categoryData.name}"`);
        setSelectedFile(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
            Nahrať dokument
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Kategória */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategória dokumentu *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} - {category.description}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <p className="text-sm text-gray-500 mt-1">
                Podporované formáty: {categories.find(cat => cat.id === selectedCategory)?.allowedTypes.join(', ')}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dokument *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <DocumentArrowUpIcon className="h-12 w-12 text-green-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Zmeniť súbor
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Presuňte súbor sem alebo kliknite na výber
                  </p>
                  <input
                    type="file"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                    accept={categories.find(cat => cat.id === selectedCategory)?.allowedTypes.join(',')}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-700"
                  >
                    Vybrať súbor
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popis (voliteľné)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Krátky popis dokumentu..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Informácie o nahrávaní</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Dokument sa nahraje do organizovaného folderu</li>
              <li>• Maximálna veľkosť súboru: 10MB</li>
              <li>• Admin dostane notifikáciu o novom dokumente</li>
              <li>• Dokument bude dostupný pre priradeného účtovníka</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Zrušiť
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Nahrávam...
              </>
            ) : (
              <>
                <DocumentArrowUpIcon className="h-4 w-4" />
                Nahrať dokument
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
