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
import { Company, API_BASE_URL } from '../services/apiService';

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
  shareLink?: string | null;
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

  const authHeader = () => {
    const t = localStorage.getItem('token') || localStorage.getItem('auth_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  // Kontrola Dropbox autentifikácie - len raz pri mount
  useEffect(() => {
    const initAuth = async () => {
      const authenticated = dropboxService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        try {
          const account = await dropboxService.getAccountInfo();
          setAccountInfo(account);
        } catch {
          try {
            await dropboxService.refreshAccessToken();
            const account = await dropboxService.getAccountInfo();
            setAccountInfo(account);
          } catch {
            handleLogout();
          }
        }
      }
    };

    initAuth();
  }, []);

  // Kontrola autentifikácie pri návrate z callbacku (URL param)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromCallback = urlParams.get('from_callback');

    if (fromCallback === 'true') {
      const authenticated = dropboxService.isAuthenticated();
      if (authenticated) {
        setIsAuthenticated(true);
        dropboxService
          .getAccountInfo()
          .then((account) => setAccountInfo(account))
          .catch(() => {});
      }
      // vyčisti URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Načítanie nastavení zdieľania pre všetky firmy
  useEffect(() => {
    if (isAuthenticated && companies.length > 0) {
      loadShareSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, isAuthenticated]);

  const handleLogin = () => {
    // vyčisti staré tokeny/state
    localStorage.removeItem('dropbox_access_token');
    localStorage.removeItem('dropbox_refresh_token');
    localStorage.removeItem('dropbox_auth_state');
    const authUrl = dropboxService.getAuthUrl();
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    dropboxService.logout();
    setIsAuthenticated(false);
    setAccountInfo(null);
    setShareSettings([]);
  };

  const loadShareSettings = async () => {
    if (!isAuthenticated) return;
    setLoading(true);

    try {
      if (!companies || companies.length === 0) {
        setShareSettings([]);
        return;
      }

      // 1) Skús načítať nastavenia z DB (cez backend)
      try {
        const response = await fetch(`${API_BASE_URL}/dropbox/admin/all-settings`, {
          headers: { ...authHeader() }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            const settings: DropboxShareSettings[] = companies.map((company) => {
              const dbSetting = data.settings.find((s: any) => s.companyId === company.id);
              const folderPath = `/Portal/Companies/${dropboxService.hashICO(company.ico)}`;

              if (dbSetting) {
                return {
                  companyId: company.id,
                  companyEmail: company.owner_email,
                  companyName: company.name,
                  companyICO: company.ico,
                  isShared: !!dbSetting.isShared,
                  permissions: dbSetting.permissions,
                  folderPath: dbSetting.folderPath || folderPath,
                  shareLink: dbSetting.shareLink || null
                };
              } else {
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
                  folderPath
                };
              }
            });

            setShareSettings(settings);
            setLoading(false);
            return;
          }
        }
      } catch (dbErr) {
        // fallback nižšie
      }

      // 2) Fallback – cez Dropbox API (ak DB nevrátila nič)
      const settings: DropboxShareSettings[] = [];
      for (const company of companies) {
        const folderPath = `/Portal/Companies/${dropboxService.hashICO(company.ico)}`;
        try {
          const folderExists = await dropboxService.checkFolderExists(folderPath);

          let shareLink: string | undefined;
          const defaultPerm = { canView: true, canEdit: false, canUpload: true, canDelete: false };

          if (folderExists) {
            try {
              const existingLinks = await dropboxService.getAllSharedLinks();
              const companyLink = existingLinks.find(
                (link: any) => link.path_lower === folderPath.toLowerCase()
              );
              if (companyLink) shareLink = companyLink.url;
            } catch {
              // ignore link lookup errors
            }
          }

          settings.push({
            companyId: company.id,
            companyEmail: company.owner_email,
            companyName: company.name,
            companyICO: company.ico,
            isShared: folderExists,
            permissions: defaultPerm,
            shareLink,
            folderPath
          });
        } catch {
          const defaultPerm = { canView: true, canEdit: false, canUpload: true, canDelete: false };
          settings.push({
            companyId: company.id,
            companyEmail: company.owner_email,
            companyName: company.name,
            companyICO: company.ico,
            isShared: false,
            permissions: defaultPerm,
            folderPath
          });
        }
      }

      setShareSettings(settings);
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
      const folderPath = await dropboxService.createCompanyFolder(company.ico);
      const defaultPermissions = {
        canView: true,
        canEdit: false,
        canUpload: true,
        canDelete: false
      };
      const shareLink = await dropboxService.createSharedLink(folderPath, defaultPermissions);

      // uložiť do DB
      try {
        const saveResponse = await fetch(`${API_BASE_URL}/dropbox/admin/save-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({
            companyId: company.id,
            companyEmail: company.owner_email,
            companyICO: company.ico,
            folderPath,
            shareLink,
            permissions: defaultPermissions
          })
        });
        await saveResponse.json().catch(() => ({}));
      } catch {}

      setShareSettings((prev) =>
        prev.map((s) =>
          s.companyId === company.id
            ? { ...s, isShared: true, folderPath, shareLink, permissions: defaultPermissions }
            : s
        )
      );

      alert(`Zložka pre firmu ${company.name} bola úspešne vytvorená a zdieľaná.`);
    } catch (error) {
      console.error('Chyba pri vytváraní zložky:', error);
      alert('Chyba pri vytváraní zložky');
    }
  };

  const handleShareFolder = async (company: Company) => {
    setSelectedCompany(company);
    setShowShareModal(true);
    setInitialPermissions(null);
  };

  const handleEditPermissions = async (
    company: Company,
    currentPermissions: { canView: boolean; canEdit: boolean; canUpload: boolean; canDelete: boolean }
  ) => {
    setSelectedCompany(company);
    setShowShareModal(true);
    setInitialPermissions(currentPermissions);
  };

  const handleSaveShareSettings = async (settingsPayload: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  }) => {
    if (!selectedCompany) return;

    try {
      const folderPath = `/Portal/Companies/${dropboxService.hashICO(selectedCompany.ico)}`;

      // Revoke existujúci link (ak je)
      const currentSetting = shareSettings.find((s) => s.companyId === selectedCompany.id);
      if (currentSetting?.shareLink) {
        try {
          await dropboxService.revokeSharedLink(currentSetting.shareLink);
        } catch {
          // ignore
        }
      }

      // Vytvor nový link
      const shareLink = await dropboxService.createSharedLink(folderPath, settingsPayload);

      // Ulož do DB
      try {
        const saveResponse = await fetch(`${API_BASE_URL}/dropbox/admin/save-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader() },
          body: JSON.stringify({
            companyId: selectedCompany.id,
            companyEmail: selectedCompany.owner_email,
            folderPath,
            shareLink,
            permissions: settingsPayload
          })
        });
        await saveResponse.json().catch(() => ({}));
      } catch {}

      setShareSettings((prev) =>
        prev.map((s) =>
          s.companyId === selectedCompany.id
            ? {
                ...s,
                isShared: true,
                shareLink,
                permissions: settingsPayload,
                folderPath
              }
            : s
        )
      );

      setShowShareModal(false);
      setSelectedCompany(null);
      setInitialPermissions(null);
      alert(
        initialPermissions
          ? `Oprávnenia pre firmu ${selectedCompany.name} boli úspešne aktualizované.`
          : `Zdieľanie pre firmu ${selectedCompany.name} bolo úspešne nastavené.`
      );
    } catch (error) {
      console.error('Chyba pri nastavovaní zdieľania:', error);
      alert('Chyba pri nastavovaní zdieľania');
    }
  };

  const handleRevokeAccess = async (companyId: number) => {
    if (!window.confirm('Naozaj chcete odobrať prístup k Dropbox zložke?')) return;

    try {
      const setting = shareSettings.find((s) => s.companyId === companyId);
      if (setting?.shareLink) {
        await dropboxService.revokeSharedLink(setting.shareLink);

        // Update DB – isShared=false a shareLink=null
        try {
          const saveResponse = await fetch(`${API_BASE_URL}/dropbox/admin/save-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader() },
            body: JSON.stringify({
              companyId: setting.companyId,
              companyEmail: setting.companyEmail,
              folderPath: setting.folderPath,
              shareLink: null,
              permissions: setting.permissions
            })
          });
          await saveResponse.json().catch(() => ({}));
        } catch {}
      }

      setShareSettings((prev) =>
        prev.map((s) => (s.companyId === companyId ? { ...s, isShared: false, shareLink: undefined } : s))
      );

      alert('Prístup bol úspešne odobraný.');
    } catch (error) {
      console.error('Chyba pri odoberaní prístupu:', error);
      alert('Chyba pri odoberaní prístupu');
    }
  };

  const getPermissionIcon = (permission: boolean) =>
    permission ? <CheckIcon className="h-4 w-4 text-green-500" /> : <XMarkIcon className="h-4 w-4 text-red-500" />;

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <CloudIcon className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pripojte sa k Dropbox</h3>
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
        <p className="mt-4 text-gray-600">{loading ? 'Načítavam Dropbox nastavenia...' : 'Načítavam zoznam firiem...'}</p>
        {!companies || companies.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">{companies ? 'Žiadne firmy neboli nájdené' : 'Čakám na načítanie firiem...'}</p>
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
          {accountInfo && <div className="text-xs text-gray-500 ml-2">({accountInfo.name.display_name})</div>}
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 ml-2">
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
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Zdieľané</span>
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
                    onClick={() => handleCreateFolder(companies.find((c) => c.id === setting.companyId)!)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Vytvoriť a zdieľať zložku
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        handleShareFolder(companies.find((c) => c.id === setting.companyId)!)
                      }
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
                    onClick={() =>
                      handleEditPermissions(
                        companies.find((c) => c.id === setting.companyId)!,
                        setting.permissions
                      )
                    }
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

const ShareSettingsModal: React.FC<ShareSettingsModalProps> = ({
  company,
  initialPermissions,
  onClose,
  onSave
}) => {
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Zobrazovať súbory</span>
            <input
              type="checkbox"
              checked={settings.canView}
              onChange={(e) => setSettings((prev) => ({ ...prev, canView: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Upravovať súbory</span>
            <input
              type="checkbox"
              checked={settings.canEdit}
              onChange={(e) => setSettings((prev) => ({ ...prev, canEdit: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Nahrávať súbory</span>
            <input
              type="checkbox"
              checked={settings.canUpload}
              onChange={(e) => setSettings((prev) => ({ ...prev, canUpload: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Vymazávať súbory</span>
            <input
              type="checkbox"
              checked={settings.canDelete}
              onChange={(e) => setSettings((prev) => ({ ...prev, canDelete: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
            Zrušiť
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            {initialPermissions ? 'Aktualizovať oprávnenia' : 'Uložiť nastavenia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DropboxAdminPanel;
