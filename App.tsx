
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { Home as HomeIcon, Package, Search, Wine, LogOut, User as UserIcon } from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import SearchRate from './pages/SearchRate';
import Auth from './pages/Auth';

/**
 * Composant pour forcer le scroll en haut lors des changements de route
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Layout: React.FC<{ children: React.ReactNode, user: FirebaseUser | null }> = ({ children, user }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    if (confirm("Se déconnecter de SpiritLog ?")) {
      signOut(auth);
    }
  };

  if (!user) return <div className="min-h-screen bg-[#f8f1e7] p-4 flex items-center justify-center">{children}</div>;

  return (
    <div className="min-h-screen bg-[#f8f1e7] text-[#3d2b1f] flex flex-col font-sans">
      <header className="bg-[#5d4037] text-white p-6 md:p-8 safe-top sticky top-0 z-50 shadow-lg grid grid-cols-3 items-center">
        <div className="flex justify-start">
           <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/5">
              <UserIcon size={18} className="text-amber-200" />
              <span className="text-sm font-bold hidden sm:inline">{user.displayName?.split(' ')[0]}</span>
           </div>
        </div>
        
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
            <div className="bg-white p-1 rounded-xl shadow-inner flex items-center justify-center overflow-hidden h-12 w-12 border border-white/20 transition-colors">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-full w-full object-contain" 
                  onError={() => setLogoError(true)} 
                />
              ) : (
                <Wine size={24} className="text-[#5d4037]" />
              )}
            </div>
            <span className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm whitespace-nowrap">
              SpiritLog
            </span>
          </Link>
        </div>
        
        <div className="flex justify-end">
          <button onClick={handleLogout} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      <nav className="bg-white border-t border-amber-200 safe-bottom grid grid-cols-3 sticky bottom-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <Link to="/" className={`flex flex-col items-center py-4 text-amber-900 active:bg-amber-50 transition-all ${isHomePage ? 'bg-amber-50 border-t-4 border-amber-700' : 'opacity-60'}`}>
          <HomeIcon size={28} />
          <span className="text-xs mt-1 font-bold uppercase tracking-wider">Accueil</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center py-4 text-amber-900 active:bg-amber-50 transition-all ${location.pathname.startsWith('/search') || location.pathname.startsWith('/rate') ? 'bg-amber-50 border-t-4 border-amber-700' : 'opacity-60'}`}>
          <Search size={28} />
          <span className="text-xs mt-1 font-bold uppercase tracking-wider">Déguster</span>
        </Link>
        <Link to="/inventory" className={`flex flex-col items-center py-4 text-amber-900 active:bg-amber-50 transition-all ${location.pathname === '/inventory' ? 'bg-amber-50 border-t-4 border-amber-700' : 'opacity-60'}`}>
          <Package size={28} />
          <span className="text-xs mt-1 font-bold uppercase tracking-wider">Cave</span>
        </Link>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // Forcer le scroll en haut lors du changement d'état d'authentification
      window.scrollTo(0, 0);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f1e7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-800"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <Layout user={user}>
        <Routes>
          {!user ? (
            <Route path="*" element={<Auth />} />
          ) : (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/search" element={<SearchRate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
