import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie (if stored there) or we rely on client-side
  // For SSR middleware, we check a 'auth-token' cookie
  const token = request.cookies.get('auth-token')?.value;

  const isLoginPage = pathname === '/login' || pathname === '/';
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute = pathname.startsWith('/user');

  // If authenticated user tries to access login, redirect to their dashboard
  if (token && isLoginPage) {
    const decoded = decodeJWT(token);
    if (decoded) {
      const exp = decoded.exp as number;
      if (exp && Date.now() / 1000 < exp) {
        const role = decoded.role as string;
        if (role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/user/dashboard', request.url));
        }
      }
    }
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const decoded = decodeJWT(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect user routes
  if (isUserRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const decoded = decodeJWT(token);
    if (!decoded || (decoded.role !== 'user' && decoded.role !== 'admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
