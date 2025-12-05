
import React, { useState } from 'react';
import { SystemUser, UserRole } from '../types';
import { Lock, Shield, User, BookOpen, Wallet, GraduationCap, Users, Library, Baby } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: SystemUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network request
    setTimeout(() => {
      // Default fallback for custom input
      onLogin({
        id: 'custom-user',
        name: 'Utilisateur Connecté',
        email: email,
        role: 'ADMIN',
        lastLogin: new Date().toISOString(),
        status: 'ACTIVE'
      });
      setLoading(false);
    }, 800);
  };

  const demoLogin = (role: UserRole, name: string) => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        id: `demo-${role.toLowerCase()}`,
        name: name,
        email: `${role.toLowerCase()}@ecolepro.ci`,
        role: role,
        lastLogin: new Date().toISOString(),
        status: 'ACTIVE'
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden z-10">
        
        {/* Left Side: Brand & Info */}
        <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-slate-800 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-8">
              <div className="bg-white p-2 rounded-full shadow-xl h-16 w-16 flex items-center justify-center">
                {/* Logo SVG */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                  <path d="M50 95C20 85 10 55 10 30L50 5V95Z" fill="#1e40af" />
                  <path d="M50 95C80 85 90 55 90 30L50 5V95Z" fill="#d97706" />
                  <text x="50" y="62" fontSize="40" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif" letterSpacing="-2">EP</text>
                </svg>
              </div>
              <div>
                 <h1 className="text-3xl font-bold tracking-tight leading-none">
                    <span>Ecole</span><span className="text-amber-400">Pro</span>
                 </h1>
                 <span className="text-xs text-blue-200 uppercase tracking-wider">Gestion Scolaire</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">Plateforme Unifiée de Gestion Scolaire</h2>
            <p className="text-blue-100 leading-relaxed mb-6">
              Connectez-vous pour accéder à vos outils de gestion, suivi pédagogique, finances et communication.
            </p>
          </div>
          <div className="text-xs text-blue-200/60">
            © 2024 EcolePro Suite v3.0. Tous droits réservés.
          </div>
        </div>

        {/* Right Side: Login Form & Quick Access */}
        <div className="md:w-1/2 p-10 bg-white flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Connexion</h3>
            <p className="text-gray-500 text-sm">Veuillez vous identifier pour continuer.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="nom@ecolepro.ci"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex justify-center items-center"
            >
              {loading ? <span className="animate-pulse">Connexion...</span> : 'Se connecter'}
            </button>
          </form>

          {/* Demo Quick Access */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Accès Rapide (Démo)</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => demoLogin('SUPER_ADMIN', 'Dev Master')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-purple-300 transition-all group text-left">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-md mr-3 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Lock size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Super Admin</div>
                  <div className="text-[10px] text-gray-500">Programmeur</div>
                </div>
              </button>
              
              <button onClick={() => demoLogin('ADMIN', 'Mme. Directrice')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all group text-left">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Shield size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Administrateur</div>
                  <div className="text-[10px] text-gray-500">Direction</div>
                </div>
              </button>

              <button onClick={() => demoLogin('BURSAR', 'M. Comptable')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-emerald-300 transition-all group text-left">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md mr-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Wallet size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Économe</div>
                  <div className="text-[10px] text-gray-500">Finances</div>
                </div>
              </button>

              <button onClick={() => demoLogin('TEACHER', 'M. Dubois')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-amber-300 transition-all group text-left">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-md mr-3 group-hover:bg-amber-600 group-hover:text-white transition-colors"><BookOpen size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Enseignant</div>
                  <div className="text-[10px] text-gray-500">Pédagogie</div>
                </div>
              </button>

               <button onClick={() => demoLogin('STUDENT', 'Alice Dupont')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-indigo-300 transition-all group text-left">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md mr-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><User size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Élève</div>
                  <div className="text-[10px] text-gray-500">Espace Personnel</div>
                </div>
              </button>

              <button onClick={() => demoLogin('PARENT', 'M. Parent')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-rose-300 transition-all group text-left">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-md mr-3 group-hover:bg-rose-600 group-hover:text-white transition-colors"><Users size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Parent</div>
                  <div className="text-[10px] text-gray-500">Suivi Scolaire</div>
                </div>
              </button>

              <button onClick={() => demoLogin('LIBRARIAN', 'Mme. Page')} className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-teal-300 transition-all group text-left">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-md mr-3 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Library size={16} /></div>
                <div>
                  <div className="text-xs font-bold text-gray-700">Bibliothécaire</div>
                  <div className="text-[10px] text-gray-500">CDI</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
    