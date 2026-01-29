
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { onSnapshot, addDoc, doc } from 'firebase/firestore';
import { auth, getRumsCol, getTastingsCol, db } from '../lib/firebase';
import { Rum, User } from '../types';
import { Search, Wine, Star, X } from 'lucide-react';

const SearchRate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const user = auth.currentUser;
  const userId = searchParams.get('userId');
  const navigate = useNavigate();

  const [rums, setRums] = useState<Rum[]>([]);
  const [filteredRums, setFilteredRums] = useState<Rum[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ couleur: 'Toutes', stockSeul: true, minDeg: '', maxDeg: '' });

  const [selectedRum, setSelectedRum] = useState<Rum | null>(null);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (userId) {
      onSnapshot(doc(db, `users/${user.uid}/members`, userId), (snap) => {
        if (snap.exists()) setSelectedMember({ id: snap.id, ...snap.data() } as User);
      });
    }

    onSnapshot(getRumsCol(user.uid), (snapshot) => {
      setRums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rum)));
    });
  }, [userId, user]);

  useEffect(() => {
    let result = rums.filter(r => r.nom.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filter.couleur !== 'Toutes') result = result.filter(r => r.couleur === filter.couleur);
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
    <div className="space-y-8 pb-20">
      <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100">
        <h1 className="text-3xl font-bold flex items-center gap-4">
          <Wine className="text-amber-800" size={32} /> Dégustation
        </h1>
        <p className="mt-2 text-amber-700 font-bold">
          {selectedMember ? `Pour : ${selectedMember.prenom} ${selectedMember.nom}` : "Sélectionnez un membre"}
        </p>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-amber-100 space-y-6">
        <input 
          type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 rounded-xl border bg-amber-50/30 outline-none"
        />
        <div className="flex flex-wrap gap-4">
          <select value={filter.couleur} onChange={(e) => setFilter({...filter, couleur: e.target.value})} className="flex-1 p-3 rounded-xl bg-amber-50 font-bold">
            <option>Toutes</option><option>Blanc</option><option>Ambré</option><option>Vieux</option><option>Dark</option>
          </select>
          <button onClick={() => setFilter({...filter, stockSeul: !filter.stockSeul})} className={`px-6 py-3 rounded-xl font-bold border-2 ${filter.stockSeul ? 'bg-amber-800 text-white' : 'bg-white text-amber-800'}`}>En Stock</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRums.map(rum => (
          <div key={rum.id} onClick={() => setSelectedRum(rum)} className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${selectedRum?.id === rum.id ? 'border-amber-800 bg-amber-50' : 'bg-white border-transparent shadow-sm'}`}>
            <h3 className="font-bold text-lg">{rum.nom}</h3>
            <p className="text-sm opacity-60">{rum.couleur} • {rum.degres}%</p>
          </div>
        ))}
      </div>

      {selectedRum && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative">
            <button onClick={() => setSelectedRum(null)} className="absolute top-8 right-8"><X size={32} /></button>
            <h2 className="text-3xl font-black mb-8 text-center">{selectedRum.nom}</h2>
            <form onSubmit={handleSubmitRating} className="space-y-8">
              <div>
                <label className="block font-bold mb-4">Note : {rating}/10</label>
                <input type="range" min="1" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-amber-800" />
              </div>
              <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Notes..." className="w-full p-6 rounded-2xl border bg-amber-50/20 outline-none" />
              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-amber-800 text-white rounded-2xl font-black">{isSubmitting ? "..." : "Valider"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchRate;
