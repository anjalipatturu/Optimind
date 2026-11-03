import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Zap, Shield, Award } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAppStore();

  const [email, setEmail] = useState('demo@optimind.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      {/* Left Banner: Animated Floating Prompt Cards */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#090d16] p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Optimind</h1>
            <p className="text-xs text-indigo-300 font-medium">Self-Evolving Prompt Optimizer</p>
          </div>
        </div>

        {/* Floating Cards */}
        <div className="relative z-10 space-y-4 my-auto max-w-md">
          <div className="p-5 rounded-3xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-2 animate-float">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="text-rose-400 font-bold">Original Prompt</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">Score: 32</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">"Write code to check users in database."</p>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-indigo-500/30 shadow-2xl space-y-2 animate-float" style={{ animationDelay: '2s' }}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Optimized with Bandit
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">Score: 94 (+62)</span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              "Act as a Senior Backend Architect. Implement an asynchronous Python FastAPI user validation service with Pydantic v2 schemas and strict database indexing."
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Thompson Sampling</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Timezone-Aware Streaks</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Multi-Model Arena</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          © 2026 Optimind Platform. Autonomous Prompt Intelligence.
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Continue your streak and evolve your personalized prompting profile.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all mt-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Pill */}
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Demo: <strong>demo@optimind.ai</strong> / <strong>password123</strong></span>
            <button
              type="button"
              onClick={() => { setEmail('demo@optimind.ai'); setPassword('password123'); }}
              className="font-bold text-indigo-500 hover:underline"
            >
              Fill Demo
            </button>
          </div>

          <div className="text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-indigo-500 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

