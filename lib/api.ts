import axios from "axios";

const api = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const t = localStorage.getItem("unilink_token");
    if (t) config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("unilink_token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(e);
  }
);

export const authAPI = {
  register: (d: any) => api.post("/auth/register", d),
  login:    (d: any) => api.post("/auth/login", d),
  logout:   ()       => api.post("/auth/logout"),
  me:       ()       => api.get("/auth/me"),
  updateProfile: (d: any) => api.put("/auth/me", d),
  updateSettings: (d: any) => api.patch("/auth/me", d),   // ← NOUVEAU
  deleteAccount:  ()       => api.delete("/auth/me"),      // ← NOUVEAU
};

export const postsAPI = {
  getFeed:  (tab: string, page: number) => api.get(`/posts/feed?tab=${tab}&page=${page}&limit=10`),
  getByUser:(userId: string, tab: string) => api.get(`/posts/user/${userId}?tab=${tab}`),
  create:   (d: any)  => api.post("/posts", d),
  update:   (id: string, d: any) => api.put(`/posts/${id}`, d),
  delete:   (id: string) => api.delete(`/posts/${id}`),
  like:     (id: string) => api.post(`/posts/${id}/like`),
  unlike:   (id: string) => api.delete(`/posts/${id}/like`),
  save:     (id: string) => api.post(`/posts/${id}/save`),
  unsave:   (id: string) => api.delete(`/posts/${id}/save`),
  share:    (id: string) => api.post(`/posts/${id}/share`),
  getTrending: () => api.get("/posts/trending"),
};

export const commentsAPI = {
  getByPost: (pid: string) => api.get(`/posts/${pid}/comments`),
  create:    (pid: string, content: string) => api.post(`/posts/${pid}/comments`, { content }),
  delete:    (pid: string, cid: string) => api.delete(`/posts/${pid}/comments/${cid}`),
};

export const usersAPI = {
  getProfile:     (id: string)   => api.get(`/users/${id}`),
  search:         (q: string, department?: string, level?: string) => {
    const p = new URLSearchParams({ q });
    if (department && department !== "Tous") p.set("department", department);
    if (level && level !== "Tous") p.set("level", level);
    return api.get(`/users/search?${p}`);
  },
  getSuggestions: ()             => api.get("/users/suggestions"),
  follow:         (id: string)   => api.post(`/users/${id}/follow`),
  unfollow:       (id: string)   => api.delete(`/users/${id}/follow`),
  getFollowers:   (id: string)   => api.get(`/users/${id}/followers`),
  getFollowing:   (id: string)   => api.get(`/users/${id}/following`),
};

export const notificationsAPI = {
  getAll:      ()           => api.get("/notifications"),
  markRead:    (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: ()           => api.put("/notifications/read-all"),
};

// APRÈS — structure plate correcte
export const messagesAPI = {
  getConversations: () =>
      api.get("/messages/conversations"),
  getMessages: (userId: string) =>
      api.get(`/messages/${userId}`),
  send: (receiverId: string, content: string) =>
      api.post("/messages", { receiverId, content }),
};

export default api;
