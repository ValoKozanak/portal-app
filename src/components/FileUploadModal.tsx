import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  TrashIcon
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
  userRole?: 'admin' | 'accountant' | 'company';
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  companyId,
  companies = [],
  onFileUpload,
  userRole = 'company'
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(companyId || 0);

  // Pre firmy automaticky nastavA?me ich vlastnAs firmu
  useEffect(() => {
    if (userRole === 'company' && companyId) {
      setSelectedCompanyId(companyId);
    }
  }, [userRole, companyId]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const categories = [
    { id: 'documents', name: 'Dokumenty', icon: DocumentTextIcon },
    { id: 'invoices', name: 'FaktAsry', icon: DocumentIcon },
    { id: 'contracts', name: 'Zmluvy', icon: DocumentTextIcon },
    { id: 'reports', name: 'SprA?vy', icon: DocumentTextIcon },
    { id: 'images', name: 'ObrA?zky', icon: PhotoIcon },
    { id: 'archives', name: 'ArchA?vy', icon: ArchiveBoxIcon },
    { id: 'other', name: 'OstatnA?', icon: DocumentIcon }
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
      
      // ValidA?cia sAsborov
      const validFiles = filesArray.filter(file => {
        // Kontrola ve?lkosti (10MB = 10 * 1024 * 1024 bytes)
        if (file.size > 10 * 1024 * 1024) {
          setUploadErrors(prev => ({
            ...prev,
            [file.name]: 'SAsbor je prA?liL? ve?lkA? (max. 10MB)'
          }));
          return false;
        }

        // Kontrola typu
        if (!allowedFileTypes.includes(file.type)) {
          setUploadErrors(prev => ({
            ...prev,
            [file.name]: 'NepodporovanA? typ sAsboru'
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
      alert('Vyberte aspoL? jeden sAsbor na nahranie');
      return;
    }

    if (!selectedCompanyId) {
      alert('Vyberte firmu, pre ktorAs nahrA?vate sAsbory');
      return;
    }

    if (!category) {
      alert('Vyberte typ sAsboru');
      return;
    }

    setIsUploading(true);
    setUploadErrors({});

    try {
      for (const file of selectedFiles) {
        // Progress tracking pre kaLldA? sAsbor
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { loaded: 0, total: file.size, percentage: 0 }
        }));

        try {
          // Skuto?TnA? nahrA?vanie sAsboru cez API
          const fileData = await apiService.uploadFile(file, selectedCompanyId, 'user@portal.sk', category);
          
          // VolA?me onFileUpload s kompletnA?m objektom sAsboru
          onFileUpload(fileData);
        } catch (error) {
          setUploadErrors(prev => ({
            ...prev,
            [file.name]: error instanceof Error ? error.message : 'NeznA?ma chyba'
          }));
        }
      }
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      setDescription('');
      setTags('');
      setUploadProgress({});
      // Modal sa zatvorA? aLl po AsspeL?nom nahratA? vL?etkA?ch sAsborov
      // onClose() sa volA? v handleFileUpload v FileManager
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            NahraLA sAsbory
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* VA?ber firmy - skrytA? pre firmy */}
          {userRole !== 'company' && (
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
          )}
          
          {/* Pre firmy zobrazA?me informA?ciu o ich firme */}
          {userRole === 'company' && companyId && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>SAsbory sa nahrA?vajAs pre vaL?u firmu</strong>
              </p>
            </div>
          )}

          {/* KategAlria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ sAsboru *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Vyberte typ sAsboru</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Kliknite pre vA?ber sAsborov
                </span>
                <span className="text-gray-500"> alebo ich sem presuL?te</span>
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
              PDF, DOC, XLS, obrA?zky, archA?vy (max. 10MB na sAsbor)
            </p>
          </div>

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                VybranA? sAsbory ({selectedFiles.length})
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
              Popis (volite?lnA?)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="KrA?tky popis sAsborov..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagy (volite?lnA?)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="dA?leLlitA?, urgent, 2024 (oddelenA? ?Tiarkami)"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              ZruL?iLA
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading || !selectedCompanyId}
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'NahrA?vam...' : `NahraLA ${selectedFiles.length} sAsborov`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;

