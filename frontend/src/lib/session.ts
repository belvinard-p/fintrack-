const TOKEN_KEY = "access_token";
const LOGIN_TIME_KEY = "login_time";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LOGIN_TIME_KEY);
}

export function getLoginTime(): number | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(LOGIN_TIME_KEY);
  return value ? Number(value) : null;
}

export function markLoginTime(): void {
  sessionStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
}
