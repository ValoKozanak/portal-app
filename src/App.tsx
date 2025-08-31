import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginModal from './components/LoginModal';
import CompleteProfileModal from './components/CompleteProfileModal';
import LoadingSpinner from './components/LoadingSpinner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDarkMode } from './hooks/useDarkMode';
import { apiService } from './services/apiService';
import Navbar from './components/Navbar';

// Code splitting pre pages - lazy loading
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Services = React.lazy(() => import('./pages/Services'));
const Clients = React.lazy(() => import('./pages/Clients'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AccountantDashboard = React.lazy(() => import('./pages/AccountantDashboard'));
const EmployeeDashboard = React.lazy(() => import('./pages/EmployeeDashboard'));
const AccountingPage = React.lazy(() => import('./pages/AccountingPage'));
const FinancialAnalysisPage = React.lazy(() => import('./pages/FinancialAnalysisPage'));
const IssuedInvoicesPage = React.lazy(() => import('./components/IssuedInvoicesPage'));
const ReceivedInvoicesPage = React.lazy(() => import('./pages/ReceivedInvoicesPage'));

const CashPage = React.lazy(() => import('./pages/CashPage'));
const CashTransactionsPage = React.lazy(() => import('./pages/CashTransactionsPage'));
const BankPage = React.lazy(() => import('./pages/BankPage'));
const BankTransactionsPage = React.lazy(() => import('./pages/BankTransactionsPage'));
const DirectoryPage = React.lazy(() => import('./pages/DirectoryPage'));
const VatReturnsPage = React.lazy(() => import('./pages/VatReturnsPage'));
const InvoiceDetailPage = React.lazy(() => import('./pages/InvoiceDetailPage'));
const DropboxCallback = React.lazy(() => import('./pages/DropboxCallback'));


// Loading komponent pre Suspense
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[400px]">
    <LoadingSpinner size="lg" />
  </div>
);

// Komponent pre automatické presmerovanie
const AutoRedirect = React.memo(({ isLoggedIn, userRole }: { isLoggedIn: boolean; userRole: 'admin' | 'accountant' | 'user' | 'employee' | null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ak je používateľ prihlásený a nie je na dashboard stránke, presmeruj ho
    // Ale nepresmerovávaj, ak je na dropbox-callback stránke, accounting stránkach alebo detail faktúry
    if (isLoggedIn && 
        location.pathname !== '/dashboard' && 
        location.pathname !== '/dropbox-callback' && 
        !location.pathname.startsWith('/accounting') &&
        !location.pathname.startsWith('/test-accounting') &&
        !location.pathname.startsWith('/invoice/')) {
      navigate('/dashboard');
    }
  }, [isLoggedIn, userRole, navigate, location.pathname]);

  return null;
});

function App() {
  // Používame localStorage hook pre perzistentné dáta
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('isLoggedIn', false);
  const [userRole, setUserRole] = useLocalStorage<'admin' | 'accountant' | 'user' | 'employee' | null>('userRole', null);
  const [userEmail, setUserEmail] = useLocalStorage('userEmail', '');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [pendingAccountantEmail, setPendingAccountantEmail] = useState('');

  // Inicializácia dark mode
  useDarkMode();

  // Inicializácia tokenu z localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
  }, []);

  // Performance monitoring a Service Worker sú automaticky inicializované
  // ale momentálne ich nepoužívame v UI

  const handleLogin = useCallback((role: 'admin' | 'accountant' | 'user' | 'employee', email: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserEmail(email);
    // Automatické presmerovanie na dashboard sa rieši cez AutoRedirect komponent
  }, [setIsLoggedIn, setUserRole, setUserEmail]);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUserEmail('');
    apiService.clearToken();
    // Vyčistíme vybranú firmu pri odhlásení
    localStorage.removeItem('selectedCompanyId');
  }, [setIsLoggedIn, setUserRole, setUserEmail]);

  const handleFirstTimeLogin = useCallback((email: string) => {
    setPendingAccountantEmail(email);
    setShowCompleteProfileModal(true);
  }, []);

  const handleCompleteProfile = useCallback((profileData: {
    name: string;
    email: string;
    phone: string;
    department: string;
    password: string;
    confirmPassword: string;
  }) => {
    // Označ profil ako dokončený
    localStorage.setItem(`accountant_${profileData.email}_profile_completed`, 'true');
    
    // Ulož údaje účtovníka
    localStorage.setItem(`accountant_${profileData.email}_profile`, JSON.stringify({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      department: profileData.department,
      password: profileData.password // V reálnej aplikácii by sa heslo hashovalo
    }));

    // Prihlás účtovníka
    setIsLoggedIn(true);
    setUserRole('accountant');
    setUserEmail(profileData.email);
    setShowCompleteProfileModal(false);
    setPendingAccountantEmail('');
  }, [setIsLoggedIn, setUserRole, setUserEmail]);

  // Memoizované hodnoty pre lepší výkon
  const dashboardElement = useMemo(() => {
    if (!isLoggedIn) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Pre prístup k dashboardu sa prihláste
          </h2>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
          >
            Prihlásiť sa
          </button>
        </div>
      );
    }

    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'accountant':
        return <AccountantDashboard userEmail={userEmail} />;
      case 'employee':
        return <EmployeeDashboard userEmail={userEmail} userRole={userRole} />;
      default:
        return <Dashboard userEmail={userEmail} />;
    }
  }, [isLoggedIn, userRole, userEmail, setShowLoginModal]);

  const handleCloseCompleteProfile = useCallback(() => {
    setShowCompleteProfileModal(false);
    setPendingAccountantEmail('');
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AutoRedirect isLoggedIn={isLoggedIn} userRole={userRole} />
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
          <Navbar 
            isLoggedIn={isLoggedIn} 
            userRole={userRole} 
            onLoginClick={() => setShowLoginModal(true)}
            onLogout={handleLogout}
          />
          <main className="container mx-auto px-4 py-8">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={dashboardElement} />
                <Route path="/accounting" element={<AccountingPage />} />
                <Route path="/accounting/financial-analysis/:companyId" element={<FinancialAnalysisPage />} />
                <Route path="/accounting/issued-invoices/:companyId" element={<IssuedInvoicesPage />} />
                <Route path="/accounting/issued-invoices" element={<IssuedInvoicesPage />} />
                <Route path="/accounting/received-invoices/:companyId" element={<ReceivedInvoicesPage />} />
                <Route path="/accounting/received-invoices" element={<ReceivedInvoicesPage />} />
                <Route path="/accounting/vat-returns/:companyId" element={<VatReturnsPage />} />
                <Route path="/accounting/cash/:companyId" element={<CashPage />} />
                <Route path="/accounting/cash/:companyId/transactions/:accountNumber" element={<CashTransactionsPage />} />
                <Route path="/accounting/bank/:companyId" element={<BankPage />} />
                <Route path="/accounting/bank/:companyId/transactions/:accountNumber" element={<BankTransactionsPage />} />
                <Route path="/accounting/directory" element={<DirectoryPage />} />
                <Route path="/invoice/:type/:id" element={<InvoiceDetailPage />} />
                <Route path="/dropbox-callback" element={
                  (() => {
                
                    return <DropboxCallback />;
                  })()
                } />

              </Routes>
            </Suspense>
          </main>
          
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={handleLogin}
            onFirstTimeLogin={handleFirstTimeLogin}
          />

          <CompleteProfileModal
            isOpen={showCompleteProfileModal}
            onClose={handleCloseCompleteProfile}
            onComplete={handleCompleteProfile}
            userEmail={pendingAccountantEmail}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
