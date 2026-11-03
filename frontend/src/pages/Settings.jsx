import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Key, Shield, User, Moon, Sun, Check, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import Sidebar from '../components/navigation/Sidebar';

export default function Settings() {
  const { user, theme, setTheme, checkAuth, logout } = useAppStore();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'notifications' | 'api' | 'privacy'
  const [name, setName] = useState(user?.name || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [persona, setPersona] = useState(user?.persona || 'Developer');
  const [autoOptimize, setAutoOptimize] = useState(user?.settings?.auto_optimize || false);
  const [reminderTime, setReminderTime] = useState(user?.settings?.reminder_time || '19:00');
  const [pushEnabled, setPushEnabled] = useState(user?.settings?.notifications_push ?? true);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');

  // API keys
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyResult, setNewKeyResult] = useState(null);

  // Feedback status
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (activeTab === 'api') {
      loadApiKeys();
    }
  }, [activeTab]);

  const loadApiKeys = async () => {
    try {
      const res = await api.listApiKeys();
      setApiKeys(res);
    } catch (err) {
      console.error("Load keys error", err);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await api.generateApiKey("Personal Key");
      setNewKeyResult(res);
      await loadApiKeys();
    } catch (err) {
      console.error("Generate key error", err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    try {
      await api.updateMe({
        name,
        language,
        persona,
        settings: {
          ...user.settings,
          auto_optimize: autoOptimize,
          reminder_time: reminderTime,
          notifications_push: pushEnabled
        }
      });
      await checkAuth();
      setSaveStatus('Preferences saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('Failed to save preferences.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdStatus('Updating...');
    try {
      await api.changePassword({ old_password: oldPassword, new_password: newPassword });
      setPwdStatus('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPwdStatus(''), 3000);
    } catch (err) {
      setPwdStatus('Error: ' + err.message);
    }
  };

  const handleDeleteAllData = async () => {
    if (confirm("Are you sure? This will delete all your conversations, prompts, streaks, and memories permanently.")) {
      await api.deleteAccount();
      await logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
            <SettingsIcon className="w-4 h-4" />
            Preferences & System Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Settings
          </h1>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            General & Appearance
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'notifications' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            Streaks & Reminders
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'api' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            Developer API Keys
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'privacy' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            Security & Privacy
          </button>
        </div>

        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="max-w-xl space-y-6">
            <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Profile Information</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Persona</label>
                  <select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Student">Student</option>
                    <option value="Writer">Writer</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Business">Business</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              {/* Theme toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Theme Mode</span>
                  <span className="text-[11px] text-slate-400">Toggle between Light and Dark aesthetic</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-2"
                >
                  {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                </button>
              </div>

              {/* Auto-optimize toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Auto-Optimize Every Prompt</span>
                  <span className="text-[11px] text-slate-400">Automatically enhance prompts with top bandit strategy before sending</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoOptimize}
                  onChange={(e) => setAutoOptimize(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                >
                  Save Preferences
                </button>
                {saveStatus && <span className="text-xs font-bold text-emerald-500">{saveStatus}</span>}
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Notifications & Reminders */}
        {activeTab === 'notifications' && (
          <div className="max-w-xl space-y-4">
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Streak Reminders & Timezone Scheduling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optimind schedules background reminders (APScheduler) aligned exactly to your detected IANA timezone ({user?.timezone || 'UTC'}).
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Daily Reminder Time</span>
                  <span className="text-[11px] text-slate-400">Sent only if you haven't yet qualified for the day (fewer than 2 prompts)</span>
                </div>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Last-Chance Alert (9:30 PM)</span>
                  <span className="text-[11px] text-slate-400">Urgent evening reminder before your streak expires at midnight</span>
                </div>
                <span className="text-xs font-bold text-emerald-500">Enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Developer Public API */}
        {activeTab === 'api' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Public Optimizer API Keys</h3>
                  <p className="text-xs text-slate-400">Integrate Optimind's self-evolving engine directly into your external apps.</p>
                </div>
                <button
                  onClick={handleGenerateKey}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
                >
                  Generate New Key
                </button>
              </div>

              {/* Newly created key banner */}
              {newKeyResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">Your Secret Key (Copy now, will not be shown again):</span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-black/30 rounded-xl font-mono text-xs text-emerald-300 overflow-x-auto">
                      {newKeyResult.api_key}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(newKeyResult.api_key)}
                      className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Existing keys */}
              <div className="space-y-2 pt-2">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{k.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{k.prefix}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{k.requests_count} calls</span>
                  </div>
                ))}
              </div>

              {/* Documentation cURL example */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example cURL Usage</span>
                <pre className="p-3.5 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto">
{`curl -X POST http://localhost:8000/api/v1/public/optimize \\
  -H "X-API-Key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Write a React hook for debouncing input", "mode": "Technical"}'`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Privacy */}
        {activeTab === 'privacy' && (
          <div className="max-w-xl space-y-6">
            <form onSubmit={handleChangePassword} className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Change Account Password</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Update Password
                </button>
                {pwdStatus && <span className="text-xs font-bold text-slate-400">{pwdStatus}</span>}
              </div>
            </form>

            {/* Danger Zone: Delete Account */}
            <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Delete All Data & Account</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Permanently deletes your account, messages, attachments, prompt optimizations, and long-term memories. This action is irreversible.
              </p>
              <button
                type="button"
                onClick={handleDeleteAllData}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20"
              >
                Delete My Entire Account & Data
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

