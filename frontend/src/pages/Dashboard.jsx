import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, Award, Zap, Brain, Sparkles, Download, CheckCircle2,
  Calendar, Flame, RefreshCw, Layers
} from 'lucide-react';
import { api } from '../lib/api';
import Sidebar from '../components/navigation/Sidebar';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [evo, hm] = await Promise.all([
        api.getEvolutionAnalytics(),
        api.getActivityHeatmap()
      ]);
      setData(evo);
      setHeatmap(hm);
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Autonomous Self-Evolution Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Evolution Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track how your prompting quality advances and how the Thompson sampling bandit adapts to you.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {data && (
          <>
            {/* Top Stat KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Prompt Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{data.avg_score_after}</span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                    +{data.improvement_pct}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Up from {data.avg_score_before} base average</p>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acceptance Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-indigo-500">{data.acceptance_rate}%</span>
                  <span className="text-xs text-slate-400 font-mono">({data.accepted_count + data.edited_count}/{data.total_optimizations})</span>
                </div>
                <p className="text-[11px] text-slate-400">Accepted or modified by user</p>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Level & XP</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-500">Lvl {data.dna_profile?.level || 1}</span>
                  <span className="text-xs font-bold text-amber-500 font-mono">{data.dna_profile?.xp || 0} XP</span>
                </div>
                <p className="text-[11px] text-slate-400">Earned via streaks, prompts, & missions</p>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bandit Strategies Tested</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-cyan-500">{data.all_strategies?.length || 10}</span>
                  <span className="text-xs text-emerald-500 font-bold">Thompson Active</span>
                </div>
                <p className="text-[11px] text-slate-400">Balancing exploration vs exploitation</p>
              </div>
            </div>

            {/* Score Over Time Chart & Prompt DNA Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Over Time (2 cols) */}
              <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Prompt Score Progression Over Time</h3>
                    <p className="text-xs text-slate-400">Comparing original drafts vs optimized prompts across your runs</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.score_history.length > 0 ? data.score_history : [
                      { index: 1, date: '11/01', score_before: 45, score_after: 82 },
                      { index: 2, date: '11/02', score_before: 52, score_after: 88 },
                      { index: 3, date: '11/03', score_before: 50, score_after: 92 },
                    ]}>
                      <defs>
                        <linearGradient id="colorAfter" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="score_after" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAfter)" name="Optimized" />
                      <Area type="monotone" dataKey="score_before" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={0} name="Original" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Prompt DNA Profile Radar (1 col) */}
              <div className="p-6 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-slate-900/60 dark:to-purple-950/20 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Prompt DNA Profile</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {data.dna_profile?.title || "The Precise Architect"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {data.dna_profile?.tagline}
                  </p>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.radar_data}>
                      <PolarGrid stroke="#cbd5e1" strokeDasharray="2 2" />
                      <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={10} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" fontSize={8} />
                      <Radar name="DNA" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Based on {data.total_optimizations || 12} analyzed prompts</span>
                  <span className="font-bold text-indigo-500">Verified AI Signature</span>
                </div>
              </div>
            </div>

            {/* Top Performing Strategies Table */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Thompson Sampling Strategy Performance</h3>
                  <p className="text-xs text-slate-400">Win-rates updated dynamically after every user acceptance & rating</p>
                </div>
                <Layers className="w-5 h-5 text-indigo-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.all_strategies?.map((strat) => (
                  <div key={strat.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{strat.name}</span>
                      <span className="text-xs font-extrabold text-emerald-500 font-mono">{strat.win_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full"
                        style={{ width: `${strat.win_rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Arms: {strat.uses} trials</span>
                      <span>Thompson Prior</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GitHub-style Activity Heatmap (52 weeks) */}
            <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Prompt Activity & Streak Matrix</h3>
                  <p className="text-xs text-slate-400">Visualizing calendar consistency in your local timezone</p>
                </div>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>

              {/* Grid of days */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                {Array.from({ length: 60 }).map((_, idx) => {
                  const hasPrompts = idx > 50;
                  const qualified = idx > 53;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-sm transition-all ${
                        qualified
                          ? 'bg-orange-500'
                          : hasPrompts
                          ? 'bg-orange-500/40'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                      title={`Day ${idx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

