import React, { useState } from 'react';
import { 
  DocumentArrowUpIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import FileUploadModal from './FileUploadModal';
import FilePreviewModal from './FilePreviewModal';
import { FileData } from '../services/apiService';

interface FileManagerProps {
  files: FileData[];
  onFileUpload?: (file: FileData) => void;
  onFileDelete: (fileId: number) => void;
  onFileDownload?: (file: FileData) => void;
  onFilePreview?: (file: FileData) => void;
  companyId: number;
  loading?: boolean;
  userRole?: 'admin' | 'accountant' | 'company';
  onEmptyTrash?: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({
  files,
  onFileUpload,
  onFileDelete,
  onFileDownload,
  onFilePreview,
  companyId,
  loading = false,
  userRole = 'company',
  onEmptyTrash
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const categories = [
    { id: 'all', name: 'Všetky súbory' },
    { id: 'documents', name: 'Dokumenty' },
    { id: 'invoices', name: 'Faktúry' },
    { id: 'contracts', name: 'Zmluvy' },
    { id: 'reports', name: 'Správy' },
    { id: 'images', name: 'Obrázky' },
    { id: 'archives', name: 'Archívy' },
    { id: 'other', name: 'Ostatné' }
  ];



  const filteredFiles = files.filter(file => {
    // Kontrola, či file a file.original_name existujú
    if (!file || !file.original_name) {
      return false;
    }
    
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (file.category || 'other') === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType: string, category: string) => {
    if (category === 'images') return PhotoIcon;
    if (category === 'archives') return ArchiveBoxIcon;
    if (category === 'documents') return DocumentTextIcon;
    return DocumentIcon;
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funkcia na preklad kategórií z anglického kódu na slovenský názov
  const getCategoryName = (categoryCode: string) => {
    const categoryMap: Record<string, string> = {
      'documents': 'Dokumenty',
      'invoices': 'Faktúry',
      'contracts': 'Zmluvy',
      'reports': 'Správy',
      'images': 'Obrázky',
      'archives': 'Archívy',
      'other': 'Ostatné'
    };
    return categoryMap[categoryCode] || categoryCode;
  };

  const handleFileUpload = (file: FileData) => {
    if (onFileUpload) {
      onFileUpload(file);
    }
    setShowUploadModal(false);
  };

  const handleFilePreview = (file: FileData) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const handleFileDownload = async (file: FileData) => {
    setDownloadingFiles(prev => new Set(prev).add(file.id.toString()));

    try {
      if (onFileDownload) {
        onFileDownload(file);
      }
    } catch (error) {
      console.error('Chyba pri sťahovaní súboru:', error);
      alert('Nepodarilo sa stiahnuť súbor');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id.toString());
        return newSet;
      });
    }
  };

  const handleFileDelete = async (file: FileData) => {
    const fileName = file.original_name || 'Neznámy súbor';
    if (!window.confirm(`Naozaj chcete vymazať súbor "${fileName}"?`)) {
      return;
    }

    setDeletingFiles(prev => new Set(prev).add(file.id.toString()));

    try {
      onFileDelete(file.id);
    } catch (error) {
      console.error('Chyba pri mazaní súboru:', error);
      alert('Nepodarilo sa vymazať súbor');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id.toString());
        return newSet;
      });
    }
  };

  const totalSize = files.reduce((sum, file) => sum + (file.file_size || 0), 0);
  const filesByCategory = categories.reduce((acc, cat) => {
    if (cat.id === 'all') {
      acc[cat.id] = files.length;
    } else {
      acc[cat.id] = files.filter(f => f && (f.category || 'other') === cat.id).length;
    }
    return acc;
  }, {} as Record<string, number>);

  // Debug informácie (dočasné)
  console.log('Files:', files.length);
  console.log('Filtered files:', filteredFiles.length);
  console.log('Selected category:', selectedCategory);
  console.log('Files by category:', filesByCategory);
  if (files.length > 0) {
    console.log('Files with categories:', files.map(f => ({ name: f.original_name, category: f.category })));
  }



  console.log('FileManager rendering with files:', files.length);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Správa súborov</h2>
          <p className="text-sm text-gray-500">
            {files.length} súborov • {formatFileSize(totalSize)} celkovo
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {userRole === 'admin' && onEmptyTrash && (
            <button
              onClick={() => {
                if (window.confirm('Naozaj chcete vyprázdniť kôš? Táto akcia je nevratná.')) {
                  onEmptyTrash();
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Vyprázdniť kôš
            </button>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Nahrať súbory
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Hľadať súbory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({filesByCategory[cat.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* View mode */}
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Files */}
      {(() => {
        console.log('Rendering files section, filteredFiles.length:', filteredFiles.length);
        return filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne súbory</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Nenašli sa žiadne súbory s vybranými filtrami.'
                : 'Zatiaľ neboli nahrané žiadne súbory.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Nahrať prvý súbor
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.file_type || 'unknown', file.category || 'other');
              const isDownloading = downloadingFiles.has(file.id.toString());
              const isDeleting = deletingFiles.has(file.id.toString());
              
              return (
                <div
                  key={file.id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${
                    viewMode === 'list' ? 'p-4' : 'p-6'
                  }`}
                >
                  <div className={viewMode === 'list' ? 'flex items-center space-x-4' : 'text-center'}>
                    <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}`}>
                      <Icon className={`${viewMode === 'list' ? 'h-8 w-8' : 'h-12 w-12'} text-primary-600`} />
                    </div>
                    
                    <div className={`flex-1 min-w-0 ${viewMode === 'list' ? '' : 'mb-4'}`}>
                      <h3 className={`font-medium text-gray-900 truncate ${viewMode === 'list' ? 'text-sm' : 'text-lg'}`}>
                        {file.original_name || 'Neznámy súbor'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.file_size || 0)} • {formatDate(file.created_at || new Date().toISOString())}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {getCategoryName(file.category || 'other')}
                      </p>
                    </div>

                    <div className={`flex space-x-2 ${viewMode === 'list' ? 'flex-shrink-0' : 'justify-center'}`}>
                      <button
                        onClick={() => handleFilePreview(file)}
                        className="text-primary-600 hover:text-primary-700"
                        title="Náhľad"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleFileDownload(file)}
                        disabled={isDownloading}
                        className={`text-blue-600 hover:text-blue-700 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isDownloading ? 'Sťahujem...' : 'Stiahnuť'}
                      >
                        <CloudArrowDownIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file)}
                        disabled={isDeleting}
                        className={`text-red-600 hover:text-red-700 ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isDeleting ? 'Mažem...' : 'Vymazať'}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Upload Modal */}
       {showUploadModal && (
         <FileUploadModal
           isOpen={showUploadModal}
           onClose={() => setShowUploadModal(false)}
           companyId={companyId}
           onFileUpload={handleFileUpload}
           userRole={userRole}
         />
       )}

       {/* Preview Modal */}
       <FilePreviewModal
         isOpen={showPreviewModal}
         onClose={() => {
           setShowPreviewModal(false);
           setPreviewFile(null);
         }}
         file={previewFile}
       />
     </div>
   );
 };

export default FileManager;
