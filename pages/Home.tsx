
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Wine, List, User as UserIcon, ChevronRight, LayoutDashboard } from 'lucide-react';
import { onSnapshot, addDoc } from 'firebase/firestore';
import { usersCol, rumsCol } from '../lib/firebase';
import { User } from '../types';

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRum, setShowAddRum] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', prenom: '' });
  const [newRum, setNewRum] = useState({ nom: '', couleur: 'Ambré', degres: 40, enStock: true });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nom || !newUser.prenom || loading) return;
    setLoading(true);
    const newNomPrenom = `${newUser.nom}_${newUser.prenom}`.toLowerCase();
    const alreadyExists = users.some(u => u.nom_prenom === newNomPrenom);

    if (alreadyExists) {
      alert("Cette personne est déjà inscrite !");
      setLoading(false);
      return;
    }

    try {
      addDoc(usersCol, {
        nom: newUser.nom,
        prenom: newUser.prenom,
        nom_prenom: newNomPrenom
      });
      setNewUser({ nom: '', prenom: '' });
      setShowAddUser(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRum.nom || loading) return;
    setLoading(true);
    try {
      addDoc(rumsCol, newRum);
      setNewRum({ nom: '', couleur: 'Ambré', degres: 40, enStock: true });
      setShowAddRum(false);
      navigate('/inventory');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 mt-4">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-[#3d2b1f]">
          <LayoutDashboard className="text-amber-800" size={28} />
          Tableau de Bord
        </h1>
        <p className="text-amber-700 mt-1 font-medium">Gérez vos membres et votre collection</p>
      </header>

      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setShowAddUser(true)}
          className="flex-1 min-w-[150px] bg-amber-700 text-white p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 active:scale-95 transition-all"
        >
          <UserPlus size={36} />
          <span className="font-bold text-lg">Nouveau Membre</span>
        </button>
        <button 
          onClick={() => setShowAddRum(true)}
          className="flex-1 min-w-[150px] bg-amber-800 text-white p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 active:scale-95 transition-all"
        >
          <Wine size={36} />
          <span className="font-bold text-lg">Nouveau Rhum</span>
        </button>
        <button 
          onClick={() => navigate('/inventory')}
          className="flex-1 min-w-[150px] bg-[#5d4037] text-white p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 active:scale-95 transition-all"
        >
          <List size={36} />
          <span className="font-bold text-lg">La Cave</span>
        </button>
      </div>

      <section className="pt-4">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 px-2">
          <UserIcon className="text-amber-800" size={28} /> Membres Actifs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div 
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between cursor-pointer active:bg-amber-50 transition-colors hover:shadow-md"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-2xl uppercase">
                  {user.prenom[0]}
                </div>
                <div>
                  <p className="font-bold text-xl">{user.prenom} {user.nom}</p>
                </div>
              </div>
              <ChevronRight className="text-amber-200" size={28} />
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-amber-600 italic px-4">Aucun membre inscrit pour le moment.</p>
          )}
        </div>
      </section>

      {/* Modals */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Nouvelle Personne</h3>
            <form onSubmit={handleAddUser} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Prénom</label>
                <input autoFocus type="text" value={newUser.prenom} onChange={(e) => setNewUser({...newUser, prenom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none text-lg" placeholder="Jean" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Nom</label>
                <input type="text" value={newUser.nom} onChange={(e) => setNewUser({...newUser, nom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none text-lg" placeholder="Dupont" required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 py-5 font-bold text-amber-900 bg-amber-100 rounded-2xl">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-5 font-bold text-white bg-amber-700 rounded-2xl shadow-lg disabled:opacity-50">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRum && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Ajouter un Rhum</h3>
            <form onSubmit={handleAddRum} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Nom du flacon</label>
                <input autoFocus type="text" value={newRum.nom} onChange={(e) => setNewRum({...newRum, nom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none text-lg" placeholder="Don Papa..." required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Couleur</label>
                <select value={newRum.couleur} onChange={(e) => setNewRum({...newRum, couleur: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 bg-white outline-none text-lg">
                  <option>Blanc</option><option>Ambré</option><option>Vieux</option><option>Dark</option><option>Épicé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Degrés (%)</label>
                <input type="number" inputMode="decimal" value={newRum.degres} onChange={(e) => setNewRum({...newRum, degres: Number(e.target.value)})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg" required />
              </div>
              <div className="flex items-center justify-between p-5 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="font-bold text-amber-900">En stock</span>
                <button type="button" onClick={() => setNewRum({...newRum, enStock: !newRum.enStock})} className={`w-16 h-9 flex items-center rounded-full p-1 transition-colors ${newRum.enStock ? 'bg-amber-600' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-7 h-7 rounded-full shadow-md transform transition-transform ${newRum.enStock ? 'translate-x-7' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddRum(false)} className="flex-1 py-5 font-bold text-amber-900 bg-amber-100 rounded-2xl">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-5 font-bold text-white bg-amber-800 rounded-2xl shadow-lg">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
