import React, { useState } from 'react';
import axios from 'axios';

const MdbUpload = ({ companyIco, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadUrl, setUploadUrl] = useState(null);
  const [year, setYear] = useState('2025');

  // Generovanie upload URL
  const generateUploadUrl = async () => {
    try {
      setError(null);
      const response = await axios.post(
        `/api/accounting/admin/mdb/upload-url/${companyIco}`,
        { year },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setUploadUrl(response.data.uploadUrl);
    } catch (error) {
      setError('Chyba pri generovaní upload URL: ' + error.response?.data?.error || error.message);
    }
  };

  // Upload súboru
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !uploadUrl) return;

    setUploading(true);
    setError(null);

    try {
      // Upload súboru priamo do Spaces
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': 'application/x-msaccess',
        },
      });

      // Notifikuj o úspešnom upload
      onUploadComplete && onUploadComplete({
        companyIco,
        year,
        fileName: file.name,
        fileSize: file.size
      });
      
      // Reset stavu
      setUploadUrl(null);
      event.target.value = '';
      
    } catch (error) {
      setError('Upload zlyhal: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Upload MDB súboru pre firmu {companyIco}
      </h3>
      
      <div className="space-y-4">
        {/* Rok */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rok
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        {/* Generovanie upload URL */}
        <div>
          <button
            onClick={generateUploadUrl}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Generovať upload URL
          </button>
        </div>

        {/* Upload súboru */}
        {uploadUrl && (
          <div className="border-2 border-dashed border-green-300 bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-700 mb-3">
              ✅ Upload URL vygenerovaný! Teraz vyberte MDB súbor:
            </p>
            <input
              type="file"
              accept=".mdb"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full"
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-2">Uploadujem...</p>
            )}
          </div>
        )}

        {/* Chyby */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Inštrukcie */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-800 mb-2">Ako to funguje:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Vyberte rok pre MDB súbor</li>
            <li>Kliknite "Generovať upload URL"</li>
            <li>Vyberte MDB súbor (.mdb)</li>
            <li>Súbor sa automaticky nahraje do DigitalOcean Spaces</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MdbUpload;
