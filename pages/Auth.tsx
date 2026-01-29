
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Wine, Mail, Lock, User as UserIcon, LogIn, Chrome } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pass: string) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  };

  const initUserInFirestore = async (uid: string, data: any) => {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid,
        email: data.email,
        displayName: data.displayName || 'Amateur de Rhum',
        createdAt: new Date(),
        role: 'user'
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && !validatePassword(password)) {
      setError('Le mot de passe doit contenir 8 caractères, une majuscule et un chiffre.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        await initUserInFirestore(cred.user.uid, { email, displayName });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await initUserInFirestore(cred.user.uid, { 
        email: cred.user.email, 
        displayName: cred.user.displayName 
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-amber-50">
        <div className="bg-amber-800 p-12 text-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-6">
            <Wine size={48} />
          </div>
          <h1 className="text-3xl font-black mb-2">SpiritLog</h1>
          <p className="text-amber-200 font-medium">Votre carnet de dégustation privé</p>
        </div>

        <div className="p-10 space-y-8">
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-300" size={20} />
                <input 
                  type="text" 
                  placeholder="Votre Nom" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-amber-100 bg-amber-50/30 focus:bg-white outline-none transition-all font-medium"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-300" size={20} />
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-amber-100 bg-amber-50/30 focus:bg-white outline-none transition-all font-medium"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-300" size={20} />
              <input 
                type="password" 
                placeholder="Mot de passe" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-amber-100 bg-amber-50/30 focus:bg-white outline-none transition-all font-medium"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm font-bold px-2">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-amber-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-800/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? "Chargement..." : isLogin ? (
                <><LogIn size={22} /> Se connecter</>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-amber-100"></div>
            <span className="relative bg-white px-4 text-sm font-bold text-amber-300 uppercase tracking-widest">Ou</span>
          </div>

          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full py-5 bg-white border-2 border-amber-100 text-amber-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-amber-50 active:scale-95 transition-all"
          >
            <Chrome size={22} className="text-amber-600" />
            Continuer avec Google
          </button>

          <p className="text-center font-bold text-amber-800">
            {isLogin ? "Pas encore de compte ?" : "Déjà membre ?"}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="ml-2 text-amber-600 underline"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
