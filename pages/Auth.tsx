
import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Wine, Mail, Lock, User as UserIcon, LogIn, Chrome, AlertTriangle } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Traducteur d'erreurs Firebase
  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return isLogin 
          ? "Identifiants inconnus. Si vous n'avez pas encore de compte, veuillez cliquer sur 'S'inscrire' ci-dessous." 
          : "Identifiants invalides.";
      case 'auth/wrong-password':
        return "Mot de passe incorrect. Veuillez réessayer ou réinitialiser votre mot de passe.";
      case 'auth/email-already-in-use':
        return "Cet email est déjà utilisé. Essayez de vous connecter plutôt que de vous inscrire.";
      case 'auth/invalid-email':
        return "L'adresse email n'est pas correctement formatée.";
      case 'auth/weak-password':
        return "Le mot de passe est trop simple. Utilisez au moins 8 caractères avec majuscule et chiffre.";
      case 'auth/too-many-requests':
        return "Trop de tentatives infructueuses. Votre compte est temporairement bloqué pour votre sécurité. Réessayez dans quelques minutes.";
      case 'auth/popup-closed-by-user':
        return "La fenêtre de connexion Google a été fermée avant la fin de l'opération.";
      case 'auth/network-request-failed':
        return "Problème de connexion réseau. Vérifiez votre accès internet.";
      case 'auth/internal-error':
        return "Une erreur technique est survenue. Veuillez réessayer plus tard.";
      default:
        console.error("Auth Error Code:", errorCode);
        return "Une erreur inattendue est survenue. Veuillez vérifier vos informations.";
    }
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  };

  const initUserInFirestore = async (uid: string, data: any) => {
    try {
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
    } catch (err) {
      console.error("Firestore Init Error:", err);
      // On ne bloque pas l'auth si Firestore échoue, mais on log l'erreur
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && !validatePassword(password)) {
      setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.');
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
      setError(getFriendlyErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await initUserInFirestore(cred.user.uid, { 
        email: cred.user.email, 
        displayName: cred.user.displayName 
      });
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code));
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
          {/* Bloc d'erreur amélioré */}
          {error && (
            <div className="bg-red-50 border-2 border-red-100 p-5 rounded-2xl flex items-start gap-3 animate-in">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <p className="text-red-900 text-sm font-bold leading-tight">{error}</p>
            </div>
          )}

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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-amber-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-800/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Vérification...</span>
                </div>
              ) : isLogin ? (
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
            className="w-full py-5 bg-white border-2 border-amber-100 text-amber-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-amber-50 active:scale-95 transition-all disabled:opacity-50"
          >
            <Chrome size={22} className="text-amber-600" />
            Continuer avec Google
          </button>

          <p className="text-center font-bold text-amber-800">
            {isLogin ? "Pas encore de compte ?" : "Déjà membre ?"}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }} 
              className="ml-2 text-amber-600 underline decoration-2 underline-offset-4"
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
