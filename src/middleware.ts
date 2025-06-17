
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is currently a placeholder.
// For robust server-side protection, you would verify a session cookie or token here.
// async function isAuthenticated(request: NextRequest): Promise<boolean> {
//   const sessionCookie = request.cookies.get('__session'); // Example cookie name
//   if (!sessionCookie) {
//     return false;
//   }
//   // In a real app, you would verify the token here.
//   // For now, client-side guards handle redirection.
//   return !!sessionCookie; // Simplified placeholder
// }


export async function middleware(request: NextRequest) {
  // const { pathname } = request.nextUrl;

  // const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  // const isAppPage = pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/chat');
  
  // const authenticated = await isAuthenticated(request);

  // Client-side routing and authentication checks in layouts/pages are currently
  // responsible for handling redirection. This middleware remains for potential future
  // server-side session validation if needed.
  
  // if (isAuthPage) {
  //   if (authenticated) {
  //     // return NextResponse.redirect(new URL('/dashboard', request.url));
  //   }
  // } else if (isAppPage) {
  //   if (!authenticated) {
  //     // return NextResponse.redirect(new URL('/login', request.url));
  //   }
  // }
  
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
