import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Mail, Lock, Globe, Clock, Check, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const PERSONAS = [
  { id: 'Developer', name: 'Developer', icon: '💻', desc: 'Code architecture, schemas, and technical precision' },
  { id: 'Student', name: 'Student', icon: '📚', desc: 'Feynman analogies, active recall, and step-by-step proofs' },
  { id: 'Writer', name: 'Writer', icon: '✍️', desc: 'Engaging style, tone hooks, and crisp narrative cadence' },
  { id: 'Researcher', name: 'Researcher', icon: '🔬', desc: 'Academic citations, methodology audits, and counter-arguments' },
  { id: 'Business', name: 'Business', icon: '💼', desc: 'Executive 1-pagers, ROI frameworks, and strategic moats' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAppStore();

  const [step, setStep] = useState(1); // 1 = credentials, 2 = onboarding
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [persona, setPersona] = useState('Developer');
  const [language, setLanguage] = useState('en');
  const [reminderTime, setReminderTime] = useState('19:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength check
  const getPasswordStrength = () => {
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return s; // 0..4
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleFinalSignup = async () => {
    setLoading(true);
    setError('');
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    try {
      await signup({
        name,
        email,
        password,
        persona,
        language,
        timezone: userTimezone
      });
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Signup failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const pStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      {/* Left side */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-[#090d16] p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-xl shadow-indigo-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Optimind</h1>
            <p className="text-xs text-indigo-300 font-medium">Self-Evolving AI Chatbot</p>
          </div>
        </div>

        <div className="space-y-4 my-auto max-w-md">
          <h2 className="text-3xl font-black text-white leading-tight">
            Prompts that evolve with your mind.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Join the only platform where your prompts automatically self-optimize using Thompson sampling, timezone-aware streak tracking, and multi-model benchmarking.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Step {step} of 2 • Fast Onboarding
        </div>
      </div>

      {/* Right side form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {step === 1 ? 'Create your account' : 'Customize your AI Persona'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {step === 1 ? 'Get started in under 30 seconds' : 'Choose your focus domain and daily reminder schedule'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {/* Strength meter */}
                {password && (
                  <div className="flex gap-1.5 pt-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          pStrength >= bar
                            ? pStrength === 4 ? 'bg-emerald-500' : pStrength >= 2 ? 'bg-amber-500' : 'bg-rose-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <span>Continue to Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Step 2: Onboarding Wizard */
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Primary Persona</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERSONAS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        persona === p.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{p.icon}</span>
                        {persona === p.id && <Check className="w-4 h-4 text-indigo-500" />}
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{p.name}</span>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Streak Reminder</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSignup}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Creating Profile...' : 'Complete & Launch Optimind'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-500 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

