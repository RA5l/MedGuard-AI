import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Surface the backend's actual error detail (FastAPI returns {detail: "..."})
// instead of axios's generic "Request failed with status code 502" - that
// generic message hides the real reason (e.g. which downstream call failed
// and why) and makes debugging integration issues much harder.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') {
      error.message = detail;
    } else if (Array.isArray(detail) && detail[0]?.msg) {
      // FastAPI validation errors (422) return a list of {msg, loc, ...}
      error.message = detail.map((d: { msg: string }) => d.msg).join('; ');
    }
    return Promise.reject(error);
  }
);

export default api;
