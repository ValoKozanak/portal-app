import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Chýba verification token');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        if (data.error.includes('vypršal')) {
          setStatus('expired');
          setMessage(data.error);
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('Chyba pri overovaní emailu');
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setMessage('Zadajte svoj email');
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Nový verification email bol odoslaný');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Chyba pri odosielaní emailu');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Overujem email...</h2>
            <p className="text-gray-600">Prosím počkajte, overujeme váš email.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email úspešne overený!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Prihlásiť sa
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chyba pri overovaní</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Registrovať sa znova
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Odkaz vypršal</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Požiadať o nový verification email</h3>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Zadajte svoj email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? 'Odosielam...' : 'Odoslať nový email'}
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Registrovať sa znova
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <EnvelopeIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Overenie emailu
          </h1>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {getStatusContent()}
        </div>

        {message && status !== 'loading' && (
          <div className={`p-4 rounded-lg ${
            status === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : status === 'expired'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
