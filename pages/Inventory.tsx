
import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { rumsCol, db } from '../lib/firebase';
import { Rum } from '../types';
import { Package, CheckCircle, XCircle, Info } from 'lucide-react';

const Inventory: React.FC = () => {
  const [rums, setRums] = useState<Rum[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(rumsCol, (snapshot) => {
      const rumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rum));
      setRums(rumsData);
    });
    return () => unsubscribe();
  }, []);

  const toggleStock = async (rum: Rum) => {
    const rumDoc = doc(db, 'rums', rum.id);
    await updateDoc(rumDoc, { enStock: !rum.enStock });
  };

  const inStockRums = rums.filter(r => r.enStock);
  const outOfStockRums = rums.filter(r => !r.enStock);

  return (
    <div className="space-y-8 pb-10">
      <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 transition-all">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-4 text-[#3d2b1f]">
          <Package className="text-amber-800" size={38} />
          La Cave
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <p className="text-amber-700 font-medium">Inventaire complet de vos spiritueux</p>
          <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg font-black text-sm uppercase tracking-tighter">
            {inStockRums.length} flacons
          </span>
        </div>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3 px-2">
            <CheckCircle className="text-green-600" size={28} /> En Stock
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inStockRums.map(rum => (
              <RumCard key={rum.id} rum={rum} onToggle={() => toggleStock(rum)} />
            ))}
            {inStockRums.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border-4 border-dashed border-amber-200 text-amber-400 text-xl font-bold">
                Votre cave est tristement vide...
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3 opacity-50 px-2">
            <XCircle className="text-red-400" size={28} /> Historique (Épuisés)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60">
            {outOfStockRums.map(rum => (
              <RumCard key={rum.id} rum={rum} onToggle={() => toggleStock(rum)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const RumCard: React.FC<{ rum: Rum, onToggle: () => void }> = ({ rum, onToggle }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-amber-100 flex flex-col justify-between hover:shadow-xl transition-all border-b-8 border-b-transparent hover:border-b-amber-700">
    <div className="space-y-4">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-2xl font-bold tracking-tight pr-2">{rum.nom}</h3>
        <span className="text-sm bg-amber-50 px-3 py-1 rounded-full text-amber-800 font-black shadow-inner whitespace-nowrap">{rum.degres}%</span>
      </div>
      <p className="text-amber-700 italic font-medium">{rum.couleur}</p>
      
      {rum.description && (
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 flex gap-3">
          <Info size={16} className="text-amber-400 shrink-0 mt-1" />
          <p className="text-sm text-amber-800/80 leading-relaxed italic">{rum.description}</p>
        </div>
      )}
    </div>
    
    <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-amber-50/50">
      <span className={`text-sm font-black uppercase tracking-widest ${rum.enStock ? 'text-green-600' : 'text-red-500'}`}>
        {rum.enStock ? "Disponible" : "Épuisé"}
      </span>
      <button 
        onClick={onToggle}
        className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all active:scale-95 ${
          rum.enStock ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-amber-700 text-white hover:bg-amber-800 shadow-md'
        }`}
      >
        {rum.enStock ? "Sortir" : "Réapprovisionner"}
      </button>
    </div>
  </div>
);

export default Inventory;
