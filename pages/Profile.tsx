
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db, tastingsCol } from '../lib/firebase';
import { User, TastingWithDetails, Rum } from '../types';
import { Star, MessageSquare, Plus } from 'lucide-react';

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [tastings, setTastings] = useState<TastingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    // Utilisation de onSnapshot pour l'utilisateur aussi pour gérer le mode offline nativement
    const unsubscribeUser = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        setUser({ id: docSnap.id, ...docSnap.data() } as User);
      } else {
        console.error("Utilisateur introuvable");
      }
    }, (error) => {
      console.error("Erreur profil user:", error);
    });

    // Fetch Tastings
    const q = query(tastingsCol, where("userId", "==", userId));
    const unsubscribeTastings = onSnapshot(q, async (snapshot) => {
      const tastingsList: TastingWithDetails[] = [];
      
      // On récupère les détails des rhums
      // Note: Dans une app réelle, il vaudrait mieux dénormaliser le nom du rhum dans le document tasting
      // pour éviter des lectures multiples, mais restons sur ton architecture Firestore actuelle.
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
            rumDegres: rumData.degres
          } as TastingWithDetails;
        }
        return null;
      });

      const results = await Promise.all(promises);
      const filteredResults = results.filter((r): r is TastingWithDetails => r !== null);
      
      setTastings(filteredResults.sort((a, b) => b.note - a.note));
      setLoading(false);
    }, (error) => {
      console.error("Erreur tastings:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTastings();
    };
  }, [userId]);

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
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-amber-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-amber-700"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-3xl uppercase shadow-inner">
              {user.prenom[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.prenom} {user.nom}</h1>
              <p className="text-amber-600 font-medium">Expert Dégustateur</p>
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
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Star className="text-amber-500 fill-amber-500" /> Historique des Dégustations
        </h2>
        
        <div className="space-y-4">
          {tastings.map(tasting => (
            <div key={tasting.id} className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold mb-1">{tasting.rumName}</h3>
                <div className="flex gap-3 text-sm text-amber-700">
                  <span className="bg-amber-50 px-2 py-0.5 rounded">{tasting.rumCouleur}</span>
                  <span className="bg-amber-50 px-2 py-0.5 rounded">{tasting.rumDegres}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex gap-1 text-amber-500">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-4 rounded-full ${i < tasting.note ? 'bg-amber-500' : 'bg-amber-100'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-xl ml-2">{tasting.note}/10</span>
              </div>

              <div className="text-gray-600 flex items-start gap-2 italic text-sm">
                <MessageSquare size={16} className="mt-1 flex-shrink-0 text-amber-300" />
                <p>{tasting.commentaire || "Aucun commentaire"}</p>
              </div>
            </div>
          ))}

          {tastings.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-amber-100">
              <p className="text-amber-600 mb-4">Ce membre n'a pas encore dégusté de rhum.</p>
              <button 
                onClick={() => navigate(`/search?userId=${user.id}`)}
                className="text-amber-800 font-bold underline"
              >
                Lancer une première dégustation
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
