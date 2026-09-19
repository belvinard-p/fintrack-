const TOKEN_KEY = "access_token";
const LOGIN_TIME_KEY = "login_time";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Strict${secure}`;
}

export function clearToken(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Strict`;
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

export function clearLoginTime(): void {
  sessionStorage.removeItem(LOGIN_TIME_KEY);
}
