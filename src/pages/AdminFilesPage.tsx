import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  FolderIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import FileUploadModal from '../components/FileUploadModal';
import FilePreviewModal from '../components/FilePreviewModal';
import { apiService, FileData } from '../services/apiService';

interface AdminFilesPageProps {
  onBack: () => void;
}

const AdminFilesPage: React.FC<AdminFilesPageProps> = ({ onBack }) => {
  const [allFiles, setAllFiles] = useState<FileData[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Načítanie všetkých súborov
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoadingFiles(true);
        const files = await apiService.getAllFiles();
        setAllFiles(files);
      } catch (error) {
        console.error('Chyba pri načítaní súborov:', error);
      } finally {
        setLoadingFiles(false);
      }
    };

    loadFiles();
  }, []);

  // Filtrovanie súborov
  const filteredFiles = allFiles.filter(file => {
    const matchesSearch = 
      file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Vymazanie súboru
  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento súbor?')) {
      try {
        await apiService.deleteFile(fileId);
        setAllFiles(prev => prev.filter(file => file.id !== fileId));
      } catch (error) {
        console.error('Chyba pri mazaní súboru:', error);
        alert('Chyba pri mazaní súboru');
      }
    }
  };

  // Sťahovanie súboru
  const handleDownloadFile = async (file: FileData) => {
    try {
      const blob = await apiService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Chyba pri sťahovaní súboru:', error);
      alert('Chyba pri sťahovaní súboru');
    }
  };

  // Náhľad súboru
  const handleFilePreview = (file: FileData) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  // Pridanie nového súboru
  const handleFileUpload = (fileData: FileData) => {
    setAllFiles(prev => [fileData, ...prev]);
  };

  // Formátovanie veľkosti súboru
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formátovanie dátumu
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Štatistiky
  const stats = {
    total: allFiles.length,
    documents: allFiles.filter(f => f.category === 'documents').length,
    invoices: allFiles.filter(f => f.category === 'invoices').length,
    contracts: allFiles.filter(f => f.category === 'contracts').length,
    other: allFiles.filter(f => !['documents', 'invoices', 'contracts'].includes(f.category)).length,
  };

  // Získanie unikátnych kategórií
  const categories = ['all', ...Array.from(new Set(allFiles.map(f => f.category)))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Späť do Dashboardu
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-yellow-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Správa súborov</h1>
              </div>
            </div>
            <button
              onClick={() => setShowFileUploadModal(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nahrať súbor
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Štatistiky */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Celkovo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Dokumenty</p>
                <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Faktúry</p>
                <p className="text-2xl font-bold text-gray-900">{stats.invoices}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Zmluvy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.contracts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-gray-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ostatné</p>
                <p className="text-2xl font-bold text-gray-900">{stats.other}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Zoznam súborov</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Celkovo {filteredFiles.length} súborov z {allFiles.length}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Všetky kategórie' : category}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Vyhľadať súbor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {loadingFiles ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam súbory...</p>
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">{file.original_name}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <FolderIcon className="h-4 w-4 mr-2" />
                            <span className="capitalize">{file.category}</span>
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            <span>{file.uploaded_by}</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>{formatDate(file.created_at)}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.file_size)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFilePreview(file)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Náhľad
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Stiahnuť
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Vymazať
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {searchTerm || categoryFilter !== 'all' ? 'Žiadne súbory nenájdené' : 'Žiadne súbory'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || categoryFilter !== 'all'
                    ? 'Skúste zmeniť vyhľadávací výraz alebo filter.'
                    : 'Zatiaľ neboli nahrané žiadne súbory.'
                  }
                </p>
                {!searchTerm && categoryFilter === 'all' && (
                  <button
                    onClick={() => setShowFileUploadModal(true)}
                    className="mt-4 bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 flex items-center mx-auto"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Nahrať prvý súbor
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onFileUpload={handleFileUpload}
        companyId={0} // Pre admin upload
      />

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

export default AdminFilesPage;
