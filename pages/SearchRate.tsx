
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { onSnapshot, addDoc, doc } from 'firebase/firestore';
import { auth, getRumsCol, getTastingsCol, db } from '../lib/firebase';
import { Rum, User } from '../types';
import { Search, Wine, Star, X, MapPin, ChevronDown } from 'lucide-react';

const SearchRate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = auth.currentUser;
  const userId = searchParams.get('userId');
  const navigate = useNavigate();

  const [rums, setRums] = useState<Rum[]>([]);
  const [filteredRums, setFilteredRums] = useState<Rum[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ 
    couleur: 'Toutes', 
    provenance: 'Toutes',
    stockSeul: true, 
    minDeg: '', 
    maxDeg: '' 
  });

  const [selectedRum, setSelectedRum] = useState<Rum | null>(null);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provenances, setProvenances] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    if (userId) {
      onSnapshot(doc(db, `users/${user.uid}/members`, userId), (snap) => {
        if (snap.exists()) setSelectedMember({ id: snap.id, ...snap.data() } as User);
      });
    }

    onSnapshot(getRumsCol(user.uid), (snapshot) => {
      const rumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rum));
      setRums(rumsData);
      const uniqueProv = Array.from(new Set(rumsData.map(r => r.provenance).filter(Boolean)));
      setProvenances(uniqueProv.sort());
    });
  }, [userId, user]);

  useEffect(() => {
    let result = rums.filter(r => r.nom.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filter.couleur !== 'Toutes') result = result.filter(r => r.couleur === filter.couleur);
    if (filter.provenance !== 'Toutes') result = result.filter(r => r.provenance === filter.provenance);
    if (filter.stockSeul) result = result.filter(r => r.enStock);
    
    const min = Number(filter.minDeg) || 0;
    const max = Number(filter.maxDeg) || 100;
    setFilteredRums(result.filter(r => r.degres >= min && r.degres <= max));
  }, [searchTerm, rums, filter]);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMember || !selectedRum || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(getTastingsCol(user.uid), {
        userId: selectedMember.id,
        rumId: selectedRum.id,
        note: rating,
        commentaire: comment,
        timestamp: new Date()
      });
      navigate(`/profile/${selectedMember.id}`);
    } catch (err) {
      alert("Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="bg-white p-6 rounded-[2rem] shadow-sm border border-amber-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-amber-950">
            <Wine className="text-amber-800" size={28} /> Dégustation
          </h1>
          <p className="text-sm text-amber-700 font-bold opacity-70">
            {selectedMember ? `Pour : ${selectedMember.prenom} ${selectedMember.nom}` : "Sélectionnez un membre"}
          </p>
        </div>
      </header>

      {/* Bloc de filtres ultra-compact */}
      <div className="bg-white p-5 rounded-[2rem] border border-amber-100 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-300" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un rhum..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-none bg-amber-50/50 outline-none focus:bg-amber-50 transition-all font-bold text-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[120px] relative">
            <select 
              value={filter.couleur} 
              onChange={(e) => setFilter({...filter, couleur: e.target.value})} 
              className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-amber-100/50 font-black text-[11px] uppercase text-amber-900 border-none outline-none appearance-none cursor-pointer"
            >
              <option value="Toutes">COULEUR : TOUTES</option>
              <option value="Blanc">Blanc</option>
              <option value="Ambré">Ambré</option>
              <option value="Vieux">Vieux</option>
              <option value="Dark">Dark</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-800 pointer-events-none" />
          </div>

          <div className="flex-1 min-w-[120px] relative">
            <select 
              value={filter.provenance} 
              onChange={(e) => setFilter({...filter, provenance: e.target.value})} 
              className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-amber-100/50 font-black text-[11px] uppercase text-amber-900 border-none outline-none appearance-none cursor-pointer"
            >
              <option value="Toutes">PROVENANCE : TOUTES</option>
              {provenances.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-800 pointer-events-none" />
          </div>

          <div className="flex items-center bg-amber-100/50 rounded-xl px-2">
            <input 
              type="number" 
              placeholder="Min %" 
              value={filter.minDeg} 
              onChange={(e) => setFilter({...filter, minDeg: e.target.value})} 
              className="w-16 bg-transparent py-2.5 text-[11px] font-black uppercase text-center outline-none"
            />
            <span className="text-amber-300 mx-1">-</span>
            <input 
              type="number" 
              placeholder="Max %" 
              value={filter.maxDeg} 
              onChange={(e) => setFilter({...filter, maxDeg: e.target.value})} 
              className="w-16 bg-transparent py-2.5 text-[11px] font-black uppercase text-center outline-none"
            />
          </div>

          <button 
            onClick={() => setFilter({...filter, stockSeul: !filter.stockSeul})} 
            className={`px-4 py-2.5 rounded-xl font-black text-[11px] uppercase transition-all active:scale-95 ${filter.stockSeul ? 'bg-amber-800 text-white shadow-md' : 'bg-amber-100/50 text-amber-800'}`}
          >
            {filter.stockSeul ? "En Stock" : "Tous"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRums.map(rum => (
          <div key={rum.id} onClick={() => setSelectedRum(rum)} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden ${selectedRum?.id === rum.id ? 'border-amber-800 bg-amber-50 scale-[0.98]' : 'bg-white border-transparent shadow-sm'}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-amber-950 group-hover:text-amber-800 transition-colors line-clamp-1">{rum.nom}</h3>
              <span className="text-[10px] bg-amber-100 px-2 py-1 rounded-md font-black text-amber-900 uppercase shrink-0 ml-2">{rum.degres}%</span>
            </div>
            <div className="flex items-center gap-3">
               <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest">{rum.couleur}</p>
               <div className="flex items-center gap-1 text-[9px] bg-amber-200/40 text-amber-900 px-2 py-0.5 rounded-full font-black uppercase">
                 <MapPin size={9} />
                 {rum.provenance}
               </div>
            </div>
          </div>
        ))}
        {filteredRums.length === 0 && (
          <div className="col-span-full py-12 text-center text-amber-400 font-bold italic bg-white/30 rounded-3xl border-2 border-dashed border-amber-100">
            Aucun flacon trouvé.
          </div>
        )}
      </div>

      {selectedRum && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative animate-in">
            <button onClick={() => setSelectedRum(null)} className="absolute top-8 right-8 text-amber-300 hover:text-amber-800 transition-colors"><X size={32} /></button>
            <div className="text-center mb-8">
              <p className="text-amber-600 font-black uppercase text-xs tracking-[0.2em] mb-2">Notation pour {selectedMember.prenom}</p>
              <h2 className="text-3xl font-black text-[#3d2b1f]">{selectedRum.nom}</h2>
            </div>
            <form onSubmit={handleSubmitRating} className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4 px-2">
                  <label className="font-black text-amber-900 uppercase text-sm">Verdict</label>
                  <span className="text-2xl font-black text-amber-800 bg-amber-50 px-4 py-1 rounded-2xl border border-amber-100">{rating}<span className="text-sm opacity-40">/10</span></span>
                </div>
                <input type="range" min="1" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-amber-800 h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  <span>Imbuvable</span>
                  <span>Moyen</span>
                  <span>Exceptionnel</span>
                </div>
              </div>
              <div>
                <label className="block font-black text-amber-900 uppercase text-sm mb-4 px-2">Commentaire de dégustation</label>
                <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Arômes, longueur en bouche, ressenti..." className="w-full p-6 rounded-2xl border bg-amber-50/20 outline-none focus:bg-white focus:border-amber-400 transition-all italic text-amber-900" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-amber-800 text-white rounded-2xl font-black text-lg shadow-2xl shadow-amber-800/40 active:scale-95 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Star size={24} className="fill-white" /> Enregistrer la note</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchRate;
