import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      refreshing = true;
      const refresh = localStorage.getItem('bf_refresh');
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken: refresh });
          const { accessToken } = res.data.data;
          localStorage.setItem('bf_token', accessToken);
          queue.forEach(p => p.resolve(accessToken));
          queue = [];
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          queue.forEach(p => p.reject());
          queue = [];
          localStorage.clear();
          window.location.href = '/login';
        } finally {
          refreshing = false;
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Typed API helpers ─────────────────────────────
export const AuthAPI = {
  register: d  => api.post('/auth/register', d),
  login:    d  => api.post('/auth/login', d),
  me:       () => api.get('/auth/me'),
  forgotPassword: e => api.post('/auth/forgot-password', { email: e }),
  resetPassword: (t, p) => api.post(`/auth/reset-password/${t}`, { password: p }),
};

export const BotsAPI = {
  list:              ()      => api.get('/bots'),
  get:               id      => api.get(`/bots/${id}`),
  create:            d       => api.post('/bots', d),
  update:            (id, d) => api.put(`/bots/${id}`, d),
  delete:            id      => api.delete(`/bots/${id}`),
  setStatus:         (id, s) => api.patch(`/bots/${id}/status`, { status: s }),
  connectWA:         (id, d) => api.post(`/bots/${id}/whatsapp/connect`, d),
  connectTelegram:   (id, d) => api.post(`/bots/${id}/telegram/connect`, d),
  disconnectTelegram:(id)    => api.post(`/bots/${id}/telegram/disconnect`),
};

export const KnowledgeAPI = {
  list:    botId          => api.get(`/knowledge/${botId}`),
  upload:  (botId, file)  => {
    const form = new FormData(); form.append('file', file);
    return api.post(`/knowledge/${botId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  addText: (botId, text, name) => api.post(`/knowledge/${botId}/text`, { text, name }),
  addUrl:  (botId, url, name)  => api.post(`/knowledge/${botId}/url`, { url, name }),
  delete:  (botId, srcId)      => api.delete(`/knowledge/${botId}/${srcId}`),
  reindex: (botId, srcId)      => api.post(`/knowledge/${botId}/${srcId}/reindex`),
};

export const ConversationsAPI = {
  list:    params => api.get('/conversations', { params }),
  get:     id     => api.get(`/conversations/${id}`),
  reply:   (id, message) => api.post(`/conversations/${id}/reply`, { message }),
  resolve: id     => api.patch(`/conversations/${id}/resolve`),
  handoff: id     => api.patch(`/conversations/${id}/handoff`),
  rate:    (id, score, note) => api.post(`/conversations/${id}/rate`, { score, note }),
  delete:  id     => api.delete(`/conversations/${id}`),
};

export const AnalyticsAPI = {
  overview: (days = 30) => api.get('/analytics/overview', { params: { days } }),
  bot:      (botId, days = 30) => api.get(`/analytics/bot/${botId}`, { params: { days } }),
  volume:   (botId, days = 7)  => api.get('/analytics/conversations/volume', { params: { botId, days } }),
  languages:(botId) => api.get('/analytics/languages', { params: { botId } }),
};

export const UserAPI = {
  profile:        ()      => api.get('/users/profile'),
  updateProfile:  d       => api.put('/users/profile', d),
  changePassword: (c, n)  => api.put('/users/password', { currentPassword: c, newPassword: n }),
  usage:          ()      => api.get('/users/usage'),
};
