
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onSnapshot, query, where, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, getTastingsCol } from '../lib/firebase';
import { User, TastingWithDetails, Rum } from '../types';
import { Star, MessageSquare, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [member, setMember] = useState<User | null>(null);
  const [tastings, setTastings] = useState<TastingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTasting, setEditingTasting] = useState<TastingWithDetails | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userId || !user) return;

    // Get Member Data
    const memberRef = doc(db, `users/${user.uid}/members`, userId);
    const unsubscribeMember = onSnapshot(memberRef, (snap) => {
      if (snap.exists()) setMember({ id: snap.id, ...snap.data() } as User);
    });

    // Get Tastings
    const q = query(getTastingsCol(user.uid), where("userId", "==", userId));
    const unsubscribeTastings = onSnapshot(q, async (snapshot) => {
      const promises = snapshot.docs.map(async (tDoc) => {
        const data = tDoc.data();
        const rumRef = doc(db, `users/${user.uid}/rums`, data.rumId);
        const rumDoc = await getDoc(rumRef);
        if (rumDoc.exists()) {
          const rumData = rumDoc.data() as Rum;
          return { id: tDoc.id, ...data, rumName: rumData.nom, rumCouleur: rumData.couleur, rumDegres: rumData.degres } as TastingWithDetails;
        }
        return null;
      });
      const res = await Promise.all(promises);
      setTastings(res.filter(r => r !== null).sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      setLoading(false);
    });

    return () => { unsubscribeMember(); unsubscribeTastings(); };
  }, [userId, user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    setIsProcessing(true);
    await deleteDoc(doc(db, `users/${user.uid}/tastings`, id));
    setDeletingId(null);
    setIsProcessing(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTasting || !user) return;
    setIsProcessing(true);
    await updateDoc(doc(db, `users/${user.uid}/tastings`, editingTasting.id), {
      note: editingTasting.note,
      commentaire: editingTasting.commentaire
    });
    setEditingTasting(null);
    setIsProcessing(false);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-amber-800 font-bold">Chargement...</div>;
  if (!member) return <div className="p-8 text-center bg-white rounded-3xl">Membre introuvable.</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-3xl uppercase">
            {member.prenom[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{member.prenom} {member.nom}</h1>
            <p className="text-amber-600">{tastings.length} dégustations enregistrées</p>
          </div>
        </div>
        <button onClick={() => navigate(`/search?userId=${member.id}`)} className="bg-amber-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg">Noter un rhum</button>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#3d2b1f]">
          <Star className="text-amber-500 fill-amber-500" /> Historique
        </h2>
        <div className="space-y-6">
          {tastings.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-amber-50 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="text-2xl font-bold">{t.rumName}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTasting(t)} className="p-2 text-amber-600 bg-amber-50 rounded-xl"><Edit2 size={20} /></button>
                    <button onClick={() => setDeletingId(t.id)} className="p-2 text-red-600 bg-red-50 rounded-xl"><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="flex gap-2 my-2 text-sm font-bold text-amber-700">
                  <span className="bg-amber-50 px-3 py-1 rounded-lg">{t.rumCouleur}</span>
                  <span className="bg-amber-50 px-3 py-1 rounded-lg">{t.rumDegres}%</span>
                </div>
                <p className="bg-amber-50/30 p-4 rounded-2xl italic">{t.commentaire || "Aucun commentaire"}</p>
              </div>
              <div className="md:w-32 text-center border-t md:border-t-0 md:border-l border-amber-50 pt-4 md:pt-0">
                <span className="text-4xl font-black text-amber-800">{t.note}<span className="text-xl opacity-30">/10</span></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Same Modals as before but logic is updated to use auth.currentUser.uid */}
      {editingTasting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative">
            <button onClick={() => setEditingTasting(null)} className="absolute top-8 right-8 text-gray-400"><X size={32} /></button>
            <h2 className="text-2xl font-black mb-10">Modifier la note</h2>
            <form onSubmit={handleUpdate} className="space-y-8">
               <div>
                  <label className="block font-bold mb-4">Note : {editingTasting.note}/10</label>
                  <input type="range" min="1" max="10" value={editingTasting.note} onChange={(e) => setEditingTasting({...editingTasting, note: Number(e.target.value)})} className="w-full accent-amber-800" />
               </div>
               <textarea rows={4} value={editingTasting.commentaire || ''} onChange={(e) => setEditingTasting({...editingTasting, commentaire: e.target.value})} className="w-full p-6 rounded-2xl border bg-amber-50/20 outline-none" />
               <button type="submit" disabled={isProcessing} className="w-full py-5 bg-amber-800 text-white rounded-2xl font-black">{isProcessing ? "..." : "Enregistrer"}</button>
            </form>
          </div>
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center">
            <h3 className="text-2xl font-black mb-8">Supprimer ?</h3>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-2xl">Non</button>
              <button onClick={() => handleDelete(deletingId)} disabled={isProcessing} className="flex-1 py-4 font-bold text-white bg-red-600 rounded-2xl">{isProcessing ? "..." : "Supprimer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
