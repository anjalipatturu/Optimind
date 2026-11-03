import React, { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Edit3, Check, X, Shield, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import Sidebar from '../components/navigation/Sidebar';

export default function Memory() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('preference');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const res = await api.listMemories();
      setMemories(res);
    } catch (err) {
      console.error("Failed to load memories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    try {
      const res = await api.addMemory({ text: newText, category: newCategory });
      setMemories([res, ...memories]);
      setNewText('');
    } catch (err) {
      console.error("Failed to add memory", err);
    }
  };

  const handleToggle = async (mem) => {
    try {
      const res = await api.updateMemory(mem.id, { enabled: !mem.enabled });
      setMemories(memories.map(m => m.id === mem.id ? res : m));
    } catch (err) {
      console.error("Toggle error", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteMemory(id);
      setMemories(memories.filter(m => m.id !== id));
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await api.updateMemory(id, { text: editText });
      setMemories(memories.map(m => m.id === id ? res : m));
      setEditingId(null);
    } catch (err) {
      console.error("Edit error", err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
              <Brain className="w-4 h-4" />
              User Prompt Profile & Privacy
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Long-Term Prompt Memory
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transparent, user-controlled memory items injected into the optimizer pipeline.
            </p>
          </div>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAdd} className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Add Custom Style Preference or Rule
          </span>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="e.g. Always write Python code using Python 3.12 typing syntax and async patterns."
              className="flex-1 p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="p-3 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
            >
              <option value="preference">Preference</option>
              <option value="tone">Tone</option>
              <option value="domain">Domain Knowledge</option>
              <option value="format">Output Schema</option>
            </select>
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>
          </div>
        </form>

        {/* Memory Items List */}
        <div className="space-y-3">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                mem.enabled
                  ? 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60'
                  : 'border-slate-200/40 dark:border-slate-800/40 bg-slate-100/50 dark:bg-slate-950/40 opacity-60'
              }`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase">
                    {mem.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Added {new Date(mem.created_at).toLocaleDateString()}
                  </span>
                </div>

                {editingId === mem.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 p-2 text-xs rounded-xl border border-indigo-500 bg-white dark:bg-slate-950"
                    />
                    <button
                      onClick={() => handleSaveEdit(mem.id)}
                      className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                    {mem.text}
                  </p>
                )}
              </div>

              {/* Action toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(mem)}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    mem.enabled ? 'text-indigo-500' : 'text-slate-400'
                  }`}
                  title={mem.enabled ? "Disable this memory" : "Enable this memory"}
                >
                  {mem.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => {
                    setEditingId(mem.id);
                    setEditText(mem.text);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(mem.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

