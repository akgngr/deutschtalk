
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// For actual token verification, you'd use Firebase Admin SDK
// import { getAuth } from 'firebase-admin/auth';
// import { initializeAdminApp } from '@/lib/firebase-admin'; // You'd create this

// Placeholder: In a real app, verify the Firebase ID token from a cookie
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const sessionCookie = request.cookies.get('__session'); // Example cookie name
  if (!sessionCookie) {
    return false;
  }
  // In a real app:
  // initializeAdminApp(); // Ensure Firebase Admin is initialized
  // try {
  //   await getAuth().verifySessionCookie(sessionCookie.value, true);
  //   return true;
  // } catch (error) {
  //   return false;
  // }
  // For this scaffold, we'll use a simpler, less secure placeholder.
  // Relying on client-side auth state for now for redirects.
  // This middleware is more of a structural placeholder for robust server-side auth.
  return !!sessionCookie; // Simplified: just checks if cookie exists. Not secure for production.
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isAppPage = pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/chat');
  
  // This is a placeholder for checking authentication status.
  // In a real app, you would verify a session cookie or token.
  // For now, this won't effectively protect routes without client-side cooperation or actual token verification.
  const authenticated = await isAuthenticated(request);

  if (isAuthPage) {
    if (authenticated) {
      // If user is authenticated and tries to access login/register, redirect to dashboard
      // This part might be better handled client-side with Firebase Auth state listener for smoother UX
      // return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else if (isAppPage) {
    if (!authenticated) {
      // If user is not authenticated and tries to access app pages, redirect to login
      // This also might be better client-side for initial load, server-side for API protection
      // return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
