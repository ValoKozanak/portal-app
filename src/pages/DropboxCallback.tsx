import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CloudIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { dropboxService } from '../services/dropboxService';

const DropboxCallback: React.FC = () => {
  console.log('=== DropboxCallback komponent sa načítal ===');
  console.log('URL:', window.location.href);
  console.log('Search params:', window.location.search);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const isProcessing = useRef(false);

  useEffect(() => {
    console.log('DropboxCallback useEffect - začiatok');
    if (status === 'idle' && !isProcessing.current) {
      handleCallback();
    }
  }, [status]); // Závisí na status

  const handleCallback = async () => {
    // Kontrola, či sa callback už spracováva
    if (isProcessing.current || status !== 'idle') {
      console.log('Callback už sa spracováva alebo bol dokončený, ignorujem...');
      return;
    }

    isProcessing.current = true;
    try {
      console.log('Spracovávam Dropbox callback...');
      setStatus('loading');
      
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      console.log('Callback parametre:', { code, state, error });

             if (error) {
         console.error('Dropbox callback error:', error);
         setStatus('error');
         setMessage(`Chyba pri autentifikácii: ${error}`);
         return;
       }

             if (!code || !state) {
         console.error('Chýbajúce parametre:', { code, state });
         setStatus('error');
         setMessage('Chýbajúce parametre pre autentifikáciu');
         return;
       }

      console.log('Spracovávam OAuth callback...');
      
      // Spracovanie OAuth callback
      await dropboxService.handleAuthCallback(code, state);
      
      console.log('OAuth callback úspešný!');
      
      setStatus('success');
      setMessage('Úspešne ste sa prihlásili k Dropbox!');
      
                     // Presmeruje späť na dashboard s URL parametrom
        setTimeout(() => {
          console.log('Presmerovávam späť na dashboard s URL parametrom...');
          navigate('/dashboard?from_callback=true');
        }, 2000);

      } catch (error) {
        console.error('Error during Dropbox callback:', error);
        setStatus('error');
        setMessage('Chyba pri pripojení k Dropbox. Skúste to znova.');
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
                Pripájanie k Dropbox...
              </h2>
              <p className="text-gray-600">
                Spracovávame vašu autentifikáciu
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Úspešne pripojené!
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Presmerovávam vás späť...
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
                Späť
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DropboxCallback;
