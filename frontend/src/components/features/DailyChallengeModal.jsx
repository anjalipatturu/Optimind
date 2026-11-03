import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X, Check, Award, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

export default function DailyChallengeModal() {
  const { challengeModalOpen, setChallengeModalOpen, refreshStreak } = useAppStore();
  const [challenge, setChallenge] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (challengeModalOpen) {
      loadChallenge();
    }
  }, [challengeModalOpen]);

  const loadChallenge = async () => {
    try {
      const res = await api.getDailyChallenge();
      setChallenge(res);
      setUserPrompt('');
      setResult(null);
    } catch (err) {
      console.error("Failed to load daily challenge", err);
    }
  };

  if (!challengeModalOpen || !challenge) return null;

  const handleSubmit = async () => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await api.submitDailyChallenge(userPrompt);
      setResult(res);
      await refreshStreak();
    } catch (err) {
      console.error("Submit challenge failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Daily Prompt Challenge
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                    +{challenge.reward_xp} XP
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sharpen your prompt engineering skills with daily AI graded missions
                </p>
              </div>
            </div>

            <button
              onClick={() => setChallengeModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Mission brief */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400">{challenge.title}</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{challenge.description}</p>
            </div>

            {/* Target vague prompt to rewrite */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vague Prompt to Fix:</span>
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/50 text-xs font-mono text-slate-600 dark:text-slate-400">
                "{challenge.vague_prompt}"
              </div>
            </div>

            {/* Criteria chips */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluation Criteria:</span>
              <div className="flex flex-wrap gap-2">
                {challenge.criteria.map((c, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Solution Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Evolved Prompt:</label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Act as a Senior Software Engineer. Write a Python 3.11 Pydantic validation function..."
                className="w-full p-3.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={4}
              />
            </div>

            {/* Result grading */}
            {result && (
              <div className={`p-4 rounded-2xl border ${result.passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    AI Grade: {result.score} / 100 {result.passed ? '🎉 PASSED' : 'RETRY'}
                  </span>
                  <span className="text-xs font-extrabold text-amber-500">+{result.xp_awarded} XP</span>
                </div>
                {result.tips && result.tips.length > 0 && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tip: {result.tips[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
            <button
              onClick={() => setChallengeModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !userPrompt.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Submit & Grade
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

