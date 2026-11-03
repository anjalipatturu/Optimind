import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Copy, Check, Sparkles, Plus, Star, ArrowRight, Tag } from 'lucide-react';
import { api } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import Sidebar from '../components/navigation/Sidebar';

const PERSONAS = ["All", "Developer", "Student", "Writer", "Researcher", "Business", "General"];

export default function Library() {
  const navigate = useNavigate();
  const { setInputDraft, createNewChat } = useAppStore();

  const [templates, setTemplates] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [selectedPersona]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const p = selectedPersona === "All" ? null : selectedPersona;
      const res = await api.listTemplates(p);
      setTemplates(res);
    } catch (err) {
      console.error("Failed to load templates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (tmpl) => {
    let finalPrompt = tmpl.content;
    tmpl.variables?.forEach((v) => {
      const val = variableValues[v] || `[${v}]`;
      finalPrompt = finalPrompt.replaceAll(`{{${v}}}`, val);
    });

    await api.useTemplate(tmpl.id);
    setInputDraft(finalPrompt);
    await createNewChat(tmpl.title);
    navigate('/chat');
  };

  const handleCopy = (tmpl) => {
    navigator.clipboard.writeText(tmpl.content);
    setCopiedId(tmpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Production Prompt Engineering Repository
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Prompt Library & Templates
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              30+ battle-tested templates structured with roles, constraints, and dynamic variables.
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Persona pills */}
          <div className="flex flex-wrap gap-2">
            {PERSONAS.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPersona(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedPersona === p
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/40'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords or tags..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                    {t.persona}
                  </span>
                  <button
                    onClick={() => handleCopy(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Copy template"
                  >
                    {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-3">
                  {t.content}
                </p>

                {/* Variable chips */}
                {t.variables && t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.variables.map((v) => (
                      <span key={v} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {t.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] text-slate-400 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleUseTemplate(t)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                >
                  <span>Use in Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

