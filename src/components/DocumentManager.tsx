import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowUpIcon,
  DocumentIcon,
  FolderIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CloudArrowDownIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import { DocumentData } from '../services/apiService';

interface DocumentManagerProps {
  documents: DocumentData[];
  onDocumentUpload: (document: DocumentData) => void;
  onDocumentDelete: (documentId: number) => void;
  onDocumentDownload: (document: DocumentData) => void;
  companyId: number;
  userEmail?: string;
  userRole?: 'admin' | 'accountant' | 'company';
  assignedAccountants?: string[];
  readOnly?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onDocumentUpload,
  onDocumentDelete,
  onDocumentDownload,
  companyId,
  userEmail = 'user@portal.sk',
  userRole = 'company',
  assignedAccountants = [],
  readOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloadingDocuments, setDownloadingDocuments] = useState<Set<string>>(new Set());
  const [deletingDocuments, setDeletingDocuments] = useState<Set<string>>(new Set());
  const [previewDocument, setPreviewDocument] = useState<DocumentData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Kontrola oprávnení pre nahrávanie a mazanie dokumentov
  const canManageDocuments = userRole === 'admin' || 
    (userRole === 'accountant' && assignedAccountants.includes(userEmail));

  const categories = [
    { id: 'all', name: 'Všetky dokumenty', icon: FolderOpenIcon },
    { id: 'vykazy', name: 'Výkazy', icon: DocumentTextIcon },
    { id: 'zmluvy', name: 'Zmluvy', icon: DocumentIcon },
    { id: 'ostatne', name: 'Ostatné', icon: DocumentIcon }
  ];

  const filteredDocuments = documents.filter(document => {
    if (!document || !document.original_name) {
      return false;
    }
    
    const matchesSearch = document.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (document.description && document.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || document.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getDocumentIcon = (category: string) => {
    switch (category) {
      case 'vykazy':
        return DocumentTextIcon;
      case 'zmluvy':
        return DocumentIcon;
      case 'ostatne':
        return DocumentIcon;
      default:
        return DocumentIcon;
    }
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

  const handleDocumentUpload = (document: DocumentData) => {
    onDocumentUpload(document);
    setShowUploadModal(false);
  };

  const handleDocumentPreview = (document: DocumentData) => {
    setPreviewDocument(document);
    setShowPreviewModal(true);
  };

  const handleDocumentDownload = async (document: DocumentData) => {
    setDownloadingDocuments(prev => new Set(prev).add(document.id.toString()));
    try {
      await onDocumentDownload(document);
    } finally {
      setDownloadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id.toString());
        return newSet;
      });
    }
  };

  const handleDocumentDelete = async (documentId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      setDeletingDocuments(prev => new Set(prev).add(documentId.toString()));
      try {
        await onDocumentDelete(documentId);
      } finally {
        setDeletingDocuments(prev => {
          const newSet = new Set(prev);
          newSet.delete(documentId.toString());
          return newSet;
        });
      }
    }
  };

  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {};
    categories.forEach(cat => {
      if (cat.id !== 'all') {
        stats[cat.id] = documents.filter(doc => doc.category === cat.id).length;
      }
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpenIcon className="h-6 w-6 text-blue-600" />
            Dokumenty
          </h2>
          <p className="text-gray-600 mt-1">
            {canManageDocuments ? 'Organizované dokumenty vo folderoch' : 'Zobrazenie dokumentov (len na čítanie)'}
          </p>
        </div>
        
        {canManageDocuments && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
            Nahrať dokument
          </button>
        )}
      </div>

      {/* Kategórie a štatistiky */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const count = category.id === 'all' ? documents.length : categoryStats[category.id] || 0;
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Icon className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm font-medium">{category.name}</div>
              <div className="text-xs text-gray-500">{count} dokumentov</div>
            </button>
          );
        })}
      </div>

      {/* Filtre a vyhľadávanie */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Vyhľadať dokumenty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dokumenty */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Žiadne dokumenty</h3>
          <p className="text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Nenašli sa žiadne dokumenty s vybranými filtrami.'
              : 'Zatiaľ neboli nahrané žiadne dokumenty.'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredDocuments.map((document) => {
            const Icon = getDocumentIcon(document.category);
            const isDownloading = downloadingDocuments.has(document.id.toString());
            const isDeleting = deletingDocuments.has(document.id.toString());
            
            return (
              <div
                key={document.id}
                className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex items-center gap-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-6 w-6 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {categories.find(cat => cat.id === document.category)?.name || document.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDocumentPreview(document)}
                          className="text-gray-600 hover:text-gray-700 p-1"
                          title="Náhľad"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDocumentDownload(document)}
                          disabled={isDownloading}
                          className="text-gray-600 hover:text-gray-700 p-1 disabled:opacity-50"
                          title="Stiahnuť"
                        >
                          <CloudArrowDownIcon className="h-4 w-4" />
                        </button>
                        {canManageDocuments && (
                          <button
                            onClick={() => handleDocumentDelete(document.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                            title="Vymazať"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-2 truncate" title={document.original_name}>
                      {document.original_name}
                    </h3>
                    
                    {document.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {document.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>{formatDate(document.created_at)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Icon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate" title={document.original_name}>
                        {document.original_name}
                      </h3>
                      {document.description && (
                        <p className="text-sm text-gray-600 truncate">
                          {document.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>{formatDate(document.created_at)}</span>
                        <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {categories.find(cat => cat.id === document.category)?.name || document.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleDocumentPreview(document)}
                        className="text-gray-600 hover:text-gray-700 p-1"
                        title="Náhľad"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDocumentDownload(document)}
                        disabled={isDownloading}
                        className="text-gray-600 hover:text-gray-700 p-1 disabled:opacity-50"
                        title="Stiahnuť"
                      >
                        <CloudArrowDownIcon className="h-4 w-4" />
                      </button>
                      {canManageDocuments && (
                        <button
                          onClick={() => handleDocumentDelete(document.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                          title="Vymazať"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && canManageDocuments && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleDocumentUpload}
          companyId={companyId}
          userEmail={userEmail}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewDocument && (
        <DocumentPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          document={previewDocument}
          onDownload={handleDocumentDownload}
        />
      )}
    </div>
  );
};

export default DocumentManager;
