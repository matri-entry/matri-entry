import { getUserFromStorage, getTokenFromStorage, decodeJWT, setCookie, eraseCookie } from '@/lib/utils';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user';
  expiryAt?: string;
  mobile?: string;
  email?: string;
  assignedCount?: number;
  completedCount?: number;
  firstLogin?: string;
  isActive?: boolean;
}

export function isAuthenticated(): boolean {
  const token = getTokenFromStorage();
  if (!token) return false;
  const decoded = decodeJWT(token);
  if (!decoded) return false;
  const exp = decoded.exp as number;
  if (exp && Date.now() / 1000 > exp) {
    return false;
  }
  return true;
}

export function getCurrentUser(): User | null {
  return getUserFromStorage() as User | null;
}

export function getUserRole(): string | null {
  const user = getCurrentUser();
  return user?.role || null;
}

export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    eraseCookie('auth-token');
  }
}

export function saveAuth(token: string, user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCookie('auth-token', token, 7);
  }
}

