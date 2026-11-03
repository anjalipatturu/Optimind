import { create } from 'zustand';
import { api, setAuthToken } from '../lib/api';

export const useAppStore = create((set, get) => ({
  // User state
  user: null,
  isAuthenticated: false,
  isLoadingUser: true,

  // UI state
  theme: localStorage.getItem('optimind_theme') || 'dark',
  language: localStorage.getItem('optimind_lang') || 'en',
  sidebarOpen: true,
  commandPaletteOpen: false,

  // Modals state
  optimizerModalOpen: false,
  activeOptimization: null,
  challengeModalOpen: false,
  arenaModalOpen: false,
  studyModalOpen: false,
  retroModalOpen: false,
  handsFreeVoiceOpen: false,

  // Chat state
  chats: [],
  currentChatId: null,
  messages: [],
  isStreaming: false,
  inputDraft: '',

  // Live prompt coach state
  liveScore: 0,
  liveBreakdown: null,
  liveTip: '',
  liveAutopsy: [],

  // Sliders
  toneSlider: 50,
  detailSlider: 50,
  expertiseSlider: 50,

  // Streaks
  streak: {
    current: 0,
    longest: 0,
    today_prompts: 0,
    qualified_today: false,
    freezes: 1,
    milestones: []
  },

  // Notifications
  notifications: [],
  unreadNotificationsCount: 0,

  // Actions
  setTheme: (theme) => {
    localStorage.setItem('optimind_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setLanguage: (language) => {
    localStorage.setItem('optimind_lang', language);
    set({ language });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Modal actions
  setOptimizerModalOpen: (open, optData = null) => set({
    optimizerModalOpen: open,
    activeOptimization: optData || get().activeOptimization
  }),
  setChallengeModalOpen: (open) => set({ challengeModalOpen: open }),
  setArenaModalOpen: (open) => set({ arenaModalOpen: open }),
  setStudyModalOpen: (open) => set({ studyModalOpen: open }),
  setRetroModalOpen: (open) => set({ retroModalOpen: open }),
  setHandsFreeVoiceOpen: (open) => set({ handsFreeVoiceOpen: open }),

  // Input & Coach
  setInputDraft: (text) => set({ inputDraft: text }),
  setLiveCoach: (score, breakdown, tip, autopsy = []) => set({
    liveScore: score,
    liveBreakdown: breakdown,
    liveTip: tip,
    liveAutopsy: autopsy
  }),
  setSliders: (tone, detail, expertise) => set({
    toneSlider: tone,
    detailSlider: detail,
    expertiseSlider: expertise
  }),

  // Auth actions
  login: async (email, password) => {
    const res = await api.login({ email, password });
    setAuthToken(res.access_token);
    set({ user: res.user, isAuthenticated: true });
    await get().fetchInitialData();
    return res;
  },

  signup: async (data) => {
    const res = await api.signup(data);
    setAuthToken(res.access_token);
    set({ user: res.user, isAuthenticated: true });
    await get().fetchInitialData();
    return res;
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {}
    setAuthToken(null);
    set({
      user: null,
      isAuthenticated: false,
      chats: [],
      currentChatId: null,
      messages: [],
    });
  },

  checkAuth: async () => {
    set({ isLoadingUser: true });
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true });
      await get().fetchInitialData();
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoadingUser: false });
    }
  },

  fetchInitialData: async () => {
    const [chats, streak, notifs] = await Promise.allSettled([
      api.listChats(),
      api.getMyStreak(),
      api.getNotifications()
    ]);

    if (chats.status === 'fulfilled') {
      set({ chats: chats.value });
      if (chats.value.length > 0 && !get().currentChatId) {
        set({ currentChatId: chats.value[0].id });
      }
    }
    if (streak.status === 'fulfilled') {
      set({ streak: streak.value });
    }
    if (notifs.status === 'fulfilled') {
      set({
        notifications: notifs.value.notifications,
        unreadNotificationsCount: notifs.value.unread_count
      });
    }
  },

  setCurrentChat: async (chatId) => {
    set({ currentChatId: chatId, messages: [] });
    if (chatId) {
      try {
        const msgs = await api.getMessages(chatId);
        set({ messages: msgs });
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }
  },

  createNewChat: async (title = "New Chat", model = "gemini-1.5-flash") => {
    try {
      const chat = await api.createChat({ title, model });
      set((state) => ({
        chats: [chat, ...state.chats],
        currentChatId: chat.id,
        messages: []
      }));
      return chat;
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  },

  deleteChat: async (chatId) => {
    try {
      await api.deleteChat(chatId);
      set((state) => {
        const filtered = state.chats.filter(c => c.id !== chatId);
        const nextId = filtered.length > 0 ? filtered[0].id : null;
        return {
          chats: filtered,
          currentChatId: state.currentChatId === chatId ? nextId : state.currentChatId
        };
      });
      if (get().currentChatId) {
        await get().setCurrentChat(get().currentChatId);
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  },

  refreshStreak: async () => {
    try {
      const streak = await api.getMyStreak();
      set({ streak });
    } catch (err) {
      console.error("Failed to refresh streak", err);
    }
  }
}));

