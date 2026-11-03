import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, X, Check, Loader2, Sparkles, Trophy } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

export default function ArenaModal() {
  const { arenaModalOpen, setArenaModalOpen, refreshStreak } = useAppStore();
  const [prompt, setPrompt] = useState('Write an efficient LRU Cache implementation in Python with time complexity analysis.');
  const [modelA, setModelA] = useState('gemini-1.5-flash');
  const [modelB, setModelB] = useState('claude-3-7-sonnet');
  const [loading, setLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [voted, setVoted] = useState(false);

  if (!arenaModalOpen) return null;

  const handleRunBattle = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVoted(false);
    try {
      const res = await api.runArenaBattle({
        prompt,
        model_a: modelA,
        model_b: modelB
      });
      setBattleResult(res);
    } catch (err) {
      console.error("Arena battle failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winner) => {
    if (!battleResult || voted) return;
    try {
      await api.voteArenaBattle(battleResult.battle_id, winner);
      setVoted(true);
      await refreshStreak();
    } catch (err) {
      console.error("Vote failed", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Multi-Model Arena
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    BLIND TEST
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare models side-by-side on the same prompt and vote for the best answer
                </p>
              </div>
            </div>

            <button
              onClick={() => setArenaModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Prompt input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Prompt</label>
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 p-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  rows={2}
                />
                <button
                  onClick={handleRunBattle}
                  disabled={loading}
                  className="px-6 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                  Battle
                </button>
              </div>
            </div>

            {/* Results comparison */}
            {battleResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Model A */}
                <div className="flex flex-col p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-indigo-500">Model A</span>
                    <button
                      onClick={() => handleVote('a')}
                      disabled={voted}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Vote Model A (+10 XP)
                    </button>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans overflow-y-auto max-h-80 leading-relaxed">
                    {battleResult.response_a}
                  </div>
                </div>

                {/* Model B */}
                <div className="flex flex-col p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-purple-500">Model B</span>
                    <button
                      onClick={() => handleVote('b')}
                      disabled={voted}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Vote Model B (+10 XP)
                    </button>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans overflow-y-auto max-h-80 leading-relaxed">
                    {battleResult.response_b}
                  </div>
                </div>
              </div>
            )}

            {voted && (
              <div className="p-3 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold animate-pulse">
                ✓ Vote recorded! Revealed: Model A was {battleResult?.model_a}, Model B was {battleResult?.model_b}.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

