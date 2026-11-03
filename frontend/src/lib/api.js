const API_BASE = '/api/v1';

let authToken = localStorage.getItem('optimind_token') || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('optimind_token', token);
  } else {
    localStorage.removeItem('optimind_token');
  }
};

export const getAuthToken = () => authToken;

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Set json content-type if body is object and not FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/signup') {
    // Attempt silent token refresh
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAuthToken(refreshData.access_token);
        headers['Authorization'] = `Bearer ${refreshData.access_token}`;
        return fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' }).then(r => r.json());
      }
    } catch {
      setAuthToken(null);
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'API Request failed');
  }

  // Return json or blob depending on header
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

export const api = {
  // Auth
  signup: (data) => apiRequest('/auth/signup', { method: 'POST', body: data }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: data }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  updateMe: (data) => apiRequest('/auth/me', { method: 'PUT', body: data }),
  changePassword: (data) => apiRequest('/auth/password', { method: 'PUT', body: data }),
  deleteAccount: () => apiRequest('/auth/me', { method: 'DELETE' }),

  // Chats
  listChats: () => apiRequest('/chats'),
  createChat: (data) => apiRequest('/chats', { method: 'POST', body: data }),
  getChat: (id) => apiRequest(`/chats/${id}`),
  updateChat: (id, data) => apiRequest(`/chats/${id}`, { method: 'PUT', body: data }),
  deleteChat: (id) => apiRequest(`/chats/${id}`, { method: 'DELETE' }),
  togglePin: (id) => apiRequest(`/chats/${id}/pin`, { method: 'POST' }),
  searchChats: (q) => apiRequest(`/chats/search?q=${encodeURIComponent(q)}`),
  shareChat: (id) => apiRequest(`/chats/${id}/share`, { method: 'POST' }),
  getSharedChat: (token) => apiRequest(`/shared/${token}`),

  // Messages
  getMessages: (chatId) => apiRequest(`/chats/${chatId}/messages`),
  editMessage: (id, content) => apiRequest(`/messages/${id}`, { method: 'PUT', body: { content } }),

  // Optimizer
  optimizePrompt: (data) => apiRequest('/optimizer/optimize', { method: 'POST', body: data }),
  scorePrompt: (prompt) => apiRequest('/optimizer/score', { method: 'POST', body: { prompt } }),
  recordOutcome: (data) => apiRequest('/optimizer/outcome', { method: 'POST', body: data }),
  runABTest: (data) => apiRequest('/optimizer/ab', { method: 'POST', body: data }),
  getStrategies: () => apiRequest('/optimizer/strategies'),
  promptAutopsy: (prompt) => apiRequest(`/optimizer/autopsy?prompt=${encodeURIComponent(prompt)}`),
  magicRewrite: (data) => apiRequest('/optimizer/rewrite', { method: 'POST', body: data }),

  // Streaks
  getMyStreak: () => apiRequest('/streaks/me'),
  getStreakCalendar: (month) => apiRequest(`/streaks/calendar${month ? `?month=${month}` : ''}`),

  // Files
  uploadFile: (formData) => apiRequest('/files/upload', { method: 'POST', body: formData }),
  getGallery: (mime) => apiRequest(`/files/gallery${mime ? `?mime_type=${mime}` : ''}`),
  deleteFile: (id) => apiRequest(`/files/${id}`, { method: 'DELETE' }),

  // Voice
  transcribeVoice: (formData) => apiRequest('/voice/transcribe', { method: 'POST', body: formData }),

  // Feedback
  submitFeedback: (data) => apiRequest('/feedback', { method: 'POST', body: data }),
  getMyFeedback: () => apiRequest('/feedback/mine'),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  snoozeNotifications: (hours) => apiRequest('/notifications/snooze', { method: 'POST', body: { hours } }),
  getVapidKey: () => apiRequest('/notifications/vapid-key'),
  subscribePush: (data) => apiRequest('/notifications/subscribe', { method: 'POST', body: data }),

  // Memory
  listMemories: () => apiRequest('/memory'),
  addMemory: (data) => apiRequest('/memory', { method: 'POST', body: data }),
  updateMemory: (id, data) => apiRequest(`/memory/${id}`, { method: 'PUT', body: data }),
  deleteMemory: (id) => apiRequest(`/memory/${id}`, { method: 'DELETE' }),

  // Templates
  listTemplates: (persona, tag) => {
    const params = new URLSearchParams();
    if (persona) params.append('persona', persona);
    if (tag) params.append('tag', tag);
    return apiRequest(`/templates?${params.toString()}`);
  },
  createTemplate: (data) => apiRequest('/templates', { method: 'POST', body: data }),
  deleteTemplate: (id) => apiRequest(`/templates/${id}`, { method: 'DELETE' }),
  useTemplate: (id) => apiRequest(`/templates/${id}/use`, { method: 'POST' }),
  forkTemplate: (id) => apiRequest(`/templates/${id}/fork`, { method: 'POST' }),

  // Analytics
  getEvolutionAnalytics: () => apiRequest('/analytics/evolution'),
  getActivityHeatmap: () => apiRequest('/analytics/heatmap'),

  // Standout Features
  getDailyChallenge: () => apiRequest('/features/challenge/today'),
  submitDailyChallenge: (user_prompt) => apiRequest('/features/challenge/submit', { method: 'POST', body: { user_prompt } }),
  getRetroOptimizations: () => apiRequest('/features/retro-optimize'),
  runArenaBattle: (data) => apiRequest('/features/arena/run', { method: 'POST', body: data }),
  voteArenaBattle: (battle_id, winner) => apiRequest('/features/arena/vote', { method: 'POST', body: { battle_id, winner } }),
  generateStudyMaterial: (data) => apiRequest('/features/study/generate', { method: 'POST', body: data }),
  listWorkflows: () => apiRequest('/features/workflows'),
  createWorkflow: (data) => apiRequest('/features/workflows', { method: 'POST', body: data }),
  runWorkflow: (id, input) => apiRequest(`/features/workflows/${id}/run`, { method: 'POST', body: { initial_input: input } }),
  listApiKeys: () => apiRequest('/features/api-keys'),
  generateApiKey: (name) => apiRequest('/features/api-keys', { method: 'POST', body: { name } }),
  getAdminStats: () => apiRequest('/features/admin/stats'),
};

