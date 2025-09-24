export const authHeaders = (): Record<string, string> => {
  const t =
    (typeof localStorage !== 'undefined' && (localStorage.getItem('token') || localStorage.getItem('auth_token'))) ||
    '';
  const headers: Record<string, string> = {};
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
};

// src/utils/http.ts
export const authHeaders = (): Record<string, string> => {
  const t =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token');

  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};
