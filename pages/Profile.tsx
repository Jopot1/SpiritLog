
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onSnapshot, query, where, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, tastingsCol } from '../lib/firebase';
import { User, TastingWithDetails, Rum } from '../types';
import { Star, MessageSquare, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [tastings, setTastings] = useState<TastingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTasting, setEditingTasting] = useState<TastingWithDetails | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const unsubscribeUser = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, ...docSnap.data() } as User);
      }
    });

    const q = query(tastingsCol, where("userId", "==", userId));
    const unsubscribeTastings = onSnapshot(q, async (snapshot) => {
      const promises = snapshot.docs.map(async (tastingDoc) => {
        const data = tastingDoc.data();
        const rumDoc = await getDoc(doc(db, 'rums', data.rumId));
        if (rumDoc.exists()) {
          const rumData = rumDoc.data() as Rum;
          return {
            id: tastingDoc.id,
            userId: data.userId,
            rumId: data.rumId,
            note: data.note,
            commentaire: data.commentaire,
            rumName: rumData.nom,
            rumCouleur: rumData.couleur,
            rumDegres: rumData.degres,
            timestamp: data.timestamp
          } as TastingWithDetails;
        }
        return null;
      });

      const results = await Promise.all(promises);
      const filteredResults = results.filter((r): r is TastingWithDetails => r !== null);
      
      // Tri par date (plus récent en haut) ou par note
      setTastings(filteredResults.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      }));
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTastings();
    };
  }, [userId]);

  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, 'tastings', id));
      setDeletingId(null);
    } catch (err) {
      alert("Erreur lors de la suppression");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTasting) return;
    setIsProcessing(true);
    try {
      const tastingRef = doc(db, 'tastings', editingTasting.id);
      await updateDoc(tastingRef, {
        note: editingTasting.note,
        commentaire: editingTasting.commentaire
      });
      setEditingTasting(null);
    } catch (err) {
      alert("Erreur lors de la modification");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800"></div>
      <p className="text-amber-800 animate-pulse font-medium">Chargement du profil...</p>
    </div>
  );
  
  if (!user) return (
    <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-amber-100">
      <p className="text-xl font-bold text-amber-900 mb-4">Oups ! Membre introuvable.</p>
      <button onClick={() => navigate('/')} className="text-amber-700 underline font-bold">Retour à l'accueil</button>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in">
      {/* Header Profil */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-amber-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-amber-700"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-3xl uppercase shadow-inner">
              {user.prenom[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3d2b1f]">{user.prenom} {user.nom}</h1>
              <p className="text-amber-600 font-medium">Expert Dégustateur • {tastings.length} notes</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/search?userId=${user.id}`)}
            className="flex items-center justify-center gap-2 bg-amber-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            <Plus size={20} />
            Noter un rhum
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 px-2 text-[#3d2b1f]">
          <Star className="text-amber-500 fill-amber-500" /> Historique des Dégustations
        </h2>
        
        <div className="space-y-6">
          {tastings.map(tasting => (
            <div key={tasting.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-amber-50 flex flex-col md:flex-row gap-6 items-start md:items-center group">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold text-[#3d2b1f] mb-2">{tasting.rumName}</h3>
                  <div className="flex md:hidden gap-2">
                    <button onClick={() => setEditingTasting(tasting)} className="p-2 text-amber-600 bg-amber-50 rounded-xl"><Edit2 size={20} /></button>
                    <button onClick={() => setDeletingId(tasting.id)} className="p-2 text-red-600 bg-red-50 rounded-xl"><Trash2 size={20} /></button>
                  </div>
                </div>
                <div className="flex gap-3 text-sm text-amber-700 mb-4">
                  <span className="bg-amber-50 px-3 py-1 rounded-lg font-bold">{tasting.rumCouleur}</span>
                  <span className="bg-amber-50 px-3 py-1 rounded-lg font-bold">{tasting.rumDegres}%</span>
                </div>
                <div className="text-[#5d4037] flex items-start gap-3 italic bg-amber-50/30 p-4 rounded-2xl">
                  <MessageSquare size={18} className="mt-1 shrink-0 text-amber-300" />
                  <p className="text-lg leading-relaxed">{tasting.commentaire || "Aucun commentaire"}</p>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col items-center gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-amber-50 pt-6 md:pt-0 md:pl-8">
                <div className="text-center flex-1 md:flex-none">
                  <span className="block text-4xl font-black text-amber-800">{tasting.note}<span className="text-xl opacity-30">/10</span></span>
                  <div className="flex gap-1 mt-2 justify-center">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-3 rounded-full ${i < tasting.note ? 'bg-amber-500' : 'bg-amber-100'}`} />
                    ))}
                  </div>
                </div>

                <div className="hidden md:flex gap-3">
                  <button 
                    onClick={() => setEditingTasting(tasting)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-amber-700 font-bold hover:bg-amber-50 transition-colors"
                  >
                    <Edit2 size={18} /> Modifier
                  </button>
                  <button 
                    onClick={() => setDeletingId(tasting.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {tastings.length === 0 && (
            <div className="p-16 text-center bg-white rounded-[3rem] border-4 border-dashed border-amber-100">
              <p className="text-amber-400 text-xl font-medium mb-6">Ce membre n'a pas encore de notes.</p>
              <button 
                onClick={() => navigate(`/search?userId=${user.id}`)}
                className="bg-amber-100 text-amber-900 px-8 py-4 rounded-2xl font-black text-lg active:scale-95 transition-all"
              >
                Lancer une première dégustation
              </button>
            </div>
          )}
        </div>
      </section>

      {/* MODAL MODIFICATION */}
      {editingTasting && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative animate-in">
            <button onClick={() => setEditingTasting(null)} className="absolute top-8 right-8 p-3 text-gray-400 hover:text-black"><X size={32} /></button>
            <h2 className="text-3xl font-black mb-2">Modifier la note</h2>
            <p className="text-amber-700 font-bold mb-10">{editingTasting.rumName}</p>

            <form onSubmit={handleUpdate} className="space-y-10">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <label className="text-xl font-black">Note : {editingTasting.note}/10</label>
                  <div className="flex gap-1.5">
                    {[...Array(10)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={30} 
                        className={`cursor-pointer transition-all ${i < editingTasting.note ? 'text-amber-500 fill-amber-500' : 'text-amber-100'}`} 
                        onClick={() => setEditingTasting({...editingTasting, note: i + 1})} 
                      />
                    ))}
                  </div>
                </div>
                <input 
                  type="range" min="1" max="10" step="1" 
                  value={editingTasting.note} 
                  onChange={(e) => setEditingTasting({...editingTasting, note: Number(e.target.value)})} 
                  className="w-full h-4 bg-amber-100 rounded-2xl appearance-none cursor-pointer accent-amber-700" 
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-800 mb-3 px-2">Commentaire</label>
                <textarea 
                  rows={4} 
                  value={editingTasting.commentaire || ''} 
                  onChange={(e) => setEditingTasting({...editingTasting, commentaire: e.target.value})} 
                  className="w-full p-6 rounded-[2rem] border-2 border-amber-100 bg-amber-50/20 focus:bg-white focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-xl resize-none" 
                />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setEditingTasting(null)} className="flex-1 py-5 font-black text-amber-900 bg-amber-100 rounded-2xl text-lg">Annuler</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-5 font-black text-white bg-amber-800 rounded-2xl text-lg shadow-xl disabled:opacity-50">
                  {isProcessing ? "Mise à jour..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOGUE SUPPRESSION */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black mb-3 text-gray-900">Supprimer ?</h3>
            <p className="text-gray-500 mb-8 font-medium">Cette action est irréversible. Voulez-vous vraiment effacer cette dégustation ?</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-2xl">Non</button>
              <button onClick={() => handleDelete(deletingId)} disabled={isProcessing} className="flex-1 py-4 font-bold text-white bg-red-600 rounded-2xl shadow-lg shadow-red-200">
                {isProcessing ? "..." : "Oui, supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
