import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import MessageBubble from '../components/chat/MessageBubble';

export default function SharedChat() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShared();
  }, [token]);

  const loadShared = async () => {
    setLoading(true);
    try {
      const res = await api.getSharedChat(token);
      setData(res);
    } catch (err) {
      console.error("Failed to load shared conversation", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-gradient">Optimind</span>
            <span className="text-[10px] text-slate-400 block font-medium">Shared AI Conversation</span>
          </div>
        </div>

        <Link
          to="/signup"
          className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
        >
          <span>Try Optimind Free</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading conversation...</span>
          </div>
        ) : data ? (
          <>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {data.chat.title}
              </h1>
              <span className="text-xs text-slate-400">
                Created on {new Date(data.chat.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-4">
              {data.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-slate-400 space-y-2">
            <h2 className="font-bold text-base text-slate-700 dark:text-slate-300">Conversation Not Found</h2>
            <p className="text-xs">This link may have expired or been deleted by the owner.</p>
          </div>
        )}
      </main>
    </div>
  );
}

