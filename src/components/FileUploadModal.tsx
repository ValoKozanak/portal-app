import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon,
  DocumentIcon,
  FolderIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { FileData } from '../services/apiService';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: number;
  companies?: Array<{ id: number; name: string }>;
  onFileUpload: (file: FileData) => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  companyId,
  companies = [],
  onFileUpload 
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('documents');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(companyId || 0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const categories = [
    { id: 'documents', name: 'Dokumenty', icon: DocumentTextIcon },
    { id: 'invoices', name: 'Faktúry', icon: DocumentIcon },
    { id: 'contracts', name: 'Zmluvy', icon: DocumentTextIcon },
    { id: 'reports', name: 'Správy', icon: DocumentTextIcon },
    { id: 'images', name: 'Obrázky', icon: PhotoIcon },
    { id: 'archives', name: 'Archívy', icon: ArchiveBoxIcon },
    { id: 'other', name: 'Ostatné', icon: DocumentIcon }
  ];

  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed'
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Validácia súborov
      const validFiles = filesArray.filter(file => {
        // Kontrola veľkosti (10MB = 10 * 1024 * 1024 bytes)
        if (file.size > 10 * 1024 * 1024) {
          setUploadErrors(prev => ({
            ...prev,
            [file.name]: 'Súbor je príliš veľký (max. 10MB)'
          }));
          return false;
        }

        // Kontrola typu
        if (!allowedFileTypes.includes(file.type)) {
          setUploadErrors(prev => ({
            ...prev,
            [file.name]: 'Nepodporovaný typ súboru'
          }));
          return false;
        }

        return true;
      });

      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const file = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[file.name];
      return newErrors;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.name];
      return newProgress;
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return PhotoIcon;
    if (fileType.includes('pdf')) return DocumentTextIcon;
    if (fileType.includes('zip') || fileType.includes('rar')) return ArchiveBoxIcon;
    return DocumentIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Vyberte aspoň jeden súbor na nahranie');
      return;
    }

    if (!selectedCompanyId) {
      alert('Vyberte firmu, pre ktorú nahrávate súbory');
      return;
    }

    setIsUploading(true);
    setUploadErrors({});

    try {
      for (const file of selectedFiles) {
        const metadata = {
          uploadedBy: 'user@portal.sk', // V reálnej aplikácii by to bolo z autentifikácie
          description: description || undefined,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined
        };

        // Progress tracking pre každý súbor
        const onProgress = (progress: UploadProgress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        };

        try {
          // Skutočné nahrávanie súboru cez API
          const fileData = await apiService.uploadFile(file, selectedCompanyId, 'user@portal.sk', category);
          
          // Voláme onFileUpload s kompletným objektom súboru
          onFileUpload(fileData);
        } catch (error) {
          setUploadErrors(prev => ({
            ...prev,
            [file.name]: error instanceof Error ? error.message : 'Neznáma chyba'
          }));
        }
      }
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      setDescription('');
      setTags('');
      setUploadProgress({});
      // Modal sa zatvorí až po úspešnom nahratí všetkých súborov
      // onClose() sa volá v handleFileUpload v FileManager
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Nahrať súbory
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Výber firmy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma *
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Vyberte firmu</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kategória */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategória súborov
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Kliknite pre výber súborov
                </span>
                <span className="text-gray-500"> alebo ich sem presuňte</span>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC, XLS, obrázky, archívy (max. 10MB na súbor)
            </p>
          </div>

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Vybrané súbory ({selectedFiles.length})
              </h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => {
                  const Icon = getFileIcon(file.type);
                  const progress = uploadProgress[file.name];
                  const error = uploadErrors[file.name];
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          {error && (
                            <p className="text-xs text-red-600">{error}</p>
                          )}
                          {progress && (
                            <div className="mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {progress.percentage}% ({formatFileSize(progress.loaded)} / {formatFileSize(progress.total)})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popis (voliteľné)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Krátky popis súborov..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagy (voliteľné)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="dôležité, urgent, 2024 (oddelené čiarkami)"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Zrušiť
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading || !selectedCompanyId}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Nahrávam...' : `Nahrať ${selectedFiles.length} súborov`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
