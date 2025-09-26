// src/utils/http.ts
export const authHeaders = (): Record<string, string> => {
  const t =
    localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    '';

  // vždy vrátime Record<string,string> (žiadny union)
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const jsonHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...authHeaders(),
});

