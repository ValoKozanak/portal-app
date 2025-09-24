import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CloudIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { dropboxService } from '../services/dropboxService';

const DropboxCallback: React.FC = () => {
  console.log('=== DropboxCallback komponent sa na�TA�tal ===');
  console.log('URL:', window.location.href);
  console.log('Search params:', window.location.search);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const isProcessing = useRef(false);

  useEffect(() => {
    console.log('DropboxCallback useEffect - za�Tiatok');
    if (status === 'idle' && !isProcessing.current) {
      handleCallback();
    }
  }, [status]); // ZA?visA� na status

  const handleCallback = async () => {
    // Kontrola, �Ti sa callback uLl spracovA?va
    if (isProcessing.current || status !== 'idle') {
      console.log('Callback uLl sa spracovA?va alebo bol dokon�TenA?, ignorujem...');
      return;
    }

    isProcessing.current = true;
    try {
      console.log('SpracovA?vam Dropbox callback...');
      setStatus('loading');
      
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('Callback parametre:', { code, state, error });

             if (error) {
         console.error('Dropbox callback error:', error);
         setStatus('error');
         setMessage(`Chyba pri autentifikA?cii: ${error}`);
         return;
       }

             if (!code || !state) {
         console.error('ChA?bajAsce parametre:', { code, state });
         setStatus('error');
         setMessage('ChA?bajAsce parametre pre autentifikA?ciu');
         return;
       }

      console.log('SpracovA?vam OAuth callback...');
      
      // Spracovanie OAuth callback
      await dropboxService.handleAuthCallback(code, state);
      
      console.log('OAuth callback AsspeL?nA?!');
      
      setStatus('success');
      setMessage('AsspeL?ne ste sa prihlA?sili k Dropbox!');
      
                     // Presmeruje spA�LA na dashboard s URL parametrom
        setTimeout(() => {
          console.log('PresmerovA?vam spA�LA na dashboard s URL parametrom...');
          navigate('/dashboard?from_callback=true');
        }, 2000);

      } catch (error) {
        console.error('Error during Dropbox callback:', error);
        setStatus('error');
        setMessage('Chyba pri pripojenA� k Dropbox. SkAsste to znova.');
      } finally {
        isProcessing.current = false;
      }
    };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <CloudIcon className="mx-auto h-8 w-8 text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                PripA?janie k Dropbox...
              </h2>
              <p className="text-gray-600">
                SpracovA?vame vaL?u autentifikA?ciu
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AsspeL?ne pripojenA�!
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                PresmerovA?vam vA?s spA�LA...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Chyba pripojenia
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                SpA�LA
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DropboxCallback;

