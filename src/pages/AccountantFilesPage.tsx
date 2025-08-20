import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, DocumentTextIcon, BuildingOfficeIcon, FolderIcon } from '@heroicons/react/24/outline';
import { Company, apiService } from '../services/apiService';
import FileUploadModal from '../components/FileUploadModal';
import FilePreviewModal from '../components/FilePreviewModal';

interface AccountantFilesPageProps {
  userEmail: string;
  onBack: () => void;
}

const AccountantFilesPage: React.FC<AccountantFilesPageProps> = ({ userEmail, onBack }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [showFilePreviewModal, setShowFilePreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  useEffect(() => {
    loadAccountantData();
  }, [userEmail]);

  const loadAccountantData = async () => {
    try {
      const assignedCompanies = await apiService.getAccountantCompanies(userEmail);
      setCompanies(assignedCompanies);

      const allDocuments: any[] = [];
      for (const company of assignedCompanies) {
        try {
          const companyFiles = await apiService.getCompanyFiles(company.id);
          allDocuments.push(...companyFiles);
        } catch (error) {
          console.error(`Chyba pri načítaní dokumentov pre firmu ${company.id}:`, error);
        }
      }
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Chyba pri načítaní dát účtovníka:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleUploadFile = () => {
    if (companies.length === 0) {
      alert('Nemáte priradené žiadne firmy. Kontaktujte administrátora.');
      return;
    }
    setShowFileUploadModal(true);
  };

  const handleFilePreview = (file: any) => {
    setPreviewFile(file);
    setShowFilePreviewModal(true);
  };

  const handleFileUpload = async (fileData: any) => {
    try {
      await loadAccountantData();
      setShowFileUploadModal(false);
    } catch (error) {
      console.error('Chyba pri nahrávaní súboru:', error);
      alert('Chyba pri nahrávaní súboru');
    }
  };

  const handleDeleteDocument = async (fileId: number) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        await apiService.deleteFile(fileId);
        setDocuments(prev => prev.filter(doc => doc.id !== fileId));
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
        alert('Chyba pri mazaní dokumentu');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="font-medium">Späť do Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Prihlásený ako</p>
                <p className="font-medium text-gray-900">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Súbory zo všetkých priradených firiem</h1>
          <p className="text-gray-600 mt-2">
            Celkovo {documents.length} súborov z {companies.length} firiem
          </p>
        </div>

        {/* Files Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Správa súborov</h2>
            </div>
            <button
              onClick={handleUploadFile}
              disabled={companies.length === 0}
              className={`px-4 py-2 rounded-md flex items-center ${
                companies.length === 0 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {companies.length === 0 ? 'Žiadne firmy' : 'Nahrať súbor'}
            </button>
          </div>

          <div className="p-6">
            {loadingDocuments ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Načítavam súbory...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{document.original_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            <span>Firma: {document.company_name || 'Neznáma'}</span>
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            <span>Typ: {document.file_type}</span>
                          </div>
                          <div className="flex items-center">
                            <span>Veľkosť: {(document.file_size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Nahrané
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Nahral: {document.uploaded_by} | Dátum: {new Date(document.created_at).toLocaleDateString('sk-SK')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFilePreview(document)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Náhľad
                        </button>
                        <button
                          onClick={() => window.open(`/api/files/download/${document.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Stiahnuť
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Vymazať
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nemáte priradené firmy</h3>
                <p className="mt-1 text-sm text-gray-500">Kontaktujte administrátora, aby vám priradil firmy.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne súbory</h3>
                <p className="mt-1 text-sm text-gray-500">Zatiaľ nemáte žiadne nahrané súbory</p>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Modal */}
        {companies.length > 0 && (
          <FileUploadModal
            isOpen={showFileUploadModal}
            onClose={() => setShowFileUploadModal(false)}
            companies={companies}
            onFileUpload={handleFileUpload}
          />
        )}

        {/* File Preview Modal */}
        <FilePreviewModal
          isOpen={showFilePreviewModal}
          onClose={() => {
            setShowFilePreviewModal(false);
            setPreviewFile(null);
          }}
          file={previewFile}
        />
      </div>
    </div>
  );
};

export default AccountantFilesPage;
