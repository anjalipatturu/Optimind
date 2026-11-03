import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Plus, Search, MessageSquare, Pin, Trash2, BookOpen, Brain,
  Image, BarChart3, Settings, LogOut, Sparkles, ChevronRight,
  Target, Swords, Mic, History, X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import StreakWidget from '../streak/StreakWidget';

export default function Sidebar() {
  const navigate = useNavigate();
  const {
    user,
    chats,
    currentChatId,
    setCurrentChat,
    createNewChat,
    deleteChat,
    sidebarOpen,
    setSidebarOpen,
    setChallengeModalOpen,
    setArenaModalOpen,
    setRetroModalOpen,
    setHandsFreeVoiceOpen,
    setCommandPaletteOpen,
    logout
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Group chats by date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const lastWeek = today - 86400000 * 7;

  const pinnedChats = filteredChats.filter(c => c.pinned);
  const regularChats = filteredChats.filter(c => !c.pinned);

  const todayChats = [];
  const yesterdayChats = [];
  const previous7DaysChats = [];
  const olderChats = [];

  regularChats.forEach(c => {
    const cTime = new Date(c.updated_at || c.created_at).getTime();
    if (cTime >= today) todayChats.push(c);
    else if (cTime >= yesterday) yesterdayChats.push(c);
    else if (cTime >= lastWeek) previous7DaysChats.push(c);
    else olderChats.push(c);
  });

  const handleSelectChat = (chatId) => {
    setCurrentChat(chatId);
    navigate('/chat');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewChat = async () => {
    await createNewChat();
    navigate('/chat');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 transition-all select-none">
      {/* Top Brand & New Chat */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/chat')}>
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-gradient">Optimind</span>
              <span className="block text-[10px] text-slate-400 font-medium">Self-Evolving AI</span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleNewChat}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Streak Widget */}
      <div className="px-4 pb-2">
        <StreakWidget />
      </div>

      {/* Standout feature shortcuts */}
      <div className="px-4 py-2 border-y border-slate-200/60 dark:border-slate-800/60 grid grid-cols-4 gap-1">
        <button
          onClick={() => setChallengeModalOpen(true)}
          className="p-2 rounded-xl text-center hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors"
          title="Daily Challenge (+100 XP)"
        >
          <Target className="w-4 h-4 mx-auto text-amber-500" />
          <span className="text-[10px] text-slate-500 block mt-1 font-medium">Daily</span>
        </button>
        <button
          onClick={() => setArenaModalOpen(true)}
          className="p-2 rounded-xl text-center hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors"
          title="Multi-Model Arena"
        >
          <Swords className="w-4 h-4 mx-auto text-rose-500" />
          <span className="text-[10px] text-slate-500 block mt-1 font-medium">Arena</span>
        </button>
        <button
          onClick={() => setHandsFreeVoiceOpen(true)}
          className="p-2 rounded-xl text-center hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors"
          title="Hands-free Voice Mode"
        >
          <Mic className="w-4 h-4 mx-auto text-cyan-500" />
          <span className="text-[10px] text-slate-500 block mt-1 font-medium">Voice</span>
        </button>
        <button
          onClick={() => setRetroModalOpen(true)}
          className="p-2 rounded-xl text-center hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors"
          title="Retro-Optimize History"
        >
          <History className="w-4 h-4 mx-auto text-purple-500" />
          <span className="text-[10px] text-slate-500 block mt-1 font-medium">Retro</span>
        </button>
      </div>

      {/* History chat list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Pinned */}
        {pinnedChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Pin className="w-3 h-3 text-indigo-400" />
              Pinned
            </span>
            {pinnedChats.map((c) => (
              <ChatItem key={c.id} chat={c} active={c.id === currentChatId} onSelect={handleSelectChat} onDelete={deleteChat} />
            ))}
          </div>
        )}

        {/* Today */}
        {todayChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Today</span>
            {todayChats.map((c) => (
              <ChatItem key={c.id} chat={c} active={c.id === currentChatId} onSelect={handleSelectChat} onDelete={deleteChat} />
            ))}
          </div>
        )}

        {/* Yesterday */}
        {yesterdayChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Yesterday</span>
            {yesterdayChats.map((c) => (
              <ChatItem key={c.id} chat={c} active={c.id === currentChatId} onSelect={handleSelectChat} onDelete={deleteChat} />
            ))}
          </div>
        )}

        {/* Previous 7 Days */}
        {previous7DaysChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Previous 7 Days</span>
            {previous7DaysChats.map((c) => (
              <ChatItem key={c.id} chat={c} active={c.id === currentChatId} onSelect={handleSelectChat} onDelete={deleteChat} />
            ))}
          </div>
        )}

        {/* Older */}
        {olderChats.length > 0 && (
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Older</span>
            {olderChats.map((c) => (
              <ChatItem key={c.id} chat={c} active={c.id === currentChatId} onSelect={handleSelectChat} onDelete={deleteChat} />
            ))}
          </div>
        )}
      </div>

      {/* Navigation Links Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Evolution Dashboard</span>
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Prompt Library (30+)</span>
        </NavLink>

        <NavLink
          to="/memory"
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Prompt Memory</span>
        </NavLink>

        <NavLink
          to="/gallery"
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Media Gallery</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            isActive ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>

        {/* User profile capsule */}
        {user && (
          <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{user.name}</span>
                <span className="text-[10px] text-indigo-500 font-semibold block">Level {user.level || 1} • {user.xp || 0} XP</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function ChatItem({ chat, active, onSelect, onDelete }) {
  return (
    <div
      onClick={() => onSelect(chat.id)}
      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
        active
          ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-900'
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden pr-2">
        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
        <span className="truncate">{chat.title}</span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(chat.id);
        }}
        className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/20 transition-opacity ${
          active ? 'text-white' : 'text-slate-400 hover:text-rose-500'
        }`}
        title="Delete conversation"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

