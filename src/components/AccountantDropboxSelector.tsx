import React, { useState, useEffect } from 'react';
import { BuildingOfficeIcon, FolderIcon } from '@heroicons/react/24/outline';
import DropboxIntegration from './DropboxIntegration';
import { authHeaders } from '../utils/http';

const API_BASE = (process.env.REACT_APP_API_BASE || '/api').replace(/\/$/, '');

interface DropboxCompany {
  id: number;
  companyId: number;
  companyEmail: string;
  companyName: string;
  companyICO: string;
  folderPath: string;
  shareLink: string;
  isShared: boolean;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canUpload: boolean;
    canDelete: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  userEmail: string;
}

const AccountantDropboxSelector: React.FC<Props> = ({ userEmail }) => {
  const [companies, setCompanies] = useState<DropboxCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<DropboxCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`${API_BASE}/dropbox/admin/all-settings`, {
          headers: authHeaders(),
        });
        const data = await resp.json();
        if (resp.ok && data?.success) {
          setCompanies(data.settings as DropboxCompany[]);
        } else {
          setError(data?.error || 'Chyba pri načítaní firiem s Dropbox zložkami');
        }
      } catch (e) {
        setError('Chyba pri načítaní firiem s Dropbox zložkami');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Načítavam firmy s Dropbox zložkami...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-red-800">Chyba</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (selectedCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedCompany(null)} className="text-blue-600 hover:text-blue-800 font-medium">
            ← Späť na zoznam firiem
          </button>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900">{selectedCompany.companyName}</h2>
            <p className="text-sm text-gray-600">{selectedCompany.companyEmail}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Dropbox súbory</h3>
            <p className="text-sm text-gray-600 mt-1">Zložka: {selectedCompany.folderPath}</p>
          </div>
          <div className="p-6">
            <DropboxIntegration
              companyId={selectedCompany.companyId}
              userEmail={userEmail}
              companyEmail={selectedCompany.companyEmail}
              isCompanyView={true}
              userRole="accountant"
              companyName={selectedCompany.companyName}
              companyICO={selectedCompany.companyICO}
              onFileSelect={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Firmy s Dropbox zložkami</h2>
          <p className="text-sm text-gray-600 mt-1">Vyberte firmu pre zobrazenie jej Dropbox súborov</p>
        </div>
        <div className="text-sm text-gray-500">{companies.length} firiem s Dropbox zložkami</div>
      </div>

      {companies.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Žiadne firmy s Dropbox zložkami</h3>
          <p className="mt-1 text-sm text-gray-500">Zatiaľ neboli vytvorené žiadne Dropbox zložky pre firmy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCompany(company)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{company.companyName}</h3>
                      <p className="text-sm text-gray-600">{company.companyEmail}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <FolderIcon className="h-4 w-4 mr-2" />
                      <span className="font-mono text-xs">{company.folderPath}</span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          company.isShared ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {company.isShared ? 'Zdieľané' : 'Nezdieľané'}
                      </span>

                      <span className="text-gray-500">
                        Aktualizované: {new Date(company.updatedAt).toLocaleDateString('sk-SK')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountantDropboxSelector;
