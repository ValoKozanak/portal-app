import React, { useState, useEffect } from 'react';
import { 
  CloudIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { dropboxService, DropboxFile } from '../services/dropboxService';

interface DropboxIntegrationProps {
  companyId?: number;
  userEmail?: string;
  isCompanyView?: boolean;
  onFileSelect?: (file: DropboxFile) => void;
  companyEmail?: string; // Email firmy pre zobrazenie správneho folderu
  userRole?: 'admin' | 'accountant' | 'company'; // Role používateľa
  companyName?: string; // Názov firmy pre zobrazenie
  companyICO?: string; // IČO firmy pre vytvorenie zložky
}

const DropboxIntegration: React.FC<DropboxIntegrationProps> = ({ 
  companyId, 
  userEmail,
  companyEmail,
  isCompanyView = false,
  onFileSelect,
  userRole = 'company',
  companyName,
  companyICO
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('=== DROPBOX INTEGRATION - checkAuthStatus ===');
    console.log('DropboxIntegration.checkAuthStatus - začiatok');
    
    const authenticated = dropboxService.isAuthenticated();
    console.log('DropboxIntegration.checkAuthStatus - authenticated:', authenticated);
    
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      try {
        const account = await dropboxService.getAccountInfo();
        setAccountInfo(account);
        loadFiles(authenticated); // Předáme authenticated hodnotu
      } catch (error) {
        console.error('Error loading account info:', error);
        // Token môže byť expirovaný, skúsime ho obnoviť
        try {
          await dropboxService.refreshAccessToken();
          const account = await dropboxService.getAccountInfo();
          setAccountInfo(account);
          loadFiles(true); // Předáme true, protože refreshAccessToken úspěšný
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          handleLogout();
        }
      }
    }
  };

  const handleLogin = () => {
    const authUrl = dropboxService.getAuthUrl();
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    dropboxService.logout();
    setIsAuthenticated(false);
    setAccountInfo(null);
    setFiles([]);
  };

  const loadFiles = async (authenticatedOverride?: boolean) => {
    const isAuth = authenticatedOverride !== undefined ? authenticatedOverride : isAuthenticated;
    
    if (!isAuth) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== DROPBOX INTEGRATION DEBUG ===');
      // Ak je company view, načítame iba súbory z firmy
      if (isCompanyView && companyICO) {
        const companyFolder = dropboxService.getCompanyFolderPath(companyICO);
        
        const fileList = await dropboxService.listFiles(companyFolder, companyICO);
        
        setFiles(fileList);
        setCurrentPath(companyFolder);
      } else {
        const fileList = await dropboxService.listFiles(currentPath, userEmail);
        setFiles(fileList);
      }
    } catch (error) {
      console.error('DropboxIntegration.loadFiles - ERROR:', error);
      if (error instanceof Error) {
        console.error('DropboxIntegration.loadFiles - error.message:', error.message);
        console.error('DropboxIntegration.loadFiles - error.stack:', error.stack);
      }
    } finally {
      setIsLoading(false);

    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !isAuthenticated) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const icoToUse = isCompanyView && companyICO ? companyICO : undefined;
      
      const result = await dropboxService.uploadFile(selectedFile, currentPath || '', icoToUse);
      
      // Pridanie nového súboru do zoznamu
      setFiles(prev => [...prev, {
        id: result.id,
        name: result.name,
        path_lower: result.path_lower,
        size: result.size,
        server_modified: result.server_modified,
        content_hash: '',
        tag: 'file'
      }]);

      setSelectedFile(null);
      setUploadProgress(100);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Chyba pri nahrávaní súboru');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileDownload = async (file: DropboxFile) => {
    if (!isAuthenticated) return;

    try {
      const blob = await dropboxService.downloadFile(file.path_lower);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Chyba pri sťahovaní súboru');
    }
  };

  const handleFileDelete = async (file: DropboxFile) => {
    if (!isAuthenticated) return;

    if (!window.confirm(`Naozaj chcete vymazať súbor "${file.name}"?`)) return;

    try {
      await dropboxService.deleteFile(file.path_lower);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Chyba pri mazaní súboru');
    }
  };

  const handleFolderClick = (file: DropboxFile) => {
    if (file.tag === 'folder') {
      setCurrentPath(file.path_lower);
      loadFiles();
    }
  };

  const handleBackClick = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(parentPath);
    loadFiles();
  };

  const handleCreateSharedLink = async () => {
    if (!isAuthenticated || !companyICO) return;

    try {
      const sharedLink = await dropboxService.getCompanySharedLink(companyICO);
      // Skopírovanie linku do clipboard
      navigator.clipboard.writeText(sharedLink);
      alert('Zdieľateľný link bol skopírovaný do clipboard!');
    } catch (error) {
      console.error('Error creating shared link:', error);
      alert('Chyba pri vytváraní zdieľateľného linku');
    }
  };

  const getFileIcon = (file: DropboxFile) => {
    if (file.tag === 'folder') return FolderIcon;
    if (file.name.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) return PhotoIcon;
    return DocumentIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <CloudIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pripojte sa k Dropbox
          </h3>
          <p className="text-gray-600 mb-4">
            Synchronizujte súbory s vaším Dropbox účtom pre bezpečné zálohovanie a prístup z akéhokoľvek zariadenia.
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <CloudIcon className="h-5 w-5 mr-2" />
            Pripojiť Dropbox
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CloudIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCompanyView && companyEmail 
                    ? `Dropbox súbory - ${companyEmail}` 
                    : userEmail 
                      ? `Dropbox súbory - ${userEmail}` 
                      : 'Dropbox súbory'
                  }
                </h2>
                {accountInfo && (
                  <p className="text-sm text-gray-600">
                    Prihlásený ako: {userRole === 'company' && companyName ? companyName : accountInfo.name.display_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Tlačidlá zobrazujeme len pre admin a accountant */}
              {userRole !== 'company' && (
                <>
                  {(userEmail || (isCompanyView && companyEmail)) && (
                    <button
                      onClick={handleCreateSharedLink}
                      className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      title="Vytvoriť zdieľateľný link"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Zdieľať
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Odhlásiť
                  </button>
                </>
              )}
            </div>
          </div>
      </div>

      {/* Upload Section */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
          />
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            {isUploading ? 'Nahrávam...' : 'Nahrať'}
          </button>
        </div>
        {isUploading && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={handleBackClick}
            disabled={!currentPath}
            className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ..
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-gray-900">{currentPath || 'root'}</span>
        </div>
      </div>

      {/* File List */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Načítavam súbory...</p>
          </div>
        ) : files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => {
              const Icon = getFileIcon(file);
              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => file.tag === 'folder' ? handleFolderClick(file) : onFileSelect?.(file)}
                  >
                    <Icon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      {file.tag === 'file' && (
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.server_modified).toLocaleDateString('sk-SK')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {file.tag === 'file' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFileDownload(file)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Stiahnuť"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Vymazať"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CloudIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne súbory</h3>
            <p className="mt-1 text-sm text-gray-500">
              {currentPath ? 'Tento priečinok je prázdny' : 'Začnite nahrávaním súborov'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DropboxIntegration;
