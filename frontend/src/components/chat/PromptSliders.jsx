import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function PromptSliders({ isOpen, onClose }) {
  const { toneSlider, detailSlider, expertiseSlider, setSliders } = useAppStore();

  if (!isOpen) return null;

  return (
    <div className="p-4 mb-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
          Adaptive Style Sliders
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tone slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
            <span>Casual</span>
            <span className="font-bold text-indigo-500">Tone</span>
            <span>Formal</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={toneSlider}
            onChange={(e) => setSliders(Number(e.target.value), detailSlider, expertiseSlider)}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
        </div>

        {/* Detail slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
            <span>Concise</span>
            <span className="font-bold text-indigo-500">Depth</span>
            <span>Detailed</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={detailSlider}
            onChange={(e) => setSliders(toneSlider, Number(e.target.value), expertiseSlider)}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
        </div>

        {/* Expertise slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
            <span>Beginner</span>
            <span className="font-bold text-indigo-500">Expertise</span>
            <span>Expert</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={expertiseSlider}
            onChange={(e) => setSliders(toneSlider, detailSlider, Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

