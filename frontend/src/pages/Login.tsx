import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';

export default function Login() {
  const navigate        = useNavigate();
  const { signIn }      = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-medical-bg p-4"
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-medical-primary mb-4 shadow-lg shadow-medical-primary/20">
            <Stethoscope className="w-7 h-7 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-extrabold text-medical-text tracking-tight">
            MedGuard AI
          </h1>
          <p className="text-medical-text/50 text-sm mt-1">
            Breast Cancer Screening Platform
          </p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          className="bg-medical-surface border border-medical-border rounded-2xl p-8 shadow-xl"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-medical-text mb-6">Clinician Sign In</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
              {error}
            </motion.div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-medical-text/80 text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-text/30" strokeWidth={2} />
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="w-full pl-10 pr-3 p-3 rounded-lg border border-medical-border bg-medical-bg text-medical-text placeholder:text-medical-text/30 focus:ring-2 focus:ring-medical-accent focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-medical-text/80 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-text/30" strokeWidth={2} />
              <input
                id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 p-3 rounded-lg border border-medical-border bg-medical-bg text-medical-text placeholder:text-medical-text/30 focus:ring-2 focus:ring-medical-accent focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text/30 hover:text-medical-text/60 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" strokeWidth={2} />
                  : <Eye className="w-4 h-4" strokeWidth={2} />
                }
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-medical-primary text-white p-3 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="border-white" />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>

          <p className="text-center text-medical-text/40 text-xs mt-4">
            Access restricted to authorized clinicians only
          </p>
        </motion.form>

        <p className="text-center text-medical-text/30 text-xs mt-6">
          MedGuard AI © 2026 — HIPAA Compliant
        </p>
      </div>
    </motion.div>
  );
}