import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Edit3, X, RefreshCw, Layers, ArrowRight, Award, Zap, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAppStore } from '../../store/useAppStore';

export default function PromptOptimizerModal() {
  const {
    optimizerModalOpen,
    activeOptimization,
    setOptimizerModalOpen,
    setInputDraft,
    toneSlider,
    detailSlider,
    expertiseSlider
  } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentOpt, setCurrentOpt] = useState(null);

  React.useEffect(() => {
    if (activeOptimization) {
      setCurrentOpt(activeOptimization);
      setEditedText(activeOptimization.optimized);
      setIsEditing(false);
    }
  }, [activeOptimization]);

  if (!optimizerModalOpen || !currentOpt) return null;

  const handleDecision = async (outcome) => {
    try {
      await api.recordOutcome({
        optimization_id: currentOpt.optimization_id,
        outcome: outcome,
        edited_prompt: outcome === 'edited' ? editedText : null
      });

      if (outcome === 'accepted') {
        setInputDraft(currentOpt.optimized);
      } else if (outcome === 'edited') {
        setInputDraft(editedText);
      }
      // if 'rejected', keep original draft unchanged
      setOptimizerModalOpen(false);
    } catch (err) {
      console.error("Failed to record optimizer outcome", err);
      setOptimizerModalOpen(false);
    }
  };

  const handleRegenerate = async (differentStrategy = false) => {
    setIsRegenerating(true);
    try {
      const res = await api.optimizePrompt({
        prompt: currentOpt.original,
        mode: differentStrategy ? 'Detailed' : 'Balanced',
        tone_slider: toneSlider,
        detail_slider: detailSlider,
        expertise_slider: expertiseSlider
      });
      setCurrentOpt(res);
      setEditedText(res.optimized);
      setIsEditing(false);
    } catch (err) {
      console.error("Regenerate failed", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const scoreDelta = (currentOpt.score_after || 0) - (currentOpt.score_before || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Self-Evolving Prompt Optimizer
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {currentOpt.task_type?.replace('_', ' ').toUpperCase()}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adaptive Thompson-sampling strategies calibrated from your usage
                </p>
              </div>
            </div>

            <button
              onClick={() => setOptimizerModalOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Score Comparison Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Original Score</span>
                  <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
                    {currentOpt.score_before} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-sm">
                  {currentOpt.score_before}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Optimized Score</span>
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {currentOpt.score_after} <span className="text-xs font-normal text-indigo-400">/ 100</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 flex items-center justify-center font-bold text-sm text-indigo-600 dark:text-indigo-400">
                  {currentOpt.score_after}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Score Gain</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    +{scoreDelta} pts
                  </div>
                </div>
                <div className="p-3 rounded-full bg-emerald-500 text-white shadow-sm">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Score Breakdown Radar/Bar */}
            {currentOpt.score_breakdown_after && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quality Dimension Breakdown
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(currentOpt.score_breakdown_after).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 capitalize">
                        <span>{key.replace('_', ' ')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{val}/20</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(val / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diff View Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Original Draft</span>
                  <span className="text-xs text-slate-400 font-mono">{currentOpt.original.split(' ').length} words</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed min-h-[140px] whitespace-pre-wrap select-text">
                  {currentOpt.original}
                </div>
              </div>

              {/* Optimized (or Editable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Optimized Version
                  </span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-slate-500 hover:text-indigo-500 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditing ? 'Preview' : 'Edit text'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 font-sans leading-relaxed min-h-[140px] focus:outline-none"
                  />
                ) : (
                  <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed min-h-[140px] whitespace-pre-wrap select-text shadow-inner">
                    {currentOpt.optimized}
                  </div>
                )}
              </div>
            </div>

            {/* Explainability: What I changed & why */}
            {currentOpt.explanation && currentOpt.explanation.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  What I Changed & Why (Explainable AI):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {currentOpt.explanation.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRegenerate(false)}
                disabled={isRegenerating}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>

              <button
                onClick={() => handleRegenerate(true)}
                disabled={isRegenerating}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Different Strategy
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleDecision('rejected')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                Keep Original
              </button>

              {isEditing ? (
                <button
                  onClick={() => handleDecision('edited')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Save Edits & Use
                </button>
              ) : (
                <button
                  onClick={() => handleDecision('accepted')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:opacity-95 flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Use Optimized (+15 XP)
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

