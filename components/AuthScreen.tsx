'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { BrainCircuit } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import type { CurrentUser } from '@/lib/types';

interface Props {
  onAuth: (user: CurrentUser) => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onAuth({ id: cred.user.uid, email, name: email.split('@')[0] });
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), { email, name, createdAt: Date.now() });
        onAuth({ id: cred.user.uid, email, name });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-3xl shadow-2xl text-white">
            <BrainCircuit size={40} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-white mb-1">OmniSight AI</h2>
        <p className="text-center font-mono text-xs text-blue-300 mb-8 uppercase tracking-widest">
          Unified Business Suite v16.0
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full mt-1 p-4 glass-input rounded-2xl text-sm" placeholder="John Farmer" />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 p-4 glass-input rounded-2xl text-sm" placeholder="farmer@rural.com" />
          </div>
          <div>
            <label className="text-[10px] font-black text-blue-300 uppercase ml-2">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 p-4 glass-input rounded-2xl text-sm" placeholder="••••••••" />
          </div>
          {error && (
            <div className="bg-rose-500/20 border border-rose-500/50 p-3 rounded-xl">
              <p className="text-xs text-rose-300 text-center">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest hover:shadow-2xl transition-all disabled:opacity-50">
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-xs font-bold text-blue-400 hover:text-blue-300">
            {isLogin ? 'Create Account' : 'Back to Sign In'}
          </button>
        </div>
        <div className="mt-6 text-center text-[10px] text-slate-500">
          Demo Account Login: farmer@rural.com / password<br />
          Viewer Demo Login: viewer@farm.com / password
        </div>
      </div>
    </div>
  );
}
