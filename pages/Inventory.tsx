
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { auth, getRumsCol, db } from '../lib/firebase';
import { Rum } from '../types';
import { Package, CheckCircle, XCircle, Info, MoreVertical, Pencil, Trash2, X, PlusCircle, MapPin } from 'lucide-react';

const Inventory: React.FC = () => {
  const user = auth.currentUser;
  const [rums, setRums] = useState<Rum[]>([]);
  const [editingRum, setEditingRum] = useState<Rum | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // État pour le nouveau rhum
  const [newRum, setNewRum] = useState({ 
    nom: '', 
    couleur: 'Ambré', 
    degres: '40', 
    provenance: '',
    enStock: true, 
    description: '' 
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(getRumsCol(user.uid), (snapshot) => {
      const rumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rum));
      setRums(rumsData);
    });
    return () => unsubscribe();
  }, [user]);

  const toggleStock = async (rum: Rum) => {
    if (!user) return;
    const rumRef = doc(db, `users/${user.uid}/rums`, rum.id);
    await updateDoc(rumRef, { enStock: !rum.enStock });
  };

  const handleAddRum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRum.nom.trim() || !newRum.provenance.trim() || isProcessing) return;
    
    setIsProcessing(true);
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
      setShowAddModal(false);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingRum || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const rumRef = doc(db, `users/${user.uid}/rums`, editingRum.id);
      await updateDoc(rumRef, {
        nom: editingRum.nom,
        couleur: editingRum.couleur,
        degres: editingRum.degres,
        provenance: editingRum.provenance,
        description: editingRum.description || null
      });
      setEditingRum(null);
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRum = async () => {
    if (!user || !deletingId || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const rumRef = doc(db, `users/${user.uid}/rums`, deletingId);
      await deleteDoc(rumRef);
      setDeletingId(null);
    } catch (err) {
      alert("Erreur lors de la suppression");
    } finally {
      setIsProcessing(false);
    }
  };

  const inStockRums = rums.filter(r => r.enStock);
  const outOfStockRums = rums.filter(r => !r.enStock);

  return (
    <div className="space-y-8 pb-10">
      <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-4 text-[#3d2b1f]">
            <Package className="text-amber-800" size={38} /> La Cave
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-amber-700 font-medium">Votre collection personnelle</p>
            <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg font-black text-sm uppercase">
              {inStockRums.length} flacons
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-amber-800 text-white px-8 py-5 rounded-2xl font-black text-lg flex items-center gap-3 shadow-xl shadow-amber-800/20 active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <PlusCircle size={24} />
          <span>Ajouter un flacon</span>
        </button>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3 px-2">
            <CheckCircle className="text-green-600" size={28} /> En Stock
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inStockRums.map(rum => (
              <RumCard 
                key={rum.id} 
                rum={rum} 
                onToggle={() => toggleStock(rum)} 
                onEdit={() => setEditingRum(rum)}
                onDelete={() => setDeletingId(rum.id)}
              />
            ))}
            {inStockRums.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border-4 border-dashed border-amber-200 text-amber-400 text-xl font-bold">
                Aucune bouteille disponible.
              </div>
            )}
          </div>
        </section>

        {outOfStockRums.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3 opacity-50 px-2">
              <XCircle className="text-red-400" size={28} /> Épuisés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60">
              {outOfStockRums.map(rum => (
                <RumCard 
                  key={rum.id} 
                  rum={rum} 
                  onToggle={() => toggleStock(rum)} 
                  onEdit={() => setEditingRum(rum)}
                  onDelete={() => setDeletingId(rum.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modal d'Ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Nouveau Flacon</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-amber-800 transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleAddRum} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Nom du flacon</label>
                <input autoFocus type="text" value={newRum.nom} onChange={(e) => setNewRum({...newRum, nom: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg bg-amber-50/30 focus:bg-white focus:border-amber-500 transition-all" required placeholder="Ex: Diplomatico Reserva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Couleur</label>
                  <select value={newRum.couleur} onChange={(e) => setNewRum({...newRum, couleur: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 bg-amber-50/30 outline-none text-lg">
                    <option>Blanc</option><option>Ambré</option><option>Vieux</option><option>Dark</option><option>Épicé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Degrés (%)</label>
                  <input type="number" step="0.1" value={newRum.degres} onChange={(e) => setNewRum({...newRum, degres: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg bg-amber-50/30 focus:bg-white" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Provenance</label>
                <input type="text" value={newRum.provenance} onChange={(e) => setNewRum({...newRum, provenance: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg bg-amber-50/30 focus:bg-white" required placeholder="Ex: Martinique, Guadeloupe..." />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Description (Facultatif)</label>
                <textarea value={newRum.description} onChange={(e) => setNewRum({...newRum, description: e.target.value})} className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg resize-none bg-amber-50/30 focus:bg-white" rows={3} placeholder="Notes sur le terroir, le vieillissement..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-bold text-amber-900 bg-amber-100 rounded-2xl active:scale-95 transition-all">Annuler</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-5 font-bold text-white bg-amber-800 rounded-2xl shadow-lg disabled:opacity-50 active:scale-95 transition-all">{isProcessing ? "..." : "Enregistrer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Modification */}
      {editingRum && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Modifier le Rhum</h3>
              <button onClick={() => setEditingRum(null)} className="text-gray-400 hover:text-amber-800 transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleUpdateRum} className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Nom du flacon</label>
                <input 
                  autoFocus 
                  type="text" 
                  value={editingRum.nom} 
                  onChange={(e) => setEditingRum({...editingRum, nom: e.target.value})} 
                  className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg bg-amber-50/30 focus:bg-white" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Couleur</label>
                  <select 
                    value={editingRum.couleur} 
                    onChange={(e) => setEditingRum({...editingRum, couleur: e.target.value})} 
                    className="w-full p-5 rounded-2xl border border-amber-200 bg-amber-50/30 outline-none text-lg"
                  >
                    <option>Blanc</option><option>Ambré</option><option>Vieux</option><option>Dark</option><option>Épicé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Degrés (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={editingRum.degres} 
                    onChange={(e) => setEditingRum({...editingRum, degres: parseFloat(e.target.value) || 0})} 
                    className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg bg-amber-50/30 focus:bg-white" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Provenance</label>
                <input 
                  type="text" 
                  value={editingRum.provenance} 
                  onChange={(e) => setEditingRum({...editingRum, provenance: e.target.value})} 
                  className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg bg-amber-50/30 focus:bg-white" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase text-amber-800 mb-2 px-1">Description</label>
                <textarea 
                  value={editingRum.description || ''} 
                  onChange={(e) => setEditingRum({...editingRum, description: e.target.value})} 
                  className="w-full p-5 rounded-2xl border border-amber-200 outline-none text-lg resize-none bg-amber-50/30 focus:bg-white" 
                  rows={3} 
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingRum(null)} className="flex-1 py-5 font-bold text-amber-900 bg-amber-100 rounded-2xl active:scale-95 transition-all">Annuler</button>
                <button type="submit" disabled={isProcessing} className="flex-1 py-5 font-bold text-white bg-amber-800 rounded-2xl shadow-lg active:scale-95 transition-all">
                  {isProcessing ? "..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation de suppression */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl animate-in">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="text-red-600" size={32} />
            </div>
            <h3 className="text-2xl font-black mb-4">Supprimer le flacon ?</h3>
            <p className="text-gray-500 mb-8 font-medium">Cette action est irréversible et supprimera également les notes associées dans les historiques.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-2xl active:scale-95 transition-all">Annuler</button>
              <button onClick={handleDeleteRum} disabled={isProcessing} className="flex-1 py-4 font-bold text-white bg-red-600 rounded-2xl active:scale-95 transition-all">
                {isProcessing ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RumCard: React.FC<{ rum: Rum, onToggle: () => void, onEdit: () => void, onDelete: () => void }> = ({ rum, onToggle, onEdit, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 flex flex-col justify-between hover:shadow-xl transition-all hover:border-b-amber-700 relative group animate-in">
      {/* Bouton Options Ellipsis */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className={`p-2 rounded-full transition-colors ${showOptions ? 'bg-amber-100 text-amber-900' : 'text-amber-200 hover:text-amber-600 hover:bg-amber-50'}`}
        >
          <MoreVertical size={24} />
        </button>
        
        {showOptions && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-amber-50 py-2 z-20 animate-in overflow-hidden">
              <button 
                onClick={() => { onEdit(); setShowOptions(false); }}
                className="w-full flex items-center gap-3 px-6 py-4 text-amber-900 hover:bg-amber-50 font-bold transition-colors"
              >
                <Pencil size={18} /> Modifier
              </button>
              <button 
                onClick={() => { onDelete(); setShowOptions(false); }}
                className="w-full flex items-center gap-3 px-6 py-4 text-red-600 hover:bg-red-50 font-bold transition-colors border-t border-amber-50"
              >
                <Trash2 size={18} /> Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-start pr-8">
          <h3 className="text-2xl font-bold tracking-tight line-clamp-2">{rum.nom}</h3>
          <span className="text-sm bg-amber-50 px-3 py-1 rounded-full text-amber-800 font-black shrink-0 ml-2">{rum.degres}%</span>
        </div>
        <div className="flex items-center gap-4">
           <p className="text-amber-700 italic font-bold">{rum.couleur}</p>
           <div className="flex items-center gap-1.5 bg-amber-100/50 px-2.5 py-0.5 rounded-lg text-amber-900 text-xs font-black uppercase">
              <MapPin size={12} />
              {rum.provenance}
           </div>
        </div>
        {rum.description && (
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 flex gap-3">
            <Info size={16} className="text-amber-400 mt-1 shrink-0" />
            <p className="text-sm text-amber-800/80 italic line-clamp-3">{rum.description}</p>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-amber-50/50">
        <span className={`text-sm font-black uppercase ${rum.enStock ? 'text-green-600' : 'text-red-500'}`}>
          {rum.enStock ? "Disponible" : "Épuisé"}
        </span>
        <button onClick={onToggle} className="px-5 py-2.5 rounded-xl text-sm font-black bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all active:scale-95">
          {rum.enStock ? "Sortir" : "Rentrer"}
        </button>
      </div>
    </div>
  );
};

export default Inventory;
