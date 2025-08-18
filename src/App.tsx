import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import CompleteProfileModal from './components/CompleteProfileModal';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Services from './pages/Services';
import Clients from './pages/Clients';
import FAQ from './pages/FAQ';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AccountantDashboard from './pages/AccountantDashboard';

// Komponent pre automatické presmerovanie
function AutoRedirect({ isLoggedIn, userRole }: { isLoggedIn: boolean; userRole: 'admin' | 'accountant' | 'user' | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ak je používateľ prihlásený a nie je na dashboard stránke, presmeruj ho
    if (isLoggedIn && location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  }, [isLoggedIn, userRole, navigate, location.pathname]);

  return null;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'accountant' | 'user' | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [pendingAccountantEmail, setPendingAccountantEmail] = useState('');

  const handleLogin = (role: 'admin' | 'accountant' | 'user', email: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserEmail(email);
    // Automatické presmerovanie na dashboard sa rieši cez AutoRedirect komponent
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setUserEmail('');
  };

  const handleFirstTimeLogin = (email: string) => {
    setPendingAccountantEmail(email);
    setShowCompleteProfileModal(true);
  };

  const handleCompleteProfile = (profileData: {
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
  };

  return (
    <Router>
      <AutoRedirect isLoggedIn={isLoggedIn} userRole={userRole} />
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          isLoggedIn={isLoggedIn} 
          userRole={userRole} 
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              isLoggedIn ? (
                userRole === 'admin' ? <AdminDashboard /> : 
                userRole === 'accountant' ? <AccountantDashboard userEmail={userEmail} /> :
                <Dashboard userEmail={userEmail} />
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Pre prístup k dashboardu sa prihláste
                  </h2>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
                  >
                    Prihlásiť sa
                  </button>
                </div>
              )
            } />
          </Routes>
        </main>
        
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          onFirstTimeLogin={handleFirstTimeLogin}
        />

        <CompleteProfileModal
          isOpen={showCompleteProfileModal}
          onClose={() => {
            setShowCompleteProfileModal(false);
            setPendingAccountantEmail('');
          }}
          onComplete={handleCompleteProfile}
          userEmail={pendingAccountantEmail}
        />
      </div>
    </Router>
  );
}

export default App;
