import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MdbManagement = ({ onBack }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Získanie zoznamu MDB súborov
  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/accounting/admin/mdb/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFiles(response.data.files || []);
    } catch (error) {
      setError('Chyba pri načítaní súborov: ' + error.message);
    }
  };

  // Upload nového MDB súboru
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedCompany) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Získaj upload URL
      const { data: { uploadUrl } } = await axios.post(
        `/api/accounting/admin/mdb/upload-url/${selectedCompany}`,
        { year: selectedYear },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // 2. Upload súboru priamo do Spaces
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': 'application/x-msaccess',
        },
      });

      setSuccess(`MDB súbor ${file.name} bol úspešne nahraný!`);
      fetchFiles(); // Refresh zoznamu
      event.target.value = ''; // Reset input
    } catch (error) {
      setError('Upload zlyhal: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Migrácia z Dropbox
  const handleMigration = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/accounting/admin/mdb/migrate-local', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess(`Migrácia dokončená: ${response.data.migrated} súborov migrovaných`);
      fetchFiles(); // Refresh zoznamu
    } catch (error) {
      setError('Migrácia zlyhala: ' + error.message);
    }
  };

  // Test Spaces pripojenia
  const testSpaces = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/accounting/admin/spaces/test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.spaces.isInitialized) {
        setSuccess('DigitalOcean Spaces funguje správne!');
      } else {
        setError('DigitalOcean Spaces nie je nakonfigurované');
      }
    } catch (error) {
      setError('Test Spaces zlyhal: ' + error.message);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md"
              >
                ← Späť na Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">MDB Management</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">MDB Management (DigitalOcean Spaces)</h2>

          {/* Test Spaces */}
          <div className="mb-6">
            <button
              onClick={testSpaces}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Spaces Pripojenia
            </button>
          </div>

          {/* Upload nového MDB súboru */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Upload nového MDB súboru</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IČO firmy
                </label>
                <input
                  type="text"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  placeholder="Zadajte IČO firmy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rok
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MDB súbor
                </label>
                <input
                  type="file"
                  accept=".mdb"
                  onChange={handleUpload}
                  disabled={uploading || !selectedCompany}
                  className="w-full"
                />
              </div>
            </div>

            {uploading && (
              <p className="text-sm text-blue-600">Uploadujem...</p>
            )}
          </div>

          {/* Migrácia z Dropbox */}
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Migrácia z Dropbox</h3>
            <p className="text-sm text-gray-600 mb-4">
              Migrujte existujúce MDB súbory z Dropbox do DigitalOcean Spaces
            </p>
            <button
              onClick={handleMigration}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Spustiť migráciu
            </button>
          </div>

          {/* Zoznam dostupných MDB súborov */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Dostupné MDB súbory</h3>

            <div className="mb-4">
              <button
                onClick={fetchFiles}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Obnoviť zoznam
              </button>
            </div>

            {files.length === 0 ? (
              <p className="text-gray-500">Žiadne MDB súbory neboli nájdené</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 border border-gray-200 text-left">Názov súboru</th>
                      <th className="px-4 py-2 border border-gray-200 text-left">Veľkosť</th>
                      <th className="px-4 py-2 border border-gray-200 text-left">Dátum úpravy</th>
                      <th className="px-4 py-2 border border-gray-200 text-left">IČO firmy</th>
                      <th className="px-4 py-2 border border-gray-200 text-left">Rok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border border-gray-200">{file.key}</td>
                        <td className="px-4 py-2 border border-gray-200">
                          {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                        </td>
                        <td className="px-4 py-2 border border-gray-200">
                          {file.lastModified ? new Date(file.lastModified).toLocaleDateString('sk-SK') : 'N/A'}
                        </td>
                        <td className="px-4 py-2 border border-gray-200">{file.companyIco}</td>
                        <td className="px-4 py-2 border border-gray-200">{file.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Štatistiky */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Celkovo súborov</h4>
              <p className="text-2xl font-bold text-blue-600">{files.length}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Celková veľkosť</h4>
              <p className="text-2xl font-bold text-green-600">
                {files.reduce((total, file) => total + (file.size || 0), 0) / 1024 / 1024 > 0
                  ? `${(files.reduce((total, file) => total + (file.size || 0), 0) / 1024 / 1024).toFixed(2)} MB`
                  : '0 MB'
                }
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Posledná aktualizácia</h4>
              <p className="text-2xl font-bold text-purple-600">
                {files.length > 0 && files[0].lastModified
                  ? new Date(files[0].lastModified).toLocaleDateString('sk-SK')
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {/* Notifikácie */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Inštrukcie */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Ako to funguje:</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Testujte Spaces pripojenie</li>
              <li>Vyberte IČO firmy a rok pre upload</li>
              <li>Nahrajte MDB súbor (.mdb)</li>
              <li>Súbor sa automaticky nahraje do DigitalOcean Spaces</li>
              <li>Migrujte existujúce súbory z Dropbox</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MdbManagement;