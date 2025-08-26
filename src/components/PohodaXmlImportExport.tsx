import React, { useState } from 'react';
import { accountingService } from '../services/accountingService';

interface PohodaXmlImportExportProps {
  companyId: number;
}

const PohodaXmlImportExport: React.FC<PohodaXmlImportExportProps> = ({ companyId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/xml' || file.type === 'text/xml')) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      alert('Prosím vyberte XML súbor');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Prosím vyberte XML súbor');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await accountingService.uploadPohodaXml(companyId, selectedFile);
      
      setUploadResult({
        success: result.success,
        message: result.message || 'Upload dokončený',
        details: result.data
      });
      
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('xml-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Chyba pri upload:', error);
      setUploadResult({
        success: false,
        message: 'Chyba pri nahrávaní XML súboru'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const blob = await accountingService.exportPohodaXml(companyId, dateFrom, dateTo);
      
      // Vytvorenie download linku
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pohoda_invoices_${companyId}_${new Date().toISOString().split('T')[0]}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Chyba pri exporte:', error);
      alert('Chyba pri exporte XML súboru');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        POHODA XML Import/Export
      </h3>
      
      <div className="space-y-6">
        {/* Import sekcia */}
        <div className="border rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">Import faktúr z POHODA XML</h4>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="xml-file-input" className="block text-sm font-medium text-gray-700 mb-1">
                Vyberte XML súbor z POHODA
              </label>
              <input
                id="xml-file-input"
                type="file"
                accept=".xml"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Podporované sú len XML súbory exportované z POHODA
              </p>
            </div>
            
            {selectedFile && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Vybraný súbor:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Nahrávam...
                </>
              ) : (
                'Nahrať XML súbor'
              )}
            </button>
          </div>
          
          {uploadResult && (
            <div className={`mt-4 p-3 rounded-md ${
              uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <p className="text-sm font-medium">{uploadResult.message}</p>
              {uploadResult.details && (
                <div className="mt-2 text-xs">
                  <p>Importované: {uploadResult.details.imported}</p>
                  <p>Chyby: {uploadResult.details.errors?.length || 0}</p>
                  {uploadResult.details.errors && uploadResult.details.errors.length > 0 && (
                    <ul className="mt-1 list-disc list-inside">
                      {uploadResult.details.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export sekcia */}
        <div className="border rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">Export faktúr do POHODA XML</h4>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                  Dátum od
                </label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                  Dátum do
                </label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Ak nevyberiete dátumy, exportujú sa všetky faktúry
            </p>
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportujem...
                </>
              ) : (
                'Exportovať do XML'
              )}
            </button>
          </div>
        </div>

        {/* Informácie */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-yellow-800 mb-2">Ako to funguje</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>Import:</strong> Exportujte faktúry z POHODA do XML súboru a nahrajte ich tu</p>
            <p><strong>Export:</strong> Stiahnite faktúry v POHODA XML formáte pre import do POHODA</p>
            <p><strong>Kompatibilita:</strong> Funguje s demo aj plnou verziou POHODA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PohodaXmlImportExport;
