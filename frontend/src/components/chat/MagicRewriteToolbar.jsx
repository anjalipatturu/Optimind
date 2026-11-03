import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Minimize2, Maximize2, Sparkles, CheckCheck, Languages, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function MagicRewriteToolbar({ selectedText, position, onReplace, onClose }) {
  const [loading, setLoading] = useState(false);

  if (!selectedText || !position) return null;

  const handleAction = async (action) => {
    setLoading(true);
    try {
      const res = await api.magicRewrite({
        text: selectedText,
        action: action
      });
      if (res && res.rewritten) {
        onReplace(res.rewritten);
      }
    } catch (err) {
      console.error("Magic rewrite failed", err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 5 }}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        className="fixed z-50 flex items-center gap-1 p-1 rounded-2xl bg-slate-900/95 text-white backdrop-blur-2xl border border-slate-700 shadow-2xl text-xs -translate-x-1/2 -translate-y-full mb-2"
      >
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-1.5 text-indigo-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Rewriting with AI...</span>
          </div>
        ) : (
          <>
            <button
              onClick={() => handleAction('improve')}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Improve clarity & flow"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              Improve
            </button>
            <button
              onClick={() => handleAction('shorten')}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Cut fluff & condense"
            >
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              Shorten
            </button>
            <button
              onClick={() => handleAction('expand')}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Add depth & examples"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
              Expand
            </button>
            <button
              onClick={() => handleAction('fix_grammar')}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Fix syntax & grammar"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              Fix
            </button>
            <button
              onClick={() => handleAction('simplify')}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 font-medium transition-colors"
              title="Explain simply"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Simplify
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

