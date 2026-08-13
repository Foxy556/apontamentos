import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Protect /admin routes (including the root /admin)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const token = request.cookies.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect /painel routes (except /painel/login)
  if (pathname === '/painel' || (pathname.startsWith('/painel/') && pathname !== '/painel/login')) {
    const token = request.cookies.get('public_session')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/painel/login', request.url));
    }
    
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL('/painel/login', request.url));
    }
  }

  return NextResponse.next();
}

// Enterprise matcher: matches everything except static files and APIs
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

