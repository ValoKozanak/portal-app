// src/utils/http.ts
export const authHeaders = (): Record<string, string> => {
  const t = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};
