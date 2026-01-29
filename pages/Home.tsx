
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Wine, List, User as UserIcon, ChevronRight, LayoutDashboard, MapPin } from 'lucide-react';
import { onSnapshot, addDoc } from 'firebase/firestore';
import { auth, getMembersCol, getRumsCol } from '../lib/firebase';
import { User } from '../types';

const Home: React.FC = () => {
  const user = auth.currentUser;
  const [members, setMembers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddRum, setShowAddRum] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', prenom: '' });
  
  const [newRum, setNewRum] = useState({ 
    nom: '', 
    couleur: 'Ambré', 
    degres: '40', 
    provenance: '',
    enStock: true, 
    description: '' 
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(getMembersCol(user.uid), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setMembers(membersData);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newUser.nom.trim() || !newUser.prenom.trim() || loading) return;
    
    setLoading(true);
    const newNomPrenom = `${newUser.nom.trim()}_${newUser.prenom.trim()}`.toLowerCase();
    const alreadyExists = members.some(u => u.nom_prenom === newNomPrenom);

    if (alreadyExists) {
      alert("Cette personne est déjà inscrite !");
      setLoading(false);
      return;
    }

    try {
      await addDoc(getMembersCol(user.uid), {
        nom: newUser.nom.trim(),
        prenom: newUser.prenom.trim(),
        nom_prenom: newNomPrenom
      });
      setNewUser({ nom: '', prenom: '' });
      setShowAddUser(false);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRum.nom.trim() || !newRum.provenance.trim() || loading) return;
    
    setLoading(true);
    try {
      await addDoc(getRumsCol(user.uid), {
        nom: newRum.nom.trim(),
        couleur: newRum.couleur,
        degres: parseFloat(newRum.degres) || 0,
        provenance: newRum.provenance.trim(),
        enStock: newRum.enStock,
        description: (newRum.description || '').trim() || null
      });
      setNewRum({ nom: '', couleur: 'Ambré', degres: '40', provenance: '', enStock: true, description: '' });
      setShowAddRum(false);
      setTimeout(() => navigate('/inventory'), 100);
    } catch (err: any) {
      alert("Erreur : " + err.message);
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
        <button onClick={() => setShowAddUser(true)} className="flex-1 min-w-[150px] bg-amber-700 text-white p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 active:scale-95 transition-all">
          <UserPlus size={36} />
          <span className="font-bold text-lg text-center">Nouveau Membre</span>
        </button>
        <button onClick={() => setShowAddRum(true)} className="flex-1 min-w-[150px] bg-amber-800 text-white p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 active:scale-95 transition-all">
          <Wine size={36} />
          <span className="font-bold text-lg text-center">Nouveau Rhum</span>
        </button>
        <button onClick={() => navigate('/inventory')} className="flex-1 min-w-[150px] bg-[#5d4037] text-white p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 active:scale-95 transition-all">
          <List size={36} />
          <span className="font-bold text-lg text-center">La Cave</span>
        </button>
      </div>

      <section className="pt-4">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 px-2 text-[#3d2b1f]">
          <UserIcon className="text-amber-800" size={28} /> Votre Cercle de Dégustation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(m => (
            <div key={m.id} onClick={() => navigate(`/profile/${m.id}`)} className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 flex items-center justify-between cursor-pointer active:bg-amber-50 transition-colors hover:shadow-md">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-2xl uppercase">
                  {m.prenom[0]}
                </div>
                <div><p className="font-bold text-xl">{m.prenom} {m.nom}</p></div>
              </div>
              <ChevronRight className="text-amber-200" size={28} />
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-amber-600 italic px-4">Ajoutez les personnes qui participeront à vos sessions.</p>
          )}
        </div>
      </section>

      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-8">Nouvelle Personne</h3>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Prénom</label>
                <input autoFocus type="text" value={newUser.prenom} onChange={(e) => setNewUser({...newUser, prenom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-100 bg-amber-50/30 outline-none text-lg" required />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Nom</label>
                <input type="text" value={newUser.nom} onChange={(e) => setNewUser({...newUser, nom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-100 bg-amber-50/30 outline-none text-lg" required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 py-5 font-bold text-amber-900 bg-amber-100 rounded-2xl">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-5 font-bold text-white bg-amber-700 rounded-2xl shadow-lg disabled:opacity-50">{loading ? "..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRum && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-bold mb-8">Ajouter un Rhum</h3>
            <form onSubmit={handleAddRum} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Nom du flacon</label>
                <input autoFocus type="text" value={newRum.nom} onChange={(e) => setNewRum({...newRum, nom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Couleur</label>
                  <select value={newRum.couleur} onChange={(e) => setNewRum({...newRum, couleur: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 bg-white outline-none text-lg">
                    <option>Blanc</option><option>Ambré</option><option>Vieux</option><option>Dark</option><option>Épicé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Degrés (%)</label>
                  <input type="number" step="0.1" value={newRum.degres} onChange={(e) => setNewRum({...newRum, degres: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Provenance</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-300" size={20} />
                  <input type="text" value={newRum.provenance} onChange={(e) => setNewRum({...newRum, provenance: e.target.value})} className="w-full pl-12 pr-6 py-5 rounded-2xl border border-amber-200 outline-none text-lg" placeholder="Ex: Martinique" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Description (Facultatif)</label>
                <textarea value={newRum.description} onChange={(e) => setNewRum({...newRum, description: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg resize-none" rows={3} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddRum(false)} className="flex-1 py-5 font-bold text-amber-900 bg-amber-100 rounded-2xl">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 py-5 font-bold text-white bg-amber-800 rounded-2xl shadow-lg">{loading ? "..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
