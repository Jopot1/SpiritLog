
import React from 'react';
import { HashRouter, Routes, Route, useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { Home as HomeIcon, Package, Search } from 'lucide-react';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Inventory from './pages/Inventory';
import SearchRate from './pages/SearchRate';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#f8f1e7] text-[#3d2b1f] flex flex-col font-sans">
      {/* Header Global avec Centrage Absolu par Grille */}
      <header className="bg-[#5d4037] text-white p-6 md:p-8 safe-top sticky top-0 z-50 shadow-lg grid grid-cols-3 items-center">
        <div className="flex justify-start">
          {/* Espace réservé pour l'équilibre à gauche */}
        </div>
        <div className="flex justify-center">
          <Link to="/" className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm active:scale-95 transition-transform whitespace-nowrap">
            SpiritLog
          </Link>
        </div>
        <div className="flex justify-end">
          {/* Espace réservé pour l'équilibre à droite */}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Navigation Basse */}
      <nav className="bg-white border-t border-amber-200 safe-bottom grid grid-cols-3 sticky bottom-0 z-50">
        <Link to="/" className={`flex flex-col items-center py-4 text-amber-900 active:bg-amber-50 ${isHomePage ? 'bg-amber-50 border-t-4 border-amber-700' : ''}`}>
          <HomeIcon size={28} />
          <span className="text-xs mt-1 font-bold uppercase tracking-wider">Accueil</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center py-4 text-amber-900 active:bg-amber-50 ${location.pathname.startsWith('/search') || location.pathname.startsWith('/rate') ? 'bg-amber-50 border-t-4 border-amber-700' : ''}`}>
          <Search size={28} />
          <span className="text-xs mt-1 font-bold uppercase tracking-wider">Déguster</span>
        </Link>
        <Link to="/inventory" className={`flex flex-col items-center py-4 text-amber-900 active:bg-amber-50 ${location.pathname === '/inventory' ? 'bg-amber-50 border-t-4 border-amber-700' : ''}`}>
          <Package size={28} />
          <span className="text-sm mt-1 font-bold uppercase tracking-wider">Cave</span>
        </Link>
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/search" element={<SearchRate />} />
          <Route path="/rate/:userId/:rumId" element={<SearchRate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
