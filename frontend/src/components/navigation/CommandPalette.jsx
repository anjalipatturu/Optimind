import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Moon, Sun, BookOpen, Target, Swords, Mic, History, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export default function CommandPalette() {
  const navigate = useNavigate();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    createNewChat,
    theme,
    setTheme,
    setChallengeModalOpen,
    setArenaModalOpen,
    setRetroModalOpen,
    setHandsFreeVoiceOpen,
    chats,
    setCurrentChat
  } = useAppStore();

  const [query, setQuery] = useState('');

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const actions = [
    { id: 'new_chat', label: 'Start New Chat', icon: Plus, action: () => { createNewChat(); navigate('/chat'); } },
    { id: 'templates', label: 'Explore Prompt Library & Templates', icon: BookOpen, action: () => navigate('/library') },
    { id: 'challenge', label: 'Take Today\'s Daily Challenge', icon: Target, action: () => setChallengeModalOpen(true) },
    { id: 'arena', label: 'Multi-Model Arena Battle', icon: Swords, action: () => setArenaModalOpen(true) },
    { id: 'retro', label: 'Retro-Optimize Past Prompts', icon: History, action: () => setRetroModalOpen(true) },
    { id: 'voice', label: 'Launch Hands-free Voice Mode', icon: Mic, action: () => setHandsFreeVoiceOpen(true) },
    { id: 'dashboard', label: 'View Evolution Dashboard', icon: Sparkles, action: () => navigate('/dashboard') },
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`, icon: theme === 'dark' ? Sun : Moon, action: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
  ];

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));
  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const runItem = (itemAction) => {
    setCommandPaletteOpen(false);
    itemAction();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search chats (Ctrl+K)..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            <button onClick={() => setCommandPaletteOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List items */}
          <div className="p-2 max-h-80 overflow-y-auto space-y-1">
            <span className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Actions
            </span>
            {filteredActions.map((item) => (
              <button
                key={item.id}
                onClick={() => runItem(item.action)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
              >
                <item.icon className="w-4 h-4 text-slate-400" />
                <span>{item.label}</span>
              </button>
            ))}

            {filteredChats.length > 0 && (
              <>
                <span className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-2">
                  Matching Conversations
                </span>
                {filteredChats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => runItem(() => { setCurrentChat(c.id); navigate('/chat'); })}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left truncate"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

