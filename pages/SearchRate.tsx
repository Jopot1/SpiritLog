
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { onSnapshot, addDoc, doc } from 'firebase/firestore';
import { rumsCol, tastingsCol, db } from '../lib/firebase';
import { Rum, User } from '../types';
import { Search, Wine, Star, X } from 'lucide-react';

const SearchRate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const navigate = useNavigate();

  const [rums, setRums] = useState<Rum[]>([]);
  const [filteredRums, setFilteredRums] = useState<Rum[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ 
    couleur: 'Toutes', 
    stockSeul: true, 
    minDeg: 0, 
    maxDeg: 100 
  });

  const [selectedRum, setSelectedRum] = useState<Rum | null>(null);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsubscribeUser = () => {};
    if (userId) {
      unsubscribeUser = onSnapshot(doc(db, 'users', userId), (snap) => {
        if (snap.exists()) {
          setSelectedUser({ id: snap.id, ...snap.data() } as User);
        }
      });
    }

    const unsubscribeRums = onSnapshot(rumsCol, (snapshot) => {
      const rumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rum));
      setRums(rumsData);
    });

    return () => {
      unsubscribeUser();
      unsubscribeRums();
    };
  }, [userId]);

  useEffect(() => {
    let result = rums.filter(r => 
      r.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filter.couleur !== 'Toutes') result = result.filter(r => r.couleur === filter.couleur);
    if (filter.stockSeul) result = result.filter(r => r.enStock);
    result = result.filter(r => r.degres >= filter.minDeg && r.degres <= filter.maxDeg);
    setFilteredRums(result);
  }, [searchTerm, rums, filter]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRum || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      addDoc(tastingsCol, {
        userId: selectedUser.id,
        rumId: selectedRum.id,
        note: rating,
        commentaire: comment,
        timestamp: new Date()
      });
      navigate(`/profile/${selectedUser.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 transition-all">
        <h1 className="text-3xl font-bold flex items-center gap-4 text-[#3d2b1f]">
          <Wine className="text-amber-800" size={32} />
          Dégustation
        </h1>
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-amber-700 font-medium">
            {selectedUser ? `Session pour : ${selectedUser.prenom} ${selectedUser.nom}` : "Sélectionnez un membre pour noter"}
          </p>
          {!selectedUser && (
            <button onClick={() => navigate('/')} className="text-amber-800 font-bold bg-amber-50 px-6 py-2 rounded-xl border border-amber-200 active:scale-95 transition-all text-sm shadow-sm self-start">Choisir un membre</button>
          )}
        </div>
      </header>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 space-y-8">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-300" size={28} />
          <input 
            type="text" 
            placeholder="Rechercher par nom..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 rounded-2xl border border-amber-100 bg-amber-50/30 focus:bg-white focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-xl"
          />
        </div>

        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-black text-amber-800 uppercase mb-2 px-1">Couleur</label>
            <select value={filter.couleur} onChange={(e) => setFilter({...filter, couleur: e.target.value})} className="w-full p-4 rounded-2xl bg-amber-50 border-none outline-none font-bold text-amber-900 shadow-inner">
              <option>Toutes</option><option>Blanc</option><option>Ambré</option><option>Vieux</option><option>Dark</option><option>Épicé</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-black text-amber-800 uppercase mb-2 px-1">Degrés (%)</label>
            <div className="flex gap-3">
              <input type="number" value={filter.minDeg} onChange={(e) => setFilter({...filter, minDeg: Number(e.target.value)})} placeholder="Min" className="w-full p-4 rounded-2xl bg-amber-50 border-none outline-none font-bold text-amber-900 shadow-inner" />
              <input type="number" value={filter.maxDeg} onChange={(e) => setFilter({...filter, maxDeg: Number(e.target.value)})} placeholder="Max" className="w-full p-4 rounded-2xl bg-amber-50 border-none outline-none font-bold text-amber-900 shadow-inner" />
            </div>
          </div>
          <button onClick={() => setFilter({...filter, stockSeul: !filter.stockSeul})} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all border-4 ${filter.stockSeul ? 'bg-amber-800 border-amber-800 text-white' : 'bg-white border-amber-100 text-amber-800'} shadow-lg`}>
            {filter.stockSeul ? "En Stock" : "Tout"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRums.map(rum => (
          <div key={rum.id} onClick={() => setSelectedRum(rum)} className={`p-6 rounded-[2rem] border-4 transition-all cursor-pointer active:scale-95 flex items-center justify-between shadow-sm ${selectedRum?.id === rum.id ? 'bg-amber-50 border-amber-800 shadow-inner' : 'bg-white border-transparent hover:border-amber-100'}`}>
            <div className="flex items-center gap-5">
              <div className="p-4 bg-amber-100 rounded-2xl text-amber-800 shadow-sm"><Wine size={30} /></div>
              <div><h3 className="font-bold text-xl">{rum.nom}</h3><p className="text-amber-700 font-medium">{rum.couleur} • {rum.degres}%</p></div>
            </div>
            {!rum.enStock && <span className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-black uppercase">Épuisé</span>}
          </div>
        ))}
      </div>

      {selectedRum && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl relative">
            <button onClick={() => setSelectedRum(null)} className="absolute top-8 right-8 p-3 bg-amber-50 rounded-full text-amber-900"><X size={32} /></button>
            <header className="mb-10 text-center">
              <div className="inline-block p-6 bg-amber-100 rounded-[2.5rem] text-amber-800 mb-6 shadow-sm"><Wine size={64} /></div>
              <h2 className="text-4xl font-black tracking-tight">{selectedRum.nom}</h2>
              <p className="text-amber-700 font-bold text-lg mt-2">Dégustation par {selectedUser.prenom}</p>
            </header>
            <form onSubmit={handleSubmitRating} className="space-y-10">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <label className="text-2xl font-black">Note : {rating}/10</label>
                  <div className="flex gap-2">
                    {[...Array(10)].map((_, i) => (
                      <Star key={i} size={32} className={`cursor-pointer transition-all ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-amber-100'}`} onClick={() => setRating(i + 1)} />
                    ))}
                  </div>
                </div>
                <input type="range" min="1" max="10" step="1" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full h-4 bg-amber-100 rounded-2xl appearance-none cursor-pointer accent-amber-700" />
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest text-amber-800 mb-3 px-2">Notes de dégustation</label>
                <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Arômes, saveurs, corps..." className="w-full p-8 rounded-[2rem] border-2 border-amber-100 bg-amber-50/20 focus:bg-white focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-xl resize-none shadow-inner" />
              </div>
              <div className="flex gap-6">
                <button type="button" onClick={() => setSelectedRum(null)} className="flex-1 py-6 font-black text-amber-900 bg-amber-100 rounded-3xl text-xl">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-6 font-black text-white bg-amber-800 rounded-3xl text-xl shadow-xl shadow-amber-800/30 active:scale-95 disabled:opacity-50">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchRate;
