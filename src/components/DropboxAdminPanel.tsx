import React, { useState, useEffect } from 'react';
import {
  CloudIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { dropboxService } from '../services/dropboxService';
import { Company } from '../services/apiService';

interface DropboxAdminPanelProps {
  companies: Company[];
  userEmail: string;
}

interface DropboxShareSettings {
  companyId: number;
  companyEmail: string;
  companyName: string;
  companyICO: string;
  isShared: boolean;
  shareLink?: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  };
  folderPath: string;
}

const DropboxAdminPanel: React.FC<DropboxAdminPanelProps> = ({ companies, userEmail }) => {
  const [shareSettings, setShareSettings] = useState<DropboxShareSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [initialPermissions, setInitialPermissions] = useState<{
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  } | null>(null);

    // Kontrola Dropbox autentifikácie - len raz pri mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('DropboxAdminPanel: Inicializujem autentifikáciu...');
      
      const authenticated = dropboxService.isAuthenticated();
      console.log('DropboxAdminPanel: isAuthenticated =', authenticated);
      
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        try {
          console.log('DropboxAdminPanel: Načítavam account info...');
          const account = await dropboxService.getAccountInfo();
          setAccountInfo(account);
          console.log('DropboxAdminPanel: Account info načítané:', account);
        } catch (error) {
          console.error('Error loading account info:', error);
          // Token môže byť expirovaný, skúsime ho obnoviť
          try {
            console.log('DropboxAdminPanel: Skúšam obnoviť token...');
            await dropboxService.refreshAccessToken();
            const account = await dropboxService.getAccountInfo();
            setAccountInfo(account);
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            handleLogout();
          }
        }
      }
    };

    initAuth();
  }, []); // Spustí sa len raz pri mount

  // Kontrola autentifikácie pri návrate z callback - pomocou URL parametra
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCallback = urlParams.get('from_callback');
    
    if (fromCallback === 'true') {
      console.log('DropboxAdminPanel: Detekoval som návrat z callback, kontrolujem autentifikáciu...');
      
      // Kontrolujeme autentifikáciu
      const authenticated = dropboxService.isAuthenticated();
      if (authenticated) {
        console.log('DropboxAdminPanel: Zistil som, že som prihlásený po návrate z callback');
        setIsAuthenticated(true);
        // Načítame account info
        dropboxService.getAccountInfo().then(account => {
          setAccountInfo(account);
        }).catch(error => {
          console.error('Error loading account info after callback:', error);
        });
      }
      
      // Vyčistíme URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []); // Spustí sa len raz pri mount

  // Načítanie nastavení zdieľania pre všetky firmy
  useEffect(() => {
    if (isAuthenticated && companies.length > 0) {
      console.log('DropboxAdminPanel: Načítavam share settings pre', companies.length, 'firiem');
      loadShareSettings();
    }
  }, [companies, isAuthenticated]);

  // Debug log pre sledovanie stavu
  useEffect(() => {
    console.log('DropboxAdminPanel: Stav zmenený:', { 
      isAuthenticated, 
      companiesCount: companies.length,
      shareSettingsCount: shareSettings.length 
    });
  }, [isAuthenticated, companies.length, shareSettings.length]);



  const handleLogin = () => {
    // Vyčistíme staré tokeny a state
    localStorage.removeItem('dropbox_access_token');
    localStorage.removeItem('dropbox_refresh_token');
    localStorage.removeItem('dropbox_auth_state');
    console.log('Vyčistené staré tokeny a state');
    
    const authUrl = dropboxService.getAuthUrl();
    console.log('Presmerovávam na Dropbox OAuth...');
    
    // Jednoduchý redirect namiesto popup
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    dropboxService.logout();
    setIsAuthenticated(false);
    setAccountInfo(null);
    setShareSettings([]);
  };

  const loadShareSettings = async () => {
    if (!isAuthenticated) {
      console.log('loadShareSettings: Nie som prihlásený, ignorujem');
      return;
    }
    
    setLoading(true);
    try {
      // Kontrola, či sú firmy načítané
      if (!companies || companies.length === 0) {
        console.log('loadShareSettings: Žiadne firmy na načítanie');
        setShareSettings([]);
        return;
      }

      console.log('loadShareSettings: Načítavam nastavenia pre', companies.length, 'firiem');
      
      // Najprv načítame nastavenia z databázy
              try {
          const response = await fetch('http://localhost:5000/api/dropbox/admin/all-settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
          console.log('loadShareSettings: Načítané nastavenia z databázy:', data.settings);
          
          const settings: DropboxShareSettings[] = companies.map(company => {
            const dbSetting = data.settings.find((s: any) => s.companyId === company.id);
            const folderPath = `/Portal/Companies/${dropboxService.hashICO(company.ico)}`;
            
            if (dbSetting) {
              // Použijeme nastavenia z databázy
              return {
                companyId: company.id,
                companyEmail: company.owner_email,
                companyName: company.name,
                companyICO: company.ico,
                isShared: dbSetting.isShared,
                permissions: dbSetting.permissions,
                folderPath: dbSetting.folderPath || folderPath,
                shareLink: dbSetting.shareLink
              };
            } else {
              // Predvolené nastavenia pre firmu bez záznamu v databáze
              return {
                companyId: company.id,
                companyEmail: company.owner_email,
                companyName: company.name,
                companyICO: company.ico,
                isShared: false,
                permissions: {
                  canView: true,
                  canEdit: false,
                  canUpload: true,
                  canDelete: false
                },
                folderPath: folderPath
              };
            }
          });
          
          setShareSettings(settings);
          console.log('loadShareSettings: Nastavenia úspešne načítané z databázy');
          return;
        }
      } catch (dbError) {
        console.log('loadShareSettings: Chyba pri načítaní z databázy, používam fallback:', dbError);
      }
      
      // Fallback: načítanie z Dropbox API (pôvodná logika)
      const settings: DropboxShareSettings[] = [];
      
      for (const company of companies) {
        const folderPath = `/Portal/Companies/${dropboxService.hashICO(company.ico)}`;
        
        try {
          // Skontrolujeme, či zložka existuje
          const folderExists = await dropboxService.checkFolderExists(folderPath);
          
          let shareLink: string | undefined;
          let permissions = {
            canView: true,
            canEdit: false,
            canUpload: true,
            canDelete: false
          };
          
          // Ak zložka existuje, skúsime získať existujúci zdieľateľný link
          if (folderExists) {
            try {
              console.log(`Hľadám existujúci link pre ${company.name} v ceste:`, folderPath);
              const existingLinks = await dropboxService.getAllSharedLinks();
              console.log(`Našiel som ${existingLinks.length} existujúcich linkov:`, existingLinks);
              
              const companyLink = existingLinks.find((link: any) => {
                console.log(`Porovnávam:`, {
                  linkPath: link.path_lower,
                  targetPath: folderPath.toLowerCase(),
                  match: link.path_lower === folderPath.toLowerCase()
                });
                return link.path_lower === folderPath.toLowerCase();
              });
              
              if (companyLink) {
                shareLink = companyLink.url;
                console.log(`Našiel som existujúci link pre ${company.name}:`, shareLink);
              } else {
                console.log(`Nenašiel som existujúci link pre ${company.name}`);
              }
            } catch (linkError) {
              console.log(`Nepodarilo sa získať link pre ${company.name}:`, linkError);
            }
          }
          
          settings.push({
            companyId: company.id,
            companyEmail: company.owner_email,
            companyName: company.name,
            companyICO: company.ico,
            isShared: folderExists, // Ak zložka existuje, považujeme ju za zdieľanú
            permissions: permissions,
            shareLink: shareLink,
            folderPath: folderPath
          });
        } catch (error) {
          console.log(`Zložka pre ${company.name} neexistuje:`, error);
          settings.push({
            companyId: company.id,
            companyEmail: company.owner_email,
            companyName: company.name,
            companyICO: company.ico,
            isShared: false,
            permissions: {
              canView: true,
              canEdit: false,
              canUpload: true,
              canDelete: false
            },
            folderPath: folderPath
          });
        }
      }

      setShareSettings(settings);
      console.log('loadShareSettings: Nastavenia úspešne načítané (fallback)');
    } catch (error) {
      console.error('Chyba pri načítaní Dropbox nastavení:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (company: Company) => {
    if (!isAuthenticated) {
      alert('Najprv sa musíte prihlásiť do Dropbox');
      return;
    }

    try {
      // Vytvoríme zložku
      const folderPath = await dropboxService.createCompanyFolder(company.ico);
      
      // Automaticky nastavíme zdieľanie s predvolenými oprávneniami
      const defaultPermissions = {
        canView: true,
        canEdit: false,
        canUpload: true,
        canDelete: false
      };
      
      const shareLink = await dropboxService.createSharedLink(folderPath, defaultPermissions);
      
      // Uložíme nastavenia do databázy
      try {
                  const saveResponse = await fetch('http://localhost:5000/api/dropbox/admin/save-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyId: company.id,
              companyEmail: company.owner_email,
              companyICO: company.ico,
              folderPath: folderPath,
              shareLink: shareLink,
              permissions: defaultPermissions
            })
          });
        
        const saveData = await saveResponse.json();
        
        if (saveData.success) {
          console.log('Nastavenia úspešne uložené do databázy');
        } else {
          console.error('Chyba pri ukladaní do databázy:', saveData.error);
        }
      } catch (dbError) {
        console.error('Chyba pri ukladaní do databázy:', dbError);
      }
      
      // Aktualizujeme lokálne nastavenia
      setShareSettings(prev => prev.map(setting => 
        setting.companyId === company.id 
          ? { 
              ...setting, 
              isShared: true, 
              folderPath,
              shareLink,
              permissions: defaultPermissions
            }
          : setting
      ));
      
      alert(`Zložka pre firmu ${company.name} bola úspešne vytvorená a zdieľaná!`);
    } catch (error) {
      console.error('Chyba pri vytváraní zložky:', error);
      alert('Chyba pri vytváraní zložky');
    }
  };

  const handleShareFolder = async (company: Company) => {
    setSelectedCompany(company);
    setShowShareModal(true);
    setInitialPermissions(null); // Reset pre nové zdieľanie
  };

  const handleEditPermissions = async (company: Company, currentPermissions: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  }) => {
    setSelectedCompany(company);
    setShowShareModal(true);
    // Nastavíme aktuálne oprávnenia do modálneho okna
    setInitialPermissions(currentPermissions);
  };

  const handleSaveShareSettings = async (settings: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  }) => {
    if (!selectedCompany) return;

    try {
      const folderPath = `/Portal/Companies/${dropboxService.hashICO(selectedCompany.ico)}`;
      
      // Ak už existuje zdieľateľný link, najprv ho odvoláme
      const currentSetting = shareSettings.find(s => s.companyId === selectedCompany.id);
      if (currentSetting && currentSetting.shareLink) {
        try {
          console.log('Odvolávam existujúci zdieľateľný link:', currentSetting.shareLink);
          await dropboxService.revokeSharedLink(currentSetting.shareLink);
          console.log('Existujúci zdieľateľný link odvolaný');
        } catch (revokeError) {
          console.log('Link už neexistuje alebo sa nedá odvolať:', revokeError);
        }
      } else {
        console.log('Žiadny existujúci link na odvolanie');
      }
      
      // Vytvoríme nový zdieľateľný link s novými oprávneniami
      const shareLink = await dropboxService.createSharedLink(folderPath, settings);
      
      // Uložíme nastavenia do databázy
      try {
        const saveResponse = await fetch('http://localhost:5000/api/dropbox/admin/save-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: selectedCompany.id,
            companyEmail: selectedCompany.owner_email,
            folderPath: folderPath,
            shareLink: shareLink,
            permissions: settings
          })
        });
        
        const saveData = await saveResponse.json();
        
        if (saveData.success) {
          console.log('Nastavenia úspešne uložené do databázy');
        } else {
          console.error('Chyba pri ukladaní do databázy:', saveData.error);
        }
      } catch (dbError) {
        console.error('Chyba pri ukladaní do databázy:', dbError);
      }
      
      // Aktualizujeme lokálne nastavenia
      setShareSettings(prev => prev.map(setting => 
        setting.companyId === selectedCompany.id 
          ? { 
              ...setting, 
              isShared: true, 
              shareLink,
              permissions: settings,
              folderPath
            }
          : setting
      ));
      
      setShowShareModal(false);
      setSelectedCompany(null);
      setInitialPermissions(null);
      const message = initialPermissions 
        ? `Oprávnenia pre firmu ${selectedCompany.name} boli úspešne aktualizované!`
        : `Zdieľanie pre firmu ${selectedCompany.name} bolo úspešne nastavené!`;
      alert(message);
    } catch (error) {
      console.error('Chyba pri nastavovaní zdieľania:', error);
      alert('Chyba pri nastavovaní zdieľania');
    }
  };

  const handleRevokeAccess = async (companyId: number) => {
    if (!window.confirm('Naozaj chcete odobrať prístup k Dropbox zložke?')) return;

    try {
      const setting = shareSettings.find(s => s.companyId === companyId);
      if (setting && setting.shareLink) {
        await dropboxService.revokeSharedLink(setting.shareLink);
        
        // Aktualizujeme databázu - nastavíme isShared na false a vymažeme shareLink
        try {
          const saveResponse = await fetch('http://localhost:5000/api/dropbox/admin/save-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyId: setting.companyId,
              companyEmail: setting.companyEmail,
              folderPath: setting.folderPath,
              shareLink: null, // Odvolaný link
              permissions: setting.permissions
            })
          });
          
          const saveData = await saveResponse.json();
          
          if (saveData.success) {
            console.log('Nastavenia úspešne aktualizované v databáze');
          } else {
            console.error('Chyba pri aktualizácii databázy:', saveData.error);
          }
        } catch (dbError) {
          console.error('Chyba pri aktualizácii databázy:', dbError);
        }
        
        setShareSettings(prev => prev.map(s => 
          s.companyId === companyId 
            ? { ...s, isShared: false, shareLink: undefined }
            : s
        ));
        
        alert('Prístup bol úspešne odobraný!');
      }
    } catch (error) {
      console.error('Chyba pri odoberaní prístupu:', error);
      alert('Chyba pri odoberaní prístupu');
    }
  };

  const getPermissionIcon = (permission: boolean) => {
    return permission ? (
      <CheckIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XMarkIcon className="h-4 w-4 text-red-500" />
    );
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
            Pre správu Dropbox zdieľaní sa musíte najprv prihlásiť do vášho Dropbox účtu.
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

  if (loading || !companies || companies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          {loading ? 'Načítavam Dropbox nastavenia...' : 'Načítavam zoznam firiem...'}
        </p>
        {!companies || companies.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">
            {companies ? 'Žiadne firmy neboli nájdené' : 'Čakám na načítanie firiem...'}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Dropbox zdieľania pre firmy</h3>
          <p className="text-sm text-gray-600">Spravujte prístupy k Dropbox zložkám pre jednotlivé firmy</p>
        </div>
        <div className="flex items-center space-x-2">
          <CloudIcon className="h-6 w-6 text-blue-500" />
          <span className="text-sm text-gray-600">Admin Dropbox správa</span>
          {accountInfo && (
            <div className="text-xs text-gray-500 ml-2">
              ({accountInfo.name.display_name})
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 ml-2"
          >
            Odhlásiť
          </button>
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-4">
        {shareSettings.map((setting) => (
          <div key={setting.companyId} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-900">{setting.companyName}</h4>
                  {setting.isShared && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Zdieľané
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  {setting.companyEmail}
                </p>
                <p className="text-sm text-gray-500">
                  <FolderIcon className="h-4 w-4 inline mr-1" />
                  {setting.folderPath}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {!setting.isShared ? (
                                     <button
                     onClick={() => handleCreateFolder(companies.find(c => c.id === setting.companyId)!)}
                     className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                   >
                     <PlusIcon className="h-4 w-4 mr-1" />
                     Vytvoriť a zdieľať zložku
                   </button>
                ) : (
                  <>
                                         <button
                       onClick={() => handleShareFolder(companies.find(c => c.id === setting.companyId)!)}
                       className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center"
                     >
                       <LinkIcon className="h-4 w-4 mr-1" />
                       Upraviť zdieľanie
                     </button>
                    <button
                      onClick={() => handleRevokeAccess(setting.companyId)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Odobrať
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Permissions */}
            {setting.isShared && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-700">Oprávnenia:</h5>
                  <button
                    onClick={() => handleEditPermissions(companies.find(c => c.id === setting.companyId)!, setting.permissions)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <PencilIcon className="h-3 w-3 mr-1" />
                    Upraviť oprávnenia
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    {getPermissionIcon(setting.permissions.canView)}
                    <span className="text-sm text-gray-600">Zobraziť</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPermissionIcon(setting.permissions.canEdit)}
                    <span className="text-sm text-gray-600">Upraviť</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPermissionIcon(setting.permissions.canUpload)}
                    <span className="text-sm text-gray-600">Nahrať</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPermissionIcon(setting.permissions.canDelete)}
                    <span className="text-sm text-gray-600">Vymazať</span>
                  </div>
                </div>
                

                
                {setting.isShared && setting.shareLink && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-gray-600 mb-1">Zdieľateľný link:</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={setting.shareLink}
                        readOnly
                        className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(setting.shareLink!)}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        Kopírovať
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Share Modal */}
      {showShareModal && selectedCompany && (
        <ShareSettingsModal
          company={selectedCompany}
          initialPermissions={initialPermissions}
          onClose={() => {
            setShowShareModal(false);
            setSelectedCompany(null);
            setInitialPermissions(null);
          }}
          onSave={handleSaveShareSettings}
        />
      )}
    </div>
  );
};

// Share Settings Modal Component
interface ShareSettingsModalProps {
  company: Company;
  initialPermissions?: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  } | null;
  onClose: () => void;
  onSave: (settings: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  }) => void;
}

const ShareSettingsModal: React.FC<ShareSettingsModalProps> = ({ company, initialPermissions, onClose, onSave }) => {
  const [settings, setSettings] = useState({
    canView: initialPermissions?.canView ?? true,
    canEdit: initialPermissions?.canEdit ?? false,
    canUpload: initialPermissions?.canUpload ?? true,
    canDelete: initialPermissions?.canDelete ?? false
  });

  const handleSave = () => {
    onSave(settings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialPermissions ? 'Úprava oprávnení pre' : 'Nastavenie zdieľania pre'} {company.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Zobraziť súbory</span>
            <input
              type="checkbox"
              checked={settings.canView}
              onChange={(e) => setSettings(prev => ({ ...prev, canView: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Upraviť súbory</span>
            <input
              type="checkbox"
              checked={settings.canEdit}
              onChange={(e) => setSettings(prev => ({ ...prev, canEdit: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Nahrať súbory</span>
            <input
              type="checkbox"
              checked={settings.canUpload}
              onChange={(e) => setSettings(prev => ({ ...prev, canUpload: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Vymazať súbory</span>
            <input
              type="checkbox"
              checked={settings.canDelete}
              onChange={(e) => setSettings(prev => ({ ...prev, canDelete: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Zrušiť
          </button>
                     <button
             onClick={handleSave}
             className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
           >
             {initialPermissions ? 'Aktualizovať oprávnenia' : 'Uložiť nastavenia'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default DropboxAdminPanel;
